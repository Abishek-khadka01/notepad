import { UserRegisterValidator, UserLoginValidator } from "../validators/user.validator.js";

import logger from "../utils/logger.js";
import { UserFnType } from "../types/user.types.js";
import HttpStatus from "../utils/Codes.js";
import { User } from "../models/user.models.js";

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





