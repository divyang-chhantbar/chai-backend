import {asyncHandler} from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/User.js";
import {uploadonCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



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
        const avatarLocalPath= req.files?.avatar[0]?.path;
        const coverLocalPath = req.files?.cover[0]?.path;
        //  here we will take avatar and in the field we can have a lot of props like png jpg , size but we have taken its very first property coz we can get the object of it and we can set the path  

        if(!avatarLocalPath) throw new ApiError(400,"Avatar file is required")
            // upload them to cloudinary 

       const avatar =  await uploadonCloudinary(avatarLocalPath)
       const coverImage = await uploadonCloudinary(coverLocalPath)

       if(!avatar || !cover) throw new ApiError(500,"Failed to upload image")

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


export {registerUser}