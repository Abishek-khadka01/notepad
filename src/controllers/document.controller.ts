import { Document } from "../models/document.models.js";
import { DocumentFnType, DocumentSchema } from "../types/document.types.js";
import HttpStatus from "../utils/Codes.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.models.js";
import { UserDocumentType } from "../types/user.types.js";
import mongoose, { ObjectId } from "mongoose";


 export const createDocument : DocumentFnType=async  (req,res)=>{

    try {
      logger.info(`The create Document Endpoint hit`)
        let user : mongoose.Schema.Types.ObjectId = req.user as mongoose.Schema.Types.ObjectId
        const {name} = req.body
        
     
        if(name.length<6){
            logger.warn(`The file name should be of atleast 6 length`)
            return res.status(HttpStatus.FORBIDDEN).json({
                success :false,
                message :"The file name should be of atleast 6 length"
            })
        }

        const doesUserExists : UserDocumentType| null= await User.findById(user)
        if(!doesUserExists){
            logger.warn(`the user does not exist`)
                     return  res.status(HttpStatus.BAD_REQUEST).json({
                success : false,
                message :"the user does not exist"
            })
        }

        const newDocument  = await Document.create({
            name,
            ownerId : user,

        })
        let newUser = new mongoose.Types.ObjectId(user.toString())
        newDocument.members.push(newUser)
        await newDocument.save({
            validateBeforeSave : false
        })
        
       return  res.status(HttpStatus.CREATED).json({
            success : true,
            message :"Document Created Successfluuy"
        })





    } catch (error) {
        logger.error(`Error in creating the document ${error}`)
      return   res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success :false,
            message :error
        })
    }



}

 export const deleteDocument :DocumentFnType =async (req ,res)=>{
    try {
    const {user} = req;
        const {id} = req.body

            if(!id){
                logger.warn(`Select the document to delete`)
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success : false,
                    message :"Select the document to delete "
                })
            }

            const doesUserExists = await User.findById({
                user
            })

            if(!doesUserExists){
                logger.warn(`There is no such user`)
                 return res.status(HttpStatus.FORBIDDEN).json({
                    success : false,
                    message :" the user does not exist"
                })
            }

            await Document.findOneAndDelete({
                _id : id
            })

             return res.status(HttpStatus.OK).json({
                success :true,
                messsage :"the File was deleted successfully"
            })




    } catch (error) {
        logger.error(`Error in deleting the document${error}`) 
      return   res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success : false,
            message :"Internal Server Error"
        }

        )   
    }

}

export const FindDocuments: DocumentFnType = async (req, res) => {
    try {
      let user: string | ObjectId | null | undefined = req.user as string | ObjectId
      console.log(typeof user);
      
      // If user is undefined or null, return an error
      if (!user || !mongoose.Types.ObjectId.isValid(user as string)) {
        logger.warn("Invalid or missing userId");
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: "Invalid or missing user ID format",
        });
      }
  
      // Check if the user exists in the database
      const doesUserExist = await User.findById(user);
      if (!doesUserExist) {
        logger.warn("There is no such user");
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: "The user does not exist",
        });
      }
  
      // Fetch documents where the user is a member
      const documents = await Document.find({
        members: { $in: [user] },
      });
  
      if (!documents || documents.length === 0) {
        logger.error("No documents found");
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "No documents found",
        });
      }
  
      return res.status(HttpStatus.FOUND).json({
        success: true,
        message: "Documents found",
        documents,
      });
      
    } catch (error) {
      logger.error(`Error in finding the documents: ${error}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error,
      });
    }
  };
  

export const GetDocumentByID : DocumentFnType = async (req , res)=>{
  try {

    const {id } = req.params
    console.log(id)
    if(!id){
      logger.warn(`No document Id found`)
      return res.status(HttpStatus.NOT_FOUND).json({
        success : false,
        message :"No id found"
      })
    }

      const findDocument = await Document.findById(id).populate("members")
      if(!id){
        return res.status(HttpStatus.NOT_FOUND).json({
          success :false,
          message :"NO document found"
        })
      }
    
    
    return res.status(HttpStatus.OK).json({
      success : true ,
      message : findDocument
    })
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success : false,
      message :error 
    })
  }
}