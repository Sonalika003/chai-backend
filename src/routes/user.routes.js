import { Router } from "express";
import { loginUser,logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
) //  /register lgane pr registerUser call ho jaega

router.route("/login").post(loginUser)

// secured route
router.route("/logout").post( verifyJWT, logoutUser)

export default router