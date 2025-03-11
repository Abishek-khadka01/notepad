import { NextFunction, Router, Request, Response } from "express";
import { AddProfilePicture, UserLogin, UserLogOut, UserRegister, GetProfileDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import multer from "multer"
import { AuthMiddleware } from "../middlewares/auth.js";

const UserRouter = Router()

UserRouter.post("/register", UserRegister)
UserRouter.post("/login", UserLogin)
UserRouter.use(AuthMiddleware)
UserRouter.put("/logout",  UserLogOut)
UserRouter.post("/add-profile", upload.single("profile") , AddProfilePicture)
UserRouter.get("/profile-details", GetProfileDetails)





export {UserRouter}