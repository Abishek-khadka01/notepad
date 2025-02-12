import { NextFunction, Router, Request, Response } from "express";
import { AddProfilePicture, UserLogin, UserLogOut, UserRegister } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import multer from "multer"

const UserRouter = Router()

UserRouter.post("/create", UserRegister)
UserRouter.post("/login", UserLogin)
UserRouter.put("/logout", UserLogOut)
UserRouter.post("/create-file", 
    upload.single("profile")
    , AddProfilePicture)





export {UserRouter}