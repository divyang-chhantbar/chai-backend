import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../utils/multer.js";

const router = Router();

// writing the routes
router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },{
            name : "cover",
            maxCount : 1
        }
    ]),
    registerUser)

export default router;