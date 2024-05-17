// require('dotenv').config({path : './.env'});

import dotenv from 'dotenv';
import connectDB from './db/index.js';
dotenv.config({path : './.env'});
connectDB();






































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