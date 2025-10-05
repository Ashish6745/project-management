import { Router } from "express";
const router = Router();
import {loginUser, logoutUser, registerUser} from '../controllers/auth.controllers.js';
import  {userRegisterValidator, loginValidator} from '../validators/validators.js'
import {validate} from '../middlewares/validator.middlewares.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";



router.route('/register').post(userRegisterValidator(), validate,registerUser);
router.route('/login').post(loginValidator(), validate, loginUser);
// secured routes
router.route('/logout').post(verifyJWT, logoutUser);


export default router;