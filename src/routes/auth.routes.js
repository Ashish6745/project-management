import { Router } from "express";
const router = Router();
import {loginUser, registerUser} from '../controllers/auth.controllers.js';
import  {userRegisterValidator, loginValidator} from '../validators/validators.js'
import {validate} from '../middlewares/validator.middlewares.js'




router.route('/register').post(userRegisterValidator(), validate,registerUser);
router.route('/login').post(loginValidator(), validate, loginUser);


export default router;