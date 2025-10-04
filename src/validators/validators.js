import { body } from "express-validator";



const userRegisterValidator = () => {
    return [
        body("email")
        .trim()
        .notEmpty().withMessage("Email is Required")
        .isEmail().withMessage("Email is inValid"),

         body("username")
        .trim()
        .notEmpty().withMessage("UserName is Required")
        .isLowercase().withMessage("Username must be in lowercase")
        .isLength({min:3}).withMessage("Username must be 3 characters long"),
         body("password")
        .trim()
        .notEmpty().withMessage("Password is Required"),
        body("fullName").optional().trim()

    ]
};


const loginValidator = () => {
  return [


        body("email").optional().isEmail().withMessage("Email is invalid"),
        body("password").notEmpty().withMessage("Password is required")



  ];
};



export {userRegisterValidator, loginValidator};