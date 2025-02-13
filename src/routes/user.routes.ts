import { NextFunction, Router, Request, Response } from "express";
import { AddProfilePicture, UserLogin, UserLogOut, UserRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import multer from "multer"
import { AuthMiddleware } from "../middlewares/auth.js";

const UserRouter = Router()

UserRouter.post("/register", UserRegister)
UserRouter.post("/login", UserLogin)
UserRouter.put("/logout",AuthMiddleware,  UserLogOut)
UserRouter.post("/create-file", AuthMiddleware, 
    upload.single("profile")
    , AddProfilePicture)





export {UserRouter}