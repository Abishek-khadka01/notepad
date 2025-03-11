import { Document } from "../models/document.models.js";
import { DocumentFnType, DocumentSchema } from "../types/document.types.js";
import HttpStatus from "../utils/Codes.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.models.js";
import { UserDocumentType } from "../types/user.types.js";
import mongoose, { ObjectId } from "mongoose";
import {redis} from "../index.js"

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


        // Check if the user have already made the document named as the file 

        const CheckDocumentExists = await Document.findOne(
         {
          ownerId : user,
          name,
         } 
        )
        if(CheckDocumentExists){
          logger.warn(`The document with the same name already exits and is created by user`)
            return res.status(HttpStatus.FORBIDDEN).json({
                success :false,
                message :"The document with the same name already exits and is created by user"
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
        
        logger.info(`The document is created successfully`)
       return  res.status(HttpStatus.CREATED).json({
            success : true,
            message :"Document Created Successfluuy",
            document  : newDocument
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
    
    // Early returns for invalid user
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
    }).populate("members", "username profilepicture").select("name updatedAt _id ")
    
    // Handle no documents case
    if (!documents || documents.length === 0) {
      logger.error("No documents found");
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "No documents found",
      });
    }
    
    // If we reach here, we haven't sent a response yet, so this is fine
    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Documents found",
      documents,
    });
  } catch (error) {
    logger.error(`Error in finding the documents: ${error}`);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
    if (!res.headersSent) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error : String(error),
      });
    }
  }
};
  

  export const GetDocumentByID: DocumentFnType = async (req, res) => {
    try {
      logger.info(`GetDocumentId is running`);
      
      const { id } = req.params;
      if (!id) {
        logger.warn(`No document Id found`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "No id found",
        });
      }
      console.log(await Document.findById(id), "dgfjdjgf")
      const findDocument = await Document.findById(id).populate(
        "members",
        "_id username profilepicture"
      ).select("name content updatedAt _id");
      console.log(findDocument?.content)
      if (!findDocument) {
        logger.warn(`No document found with ID: ${id}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "No document found",
        });
      }
  
      const OnlineMembers = await redis.lrange("onlineUsers", 0, -1);
  
      // Avoid modifying the Mongoose document directly
      const documentData = findDocument.toObject(); // Convert to plain object
      documentData.members = documentData.members.filter((member) =>
        OnlineMembers.includes(String(member._id))
      );
  
      return res.status(HttpStatus.OK).json({
        success: true,
        message: documentData,
      });
  
    } catch (error) {
      logger.error(`Error in GetDocumentByID: ${error}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error,
      })
      // Ensure no response has already been sent
      if (!res.headersSent) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: error || "Internal Server Error",
        });
      }
    }
  };
  
  export const DocumentUpdate : DocumentFnType= async (req,res)=>{

    try {
      logger.info(`The document update is running`)
        const {id, message } = req.body;
        const UpdateDocument = await Document.findByIdAndUpdate(id , {
          $push : {
            content : message
          }
        })


        logger.info(`the message is updated successfully`);
        return res.status(HttpStatus.OK).json({
          success : true,
          message :"Updated successfully"
        })
      
    } catch (error) {
      logger.error(`Error in DocumentUpdate: ${error}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success : false,
        message : error
      })
    }


  }