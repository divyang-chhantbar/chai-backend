import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

// This middleware is used to check if the user is already authenticated
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract the token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");

    // If no token is found, throw an unauthorized error
    if (!token) throw new ApiError(401, "Unauthorized request");

    // Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If no user is found, throw an invalid token error
    if (!user) throw new ApiError(401, "Invalid token");

    // Attach the user to the request object
    req.user = user;

    // Call the next middleware in the stack
    next();
  } catch (error) {
    // If any error occurs, pass it to the error handler middleware
    next(new ApiError(401, error?.message || "Invalid Access Token"));
  }
});
