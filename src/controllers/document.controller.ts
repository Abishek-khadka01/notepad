import { Document } from "../models/document.models.js";
import { DocumentFnType, DocumentSchema } from "../types/document.types.js";
import HttpStatus from "../utils/Codes.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.models.js";
import { UserDocumentType } from "../types/user.types.js";
import mongoose from "mongoose";


 export const createDocument : DocumentFnType=async  (req,res)=>{

    try {
        let user : mongoose.Schema.Types.ObjectId = req.user as mongoose.Schema.Types.ObjectId
        const {name} = req.body
        
     
        if(name.length<6){
            logger.warn(`The file name should be of atleast 6 length`)
            res.status(HttpStatus.FORBIDDEN).json({
                success :false,
                message :"The file name should be of atleast 6 length"
            })
        }

        const doesUserExists : UserDocumentType| null= await User.findById(user)
        if(!doesUserExists){
            logger.warn(`the user does not exist`)
                        res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :"the user does not exist"
            })
        }

        const newDocument  = await Document.create({
            name,
            ownerId : user,

        })

        newDocument.members.push(user)
        await newDocument.save({
            validateBeforeSave : false
        })
        
        res.status(HttpStatus.CREATED).json({
            success : true,
            message :"Document Created Successfluuy"
        })





    } catch (error) {
        logger.error(`Error in creating the document ${error}`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success :false,
            message :error
        })
    }



}

 export const deleteDocument :DocumentFnType =async (req ,res)=>{
    try {
    const {user} = req;
        const {documentId} = req.body

            if(!documentId){
                logger.warn(`Select the document to delete`)
                res.status(HttpStatus.BAD_REQUEST).json({
                    success : false,
                    message :"Select the document to delete "
                })
            }

            const doesUserExists = await User.findById({
                user
            })

            if(!doesUserExists){
                logger.warn(`There is no such user`)
                res.status(HttpStatus.FORBIDDEN).json({
                    success : false,
                    message :" the user does not exist"
                })
            }

            await Document.findOneAndDelete({
                _id : documentId
            })

            res.status(HttpStatus.OK).json({
                success :true,
                messsage :"the File was deleted successfully"
            })




    } catch (error) {
        logger.error(`Error in deleting the document${error}`) 
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message :"Internal Server Error"
        }

        )   
    }

}

export const FindDocuments : DocumentFnType= async  (req,res)=>{

    try {

        const {user} = req;
        
        const doesUserExists = await User.findById({
            user
        })

        if(!doesUserExists){
            logger.warn(`There is no such user`)
            res.status(HttpStatus.FORBIDDEN).json({
                success : false,
                message :" the user does not exist"
            })
        }

        const documents = await Document.find({
            members: {
                $in:[user]
            }
        })
        
        if(!documents){
            logger.error(`No documents found `)
            res.status(HttpStatus.NOT_FOUND).json({
                success : false,
                message :"NO users found"
            })
        }

        res.status(HttpStatus.FOUND).json({
            success : true,
            message :"Documents found ",
            documents
        })
        
    } catch (error) {
        logger.error(`Error in finding the documents`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message :error
        })
    }




}

