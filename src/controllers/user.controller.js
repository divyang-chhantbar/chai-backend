import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //give the refresh token to the user and save it in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // we use validateBeforeSave : false coz we dont want to validate the password and other fields again and again
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Refresha and Access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // things to do while writing backend for user registration :
  // get user details from the frontend
  // validation - not empty
  // check if the user is already exist : username , email
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user object - create entry in db
  // remove password and refresh token from the response
  // check for user creation
  // return response to the frontend

  // to get the data from the frontend we will use req. and can access the data from the frontend
  const { fullName, username, email, password } = req.body;
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // here .some is used to check if any of the field is empty or not usually .some is used to check if any of the element in the array is true or not

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  // findOne helps for the query to find the user with the unique username or email
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // now we know that req.body can help us to get the data ok but here in the routes we have given middleware into the routes which gives us req.files
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //  here we will take avatar and in the field we can have a lot of props like png jpg , size but we have taken its very first property coz we can get the object of it and we can set the path

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");
  // upload them to cloudinary

  const avatar = await uploadonCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadonCloudinary(coverImageLocalPath)
    : { url: "" };

  if (!avatar || !coverImage) throw new ApiError(500, "Failed to upload image");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    // if cover image is not there then we will keep it empty
    email,
    // we will give limit that password must be 8 characters long and not focus on hashing
    password: password,
    username: username.toLowerCase(),
  });
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated)
    throw new ApiError(500, "Something went wrong while creating user");

  return res
    .status(201)
    .json(new ApiResponse(201, userCreated, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //
  const { email, password, username } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Please provide email or username");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist .");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // above line is used to remove the password and refresh token from the response and we have used it becauase we dont want to send the password and refresh token to the frontend

  const options = {
    httpOnly: true,
    secure: true,
  };
  // by doing this what happen is you cookie is bydefault can be modified . but by making httpOnly and Secure : true we can make it more secure and can not be modified by frontend
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Update the user's refresh token to undefined
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    return res.status(404).json(new ApiResponse(404, {}, "User not found"));
  }

  // Remove the Authorization header
  req.headers["authorization"] = "";

  // Define options for clearing cookies
  const options = {
    httpOnly: true,
    secure: true, // Use secure cookies if you're using HTTPS
    sameSite: "None", // You may need this if you're testing with different domains
  };

  // Clear the cookies and respond with a success message
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

  // ApiError is a type of ApiResponse
  // we have to verify the refresh token as well as we will get the decoded information or atleast we get decoded token remember : token that goes to user and the token saved in database are different because the token that goes to user are mostly encrypted and we need a raw token that we get from the database

 try {
     const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
     );
   
     const user = await User.findById(decodedToken?.id);
   
     if (!user) throw new ApiError(401, "Invalid Refresh Token ");
   
     if (user?.refreshToken !== incomingRefreshToken)
       throw new ApiError(401, "Refresh Token is expired");
   
     options = {
       httpOnly: true,
       secure: true,
     };
   
    const {accessToken,newRefreshToken} =  await generateAccessAndRefreshToken(user._id);
     
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(new ApiResponse(200,{accessToken,newRefreshToken},'Token refreshed successfully'));
 } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token ");
 }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get the user id from the req.user
  // get the current password from the req.body
  // check if the password is correct
  // if its not correct throw an error and change the password
  // return the response
  const {oldPassword,newPassword,confirmPassword} = req.body; 
  // we have to get the old password and new password from the req.body
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect) {
    throw new ApiError(401,'Invalid Password');
  }

  user.password = newPassword;
  if(newPassword !== confirmPassword) {
    throw new ApiError(400,'Passwords do not match');
  }
 await user.save({validateBeforeSave : false}); // we have to save the user and we have to validate the password before saving it

 return res
 .status(200)
 .json(new ApiResponse(200,{},'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // get the user id from the req.user
  // find the user by id
  // return the response
  return res
  .status(200)
  .json(200,req.user,'User found successfully');
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const{fullName,email} = req.body;
  if(!fullName || !email) {
    throw new ApiError(400,'All fields are required');
  }
  const user = User.findByIdAndUpdate(req.user?._id,{
    $set : {
      fullName : fullName,
      email : email
    }
  },{
    new : true
  }.select("-password"))
  if(!user) {
    throw new ApiError(404,'User not found');
  }
  return res
.status (200)
.json(new ApiResponse(200,user,'User updated successfully'));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadonCloudinary(avatarLocalPath);

  if(!avatar.url) throw new ApiError(500,'Failed to upload image');

  const oldAvatar = req.user?.avatar.url;
  if (oldAvatar) {
    try {
      await cloudnary.uploader.destroy(oldAvatar);
    } catch (error) {
      console.error(`Error removing old avatar: ${error}`);
    }
  } 

  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set : {
      avatar : avatar.url
    }
  },{
    new : true
  }).select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200,user,'Avatar updated successfully'));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) throw new ApiError(400, "Cover file is missing");

  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  if(!coverImage.url) throw new ApiError(500,'Failed to upload image');

  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set : {
      avatar : coverImage.url
    }
  },{
    new : true
  }).select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200,user,'Cover Image updated successfully'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params
  if(!username?.trim()) {
    throw new ApiError(400,'Username is required');
  }
 const channel =  await User.aggregate([
  {
    $match : {
      username : username?.toLowerCase()
    }
  },
  {
    $lookup : {
      from : "subscriptions",
      localField : "_id",
      foreignField : "channel",
      as : "subscribers"
    }
  },
  {
    $lookup : {
      from : "subscriptions",
      localField : "_id",
      foreignField : "subscriber",
      as : "subscribedTo"
    }
  },
  {
    $addFields : {
      subscriberCount : {
        $size : "$subscribers"
      },
      channelSubscribedToCount : {
        $size : "$subscribedTo"
      },
      isSubscribed : {
        $cond : {
          if : {
            $in : [req.user?._id,"$subscribers.subscriber"]
          },
          then : true,
          else : false
        }
      }
    }
  },
  {
    $project : {
      fullName : 1,
      username : 1,
      subscriberCount : 1,
      channelSubscribedToCount : 1,
      isSubscribed : 1,
      avatar : 1,
      coverImage : 1,
      email : 1,
    }
  }
 ])
  if(!channel?.length) {
    throw new ApiError(404,'Channel not found');
  }
  return res
  .status(200)
  .json(new ApiResponse(200,channel[0],' User channel fetched successfully'));  
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails,updateAvatar,updateCoverImage,getUserChannelProfile};
