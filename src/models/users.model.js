import mongoose from "mongoose";
import { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
// we can't just encrypt the password and store it in the database we need a middleware hook "Pre" to encrypt the password before saving it to the database
//jwt is a bearer token iska matlab he jo isko bear krta hai wo iska owner hai yaniki jiske pass ye token hoga usko hum data bhej rahe hai  

const UserSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index  : true // Indexing the field for faster search
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, // cloudinary url
            // required : false,
        },
        coverImage : {
            type : String,
            //  required : false,
        },
        watchHistory : [{
            type : Schema.Types.ObjectId,
            ref : "Video"
        }],
        password : {
            type : String,
            required : [true , "Password is required" ]
        },
        refreshToken : {
            type : String,
        },
}
,{timestamps: true});

UserSchema.pre("save", async function (next) {
    if(!this.isModified("password")) next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
}) // inside it we can add the events like save, update, delete, etc

UserSchema.methods.isPasswordCorrect = async function(password) {
    const hashedPassword = this.password;
  return await bcrypt.compare(password, hashedPassword);
  };
UserSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullName : this.fullName,
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
    // i have missed writing a return statement which was giving me the undefined value of token .
} 
UserSchema.methods.generateRefreshToken = function() {
  return  jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullName : this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", UserSchema);