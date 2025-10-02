import {User} from '../models/users.models.js';
import {ApiResponse} from '../utils/api-response.js';
import {ApiError} from '../utils/api-errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import {sendMail} from '../utils/mail.js';


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
        mailGenContent:emailVerificationMailContent(
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


export {registerUser};