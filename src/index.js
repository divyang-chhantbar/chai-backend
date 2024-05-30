// require('dotenv').config({path : './.env'});

import dotenv from 'dotenv';
import connectDB from './db/index.js';
import {app} from './app.js';

dotenv.config({path : './.env'});

const port = process.env.PORT || 5000;
connectDB()
// till now we have just connected to the database now we will start the server
// usually after the async await we get the promises at the production level .
.then(()=> {
    app.listen(port,()=>{console.log(`Server is running on port ${port}`)})
})
.catch((error)=> {
    console.log("Error",error);
    throw error;
})





































// import express from 'express';
// const app = express();

// ;(async ()=> {
//     try {
//         mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
//         console.log('Connected to MongoDB');
//         // after getting connected to database we will have a listener which will say if we get connected to the database or not .
//         app.on('error', (err) => {
//             console.log("error in connecting to the database", err);
//             throw err;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is running on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("Error",error);
//         throw error;
//     }
// })()