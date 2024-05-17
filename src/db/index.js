import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async()=> {
     try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host} \n`)
        // What does this do ? 
        // After the connection we can hold the responses and we can listen to the responses and we can also listen to the errors that are coming from the database.
        // ye aksar isiliye karaya jata hai ki agar hum production k alava koi aur server me jana chahte hai toh hume pata chal jata hai ki humara connection sahi hai ya nahi.
    }
    /* In connectionInstance we are getting a response that is "After the connection we can hold the responses " */
    catch (error) {
        console.log("Error",error)
        process.exit(1)
    }
}
export default connectDB;