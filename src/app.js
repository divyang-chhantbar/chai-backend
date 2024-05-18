import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials : true
    }
))

// ho kya rha hai yaha pe ki data is gonna come from everywhere so we are preparing our app to get withstand it whether it can be json or can come from URL or can be a cookie so in order to get that we are using this middleware so lets see how we can use this :

app.use(express.json({limit: "16kb"}));
// earlier express use to use body parser but now it is inbuilt in express so we can use it directly like this

app.use(express.urlencoded({extended: true, limit : "16kb"}));
// this is used to parse the data which is coming from the URL like if we search divyang chhantbar on google it will give divyang%20 chhantbar so this is used to parse that data and make it readable .

app.use(express.static("public")) // public isiliye ki humare local comp me unka mention kiya gaya hain .
// we have write this "The static thing : " ye kuch nai krta kahi bar agar hum files, folder store krna chahte hain to ye ek public folder bana dete he k access krlo inhe .

app.use(cookieParser())
// use of cookie parser : in our server from the user's browser's cookies ko accept kr paye ya to set kr sake .


export{app};

// now we will go for more standardization of our code we are seeing that some of the code need a same wrapper code so we will add that thing to utility folder and we will use that thing in our code so that we can make our code more standardize and more readable and more maintainable .  