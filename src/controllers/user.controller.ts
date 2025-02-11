import { UserRegisterValidator, UserLoginValidator } from "../validators/user.validator.js";
import logger from "../utils/logger.js";
import { UserDocumentType, UserFnType } from "../types/user.types.js";
import HttpStatus from "../utils/Codes.js"
import { User } from "../models/user.models.js";
import { config } from "../utils/config.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import e from "express";

 export const UserRegister : UserFnType=async  (req ,res)=>{
    try {
        logger.info(`The userRegister endpoint hit`)
        const validate =  UserRegisterValidator.validate(req.body)

            if(validate.error){
                logger.warn(`Validation Error in the User Register${validate.error.message}`)
                res.status(HttpStatus.BAD_REQUEST).json({
                        success : false,
                        message : validate.error.message
                })
            }

                const {username, email, password}= req.body

                const UserExists = await User.findOne({email})
                if(UserExists){
                    logger.warn(`User Already exists`)
                    res.status(HttpStatus.FORBIDDEN).json({
                        success : false,
                        message  : `User Already exists `
                    })
                }

        const user = await User.create({
            username,
            email, 
            password ,

        })

        res.status(HttpStatus.OK).json({
            success : true,
            message :"User created Successfully",
            user
        })
 } catch (error ) {
        logger.error(`Error in registering the user`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }

}


export const UserLogin : UserFnType=async  (req,res)=>{
    try {
        
        const validate = UserLoginValidator.validate(req.body)

        if(validate.error){
            logger.warn(`Error in the validation of the userlogin ${validate.error.message}`)
            res.status(HttpStatus.BAD_REQUEST).json({
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
            res.status(HttpStatus.BAD_REQUEST).json({
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

        res.cookie("refreshToken", refreshToken,config.CookieConfig ).cookie("accessToken", accessToken, {
            ...config.CookieConfig, 
            maxAge:1000*60*15
        }).status(HttpStatus.OK).json({
            success : true,
            message :"User Logged in successfully",
            user: finduser
        })


    }

    } catch (error) {
        logger.error(`Error in loggin in  the user`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error
        })
    }

}


export const UserLogOut : UserFnType = async (req, res)=>{
    try {

    const {user} =req;
    const findUser : UserDocumentType | null= await User.findById(user)
        if(!findUser){
            logger.warn(`NO user exists `)
            res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :"No user found"
            })


        }

        res.clearCookie("refreshToken").clearCookie("accessToken").status(HttpStatus.OK).json({
            success : true,
            message :"User LogOut successfully"
        })


        
    } catch (error) {
        logger.error(`Error in logging out   the user`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
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
                res.status(HttpStatus.UNAUTHORIZED).json({
                    success :false,
                    message :"No user exist"
                })
            }else{

            const file : string= req.file?.path as string
                const uploadUrl : string = await uploadOnCloudinary(file )
                findUser.profilepicture = uploadUrl
                await findUser.save({
                    validateBeforeSave : false
                })

                    logger.info(`Profile Picture updated `)
                    res.status(HttpStatus.OK).json({
                        success : true,
                        message :"File uploaded successfully"
                    })

            }



    } catch (error) {
        logger.error(`Error in uploading the profile picture`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message :`Internal server error${error}` 
        })
    }



}