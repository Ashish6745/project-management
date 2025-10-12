import { Router } from "express";
const router = Router();
import {changeCurrentPassword, forgotPasswordRequest, getUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendEmailVerification, resetForgotPassword, verifyEmail} from '../controllers/auth.controllers.js';
import  {userRegisterValidator, loginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator,userChangeCurrentPasswordValidator} from '../validators/validators.js'
import {validate} from '../middlewares/validator.middlewares.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";


// un secured routes
router.route('/register').post(userRegisterValidator(), validate,registerUser);
router.route('/login').post(loginValidator(), validate, loginUser);
router.route('/verify-email/:verificationToken').get(verifyEmail);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/forgot-password').post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route('/reset-password/:resetToken').post(userResetForgotPasswordValidator(),validate, resetForgotPassword);





// secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/current-user').get(verifyJWT, getUser);
router.route('/change-password').post(verifyJWT, userChangeCurrentPasswordValidator(), validate,  changeCurrentPassword);
router.route('/resend-email-verification').post(verifyJWT, resendEmailVerification);


export default router;