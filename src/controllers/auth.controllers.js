import {User} from '../models/users.models.js';
import {ApiResponse} from '../utils/api-response.js';
import {ApiError} from '../utils/api-errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import {sendMail,emailVerificationMailContent} from '../utils/mail.js';


// generating refresh tokens ..

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // first find the user by using the userID
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});
        return {refreshToken,accessToken};
        
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating access token!!');
    }
};



const registerUser = asyncHandler(async (req, res) => {
    const {email, username, password, role} = req.body;

   // checking if user already exists


   const existingUser = await User.findOne({
    $or:[{email}, {username}]
   });


  if(existingUser){
    throw new ApiError(409, "User with email or username already exists in the database.",[]);
  }



  // Now saving the new User to the database ......
                const user = await User.create({
                        email,password, username, isEmailVerified:false
                    });


    const {unHashedToken, hashedToken, tokenExpiry}  = user.generateTemporaryToken();

     user.emailVerificationToken = hashedToken;
     user.emailVerificationDate = tokenExpiry;

     // saving the user
         await user.save({validateBeforeSave:false});

  
    await sendMail({
        email:user?.email,
        subject:"Please verify your Email",
        mailgenContent:emailVerificationMailContent(
            user.username,
            // generating the dynamic verification Url
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });

 const createdUser =    await User.findById(user._id).select(
        "-password -emailVerificationToken -emailVerificationDate -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, 'Something went wrong while registring a user.')
    }



    return res.status(201).json(
        new ApiResponse(
            200,
            {user:createdUser},
            'User registered Successfully and emai verification link has been sent on Your Email.'
        )
    );


});




const loginUser = asyncHandler(async (req, res) => {
     const {username, password, email} = req.body;
  // if username or email is not present
   if(!username || !email){
    throw new ApiError(400,"Username or email is required.")
   }
   

   // if present ... find the user by email 
   const user = await User.findOne({email});

   // if user does not exists in the database
   if(!user){
        throw new ApiError(400,"User does not exists in the database.")
   }


   // check if the given password is correct or not

   const isPasswordValid = user.isPasswordCorrect(password);
 // if the password is not correct
   if(!isPasswordValid){
     throw new ApiError(400,"Invalid Password");
   }

   // if password is correct generate refresh and access token for them.

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
   // removing the un-neccessary fields to be removed from the response.
   const loggedInUser =    await User.findById(user._id).select(
        "-password -emailVerificationToken -emailVerificationDate -refreshToken"
    );

    // options for cookies
    const options  = {
        httpOnly : true,
        secure : true
    };


    return res.status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(
                200,

              {
                user: loggedInUser,
                refreshToken,
                accessToken
              },
              "User Logged In Successfully"
            )
          )




});




const logoutUser = asyncHandler(async (req, res) => {
         await User.findByIdAndUpdate(req.user._id, {refreshToken:""}, {new:true});
           const options  = {
        httpOnly : true,
        secure : true
    };

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});


const getUser = asyncHandler(async (req, res) => {

   return res.status(200).json(
    new ApiResponse(200, {user:req.user}, "Current User fetched Successfully")
   );
});

// verify Email Contoller 

const verifyEmail = asyncHandler(async (req, res) => {

    const {veruificationToken} = req.params;
  
    if(!veruificationToken){
      throw  new ApiError(400, "Email Verification token is missing in the url.");
    }

    let hashedToken = crypto.createHash("sha256").update(veruificationToken).digest("hex");


    const user =  await User.findOne({
        emailVerificationToken:hashedToken,
        emailVerificationDate:{$gt: Date.now()}   // gt means greater than
    });
    
    if(!user){
        throw new ApiError(400, "Invalid or Expired Email Verification Token");
    }
    // user is found then verify the email of the user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationDate = undefined;
    user.save({validateBeforeSave:false});

    return res.status(200).json(
        new ApiResponse(200, {isEmailVerified : true}, "Email Verified Successfully")
    );

});


export {registerUser, loginUser, logoutUser, getUser };