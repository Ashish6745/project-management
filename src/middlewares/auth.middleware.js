import {User} from '../models/users.models.js';
import { ApiError } from '../utils/api-errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import jwt from 'jsonwebtoken';


export const verifyJWT = asyncHandler(async (req, res, next) => {
    
  const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
  if(!token){
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken =   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
     const user =  await User.findById(decodedToken?._id).select( "-password -emailVerificationToken -emailVerificationDate -refreshToken");
      if(!user){
        throw new ApiError(401, "Invalid Access Token");
       }

       req.user = user;
       next();

  } catch (error) {
     throw new ApiError(401, "Invalid Access Token");
  }

});