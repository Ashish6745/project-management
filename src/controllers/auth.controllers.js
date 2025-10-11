import {User} from '../models/users.models.js';
import {ApiResponse} from '../utils/api-response.js';
import {ApiError} from '../utils/api-errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import {sendMail,emailVerificationMailContent} from '../utils/mail.js';
import jwt from 'jsonwebtoken';

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



const resendEmailVerification = asyncHandler(async (req,res) => {
   const user = await User.findById(req.user._id);
   if(!user){
    throw new ApiError(404, "User does not found in the database");
   }
   // if email is already verified
   if(user.isEmailVerified){
    throw new ApiError(409, "Email is already verified");
   }
   const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationDate = tokenExpiry;
    await user.save({validateBeforeSave:false});

   // send mail ro the user if email is not verified
   await sendMail({
    email:user.email,
    subject:"Please verify your email",
    mailgenContent:emailVerificationMailContent(
        user.username,
        `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
    )
   });

   return res.status(200).json(
    new ApiResponse(200, {}, "Resend Email Verification Link has been sent to your email successfully.")
   )
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
     
    if(!incomingRefreshToken){
        throw new ApiError(401,"UnAuthorized Access");
    }


    try {
    const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user =  await User.findById(decodedToken._id);
     if(!user){
        throw new ApiError(401,"Invalid Refresh Token");
    }

    if(user.refreshToken !== incomingRefreshToken){
        throw new ApiError(401,"Refresh Token is Expired");
    }
    
    const options  = {
        httpOnly : true,
        secure : true
    };


    const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;

    await user.save({validateBeforeSave:false});
    return res.status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", newRefreshToken, options)
          .json(
            new ApiResponse(
                200,"Refresh Token Generated Successfully",
              {
                accessToken,
                refreshToken:newRefreshToken
                }
            )
          );

    } catch (error) {
        throw new ApiError(401,"Invalid or Expired Refresh Token");
    }




});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const {email} = req.body;
    // find the user by email
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(404, "User does not found in the database",[]);
    }
    // if user is found then generate the temporary token for them
    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({validateBeforeSave:false});
    // send mail to the user
     await sendMail({
        email:user?.email,
        subject:"Please reset your password",
        mailgenContent:forgotPasswordMailContent(
            user.username,
            // generating the dynamic verification Url
            `${req.protocol}://${req.get("host")}/api/v1/users/forgot-password/${unHashedToken}`
        )
    });
    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset link has been sent to your email successfully.")
    );
});


// reset Password controller 
const resetForgotPassword = asyncHandler(async (req, res) => {
    const {resetToken} = req.params;
    const {newPassword} = req.body;
    let hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
        forgotPasswordToken:hashedToken,
        forgotPasswordExpiry:{$gt: Date.now()}
    });
    // user is not found
    if(!user){
        throw new ApiError(400, "Token is invalid or expired",[]);
    }

    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    user.password = newPassword;
    await user.save();
    return res.status(200).json(
        new ApiResponse(200, {}, "Password has been reset successfully, Please login again.")
    );
});


// change current password controller ................... 

const changeCurrentPassword = asyncHandler(async (req, res) => {

       const {oldPassword, newPassword} = req.body;
       const user = await User.findById(req.user._id);
     
       const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
       if(!isPasswordCorrect){
        throw new ApiError(400, "Old Password is incorrect",[]);
       }

         user.password = newPassword;
            await user.save({validateBeforeSave:false});
            return res.status(200).json(
                new ApiResponse(200, {}, "Password has been changed successfully, Please login again.")
            );
});









export {registerUser, loginUser, logoutUser, getUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, changeCurrentPassword };