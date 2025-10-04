import { validationResult } from "express-validator";
import {ApiError} from '../utils/api-errors.js';


export const validate = (req, res, next) => {

 const errors = validationResult(req);
 // If no errors are found
 if(errors.isEmpty()){
    return next();
 }
 // If errors found 
 const extractedErrors = [];
 errors.array().map((err) => extractedErrors.push({
    [err.path] : err.msg
 }));



 throw new ApiError(
    422,
    "Received Data is Invalid",
    extractedErrors
 )






}

