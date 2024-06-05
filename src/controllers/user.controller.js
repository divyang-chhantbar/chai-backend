import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadonCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async(userId)=>{
    try {
      const user =  await User.findById (userId);
      const accessToken = user.generateAccessToken(); 
      const refreshToken = user.generateRefreshToken();

      //give the refresh token to the user and save it in the database
      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave : false});
      // we use validateBeforeSave : false coz we dont want to validate the password and other fields again and again
      return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Refresha and Access token")
    }
}
const registerUser = asyncHandler(async(req,res) => {
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
        const{fullName,username,email,password}= req.body;
        if(
            [fullName,username,email,password].some((field)=> field?.trim()=== "")
        )
        {
            throw new ApiError(400,"All fields are required");
        }
        // here .some is used to check if any of the field is empty or not usually .some is used to check if any of the element in the array is true or not

        if (password.length < 8) {
            throw new ApiError(400, "Password must be at least 8 characters long");
        }

        const existedUser = await User.findOne({
                $or : [{username},{email}]
            })
        // findOne helps for the query to find the user with the unique username or email
        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists")
        }
        // now we know that req.body can help us to get the data ok but here in the routes we have given middleware into the routes which gives us req.files
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0)
            {
                coverImageLocalPath = req.files.coverImage[0].path;
            }

        //  here we will take avatar and in the field we can have a lot of props like png jpg , size but we have taken its very first property coz we can get the object of it and we can set the path  

        if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required")
            // upload them to cloudinary 

       const avatar =  await uploadonCloudinary(avatarLocalPath)
       const coverImage = coverImageLocalPath ? await uploadonCloudinary(coverImageLocalPath) : { url: "" };       

       if(!avatar || !coverImage) throw new ApiError(500,"Failed to upload image")

        const user = await User.create(
            {
                fullName,
                avatar : avatar.url,
                coverImage : coverImage?.url||"",
                // if cover image is not there then we will keep it empty
                email,
                // we will give limit that password must be 8 characters long and not focus on hashing
                password : password,
                username : username.toLowerCase()
            }
        )
       const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
        if(!userCreated) throw new ApiError(500,"Something went wrong while creating user")
        
        return res.status(201).json(
            new ApiResponse(201,userCreated,"User created successfully")
        )
    })

const loginUser = asyncHandler(async(req,res) => {
    //
    const {email,password,username} = req.body;
    if (!username && !email) {
        throw new ApiError(400,"Please provide email or username");
    }
    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if (!user) {
        throw new ApiError(404,"User does not exist .")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid credentials")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // above line is used to remove the password and refresh token from the response and we have used it becauase we dont want to send the password and refresh token to the frontend

    const options = {
        httpOnly : true,
        secure : true
    }
    // by doing this what happen is you cookie is bydefault can be modified . but by making httpOnly and Secure : true we can make it more secure and can not be modified by frontend
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user : loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    // Update the user's refresh token to undefined
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    });

    if (!updatedUser) {
        return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

   // Remove the Authorization header
   req.headers['authorization'] = '';

    // Define options for clearing cookies
    const options = {
        httpOnly: true,
        secure: true, // Use secure cookies if you're using HTTPS
        sameSite: 'None' // You may need this if you're testing with different domains
    };

    // Clear the cookies and respond with a success message
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export {registerUser,loginUser,logoutUser}