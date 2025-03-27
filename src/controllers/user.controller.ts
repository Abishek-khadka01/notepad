import { UserRegisterValidator, UserLoginValidator } from "../validators/user.validator.js";
import logger from "../utils/logger.js";
import { UserDocumentType, UserFnType } from "../types/user.types.js";
import HttpStatus from "../utils/Codes.js"
import { User } from "../models/user.models.js";

import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import fs from "fs"




 export const UserRegister : UserFnType=async  (req ,res)=>{
    try {
        logger.info(`The userRegister endpoint hit`)
        const validate =  UserRegisterValidator.validate(req.body)

            if(validate.error){
                logger.warn(`Validation Error in the User Register${validate.error.message}`)
                return res.status(HttpStatus.BAD_REQUEST).json({
                        success : false,
                        message : validate.error.message
                })
            }

                const {username, email, password}= req.body

                const UserExists = await User.findOne({email :email})
                if(UserExists){
                    logger.warn(`User Already exists`)
                    return res.status(HttpStatus.FORBIDDEN).json({
                        success : false,
                        message  : `User Already exists `
                    })
                }

        const user = await User.create({
            username,
            email, 
            password ,

        })

        return res.status(HttpStatus.OK).json({
            success : true,
            message :"User created Successfully",
            user
        })
 } catch (error ) {
        logger.error(`Error in registering the user`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }

}


export const UserLogin : UserFnType=async  (req,res)=>{
    try {
        logger.info(`The user login is running `)
        const validate = UserLoginValidator.validate(req.body)

        if(validate.error){
            logger.warn(`Error in the validation of the userlogin ${validate.error.message}`)
            return res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :`${validate.error.message}`
            })
        }

        const {email, password } = req.body;


        const finduser : UserDocumentType | null  = await User.findOne({
            email: email
        })

        if(!finduser){
            logger.warn(`The user does not exist`)
            return res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :`User does not exist`
            })
        }else{

        const validatePassword = await finduser?.checkPassword(password)

        if(!validatePassword){
            logger.warn(`Password Incorrect`)
            message :"Invalid credentials"
        }

        const accessToken= finduser?.generateAccessToken()
        const refreshToken = finduser?.generateRefreshToken()

        finduser.refreshToken = refreshToken
        await finduser.save({
            validateBeforeSave : false
        })

        res.cookie("accessToken", accessToken, {
            httpOnly : true,
            secure : true,
            sameSite : "none",
            maxAge : 1000 * 60 * 15
        }).cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure : true,
            sameSite : "none",
            maxAge : 1000 * 60 * 60 * 24 * 15

        }
        )

        
            
        
        return res.status(HttpStatus.OK).json({
            success : true,
            message :"User Logged in successfully",
            user: finduser
        })


    }

    } catch (error) {
        logger.error(`Error in loggin in  the user, ${error}`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }

}


export const UserLogOut : UserFnType = async (req, res)=>{
    try {
        logger.info(`The UserLogOut function was hit`)
    const {user} =req;
    logger.info(`The user id is ${user}`)
    const findUser : UserDocumentType | null= await User.findById(user)
        if(!findUser){
            logger.warn(`NO user exists `)
            return res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :"No user found"
            })


        }

        res.clearCookie("refreshToken").clearCookie("accessToken")
        
        return res.status(HttpStatus.OK).json({
            success : true,
            message :"User LogOut successfully"
        })


        
    } catch (error) {
        logger.error(`Error in logging out   the user`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }

}



export const AddProfilePicture : UserFnType= async(req, res)=>{

    try {
            const {user} = req;
            const findUser : UserDocumentType | null = await User.findById(user)
            if(!findUser){
                logger.info(`the user does not exist`)
                return res.status(HttpStatus.UNAUTHORIZED).json({
                    success :false,
                    message :"No user exist"
                })
            }else{

            const file : string= req.file?.path as string
            if(!file){
                logger.error(`NO files was received`)
                return res.status(HttpStatus.NOT_FOUND).json({
                    success : false,
                    message :"No files was found"
                })
            }
                const uploadUrl : string = await uploadOnCloudinary(file )
                findUser.profilepicture = uploadUrl
                await findUser.save({
                    validateBeforeSave : false
                })
                fs.rmSync(file)
                
                    logger.info(`Profile Picture updated `)
                    return res.status(HttpStatus.OK).json({
                        success : true,
                        message :"File uploaded successfully",
                        profile : findUser.profilepicture
                    })

            }



    } catch (error) {
        logger.error(`Error in uploading the profile picture`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message :`Internal server error${error}` 
        })
    }



}

export const GetProfileDetails : UserFnType=async (req, res)=>{
    try {
        
        const {user} = req;

            if(!user){
                logger.warn(`The user does not exist`)
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success : false,
                    message :`Userid from middleware does not exist`
                })
            }

            const findUser = await User.findById(user).select("-password -refreshToken")
            if(!findUser){
                logger.warn(`The user does not exist`)
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success : false,
                    message :`User does not exist`
                })
            }

            

        return res.status(HttpStatus.OK).json({
            success : true,
            message :"User is found",
            user : findUser
        })
    } catch (error) {
        logger.error(`error in the getting profile details`)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }
}