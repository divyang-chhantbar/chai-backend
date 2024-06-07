import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
  try {
      const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
      // console.log(token);
      if (!token) {
          throw new ApiError(401, "Unauthorized request")
      }
      // console.log('Token:', token);
      console.log('Token in headers:', req.header('Authorization'));
      console.log('Token in cookies:', req.cookies.accessToken);
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      console.log('Decoded Token:', decodedToken);
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
      if (!user) {
          
          throw new ApiError(401, "Invalid Access Token")
      }
  
      req.user = user;
      // here we are passing the user to the next middleware and we can access the user in the next middleware which can help us to get the user id and other information
      next()
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
  
})