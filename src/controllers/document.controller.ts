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
      logger.info(`delete document is running `)
    const {user} = req;
        const {id} = req.params
      console.log(`Document id is ${id}`)
            if(!id){
                logger.warn(`Select the document to delete`)
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success : false,
                    message :"Select the document to delete "
                })
            }

            const doesUserExists = await User.findById(user)

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
    
    const { user } = req; // Extract user from request
    let  { id } = req.params; // Extract document ID from params
    id = id.trim(); 
    console.log(`ID is ${id}`);

    // Ensure the user is authenticated
    if (!user) {
      logger.warn(`User not found, unauthorized request`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Find the document by its ID
    let  findDocument = await Document.findById(id) .populate("members", "_id username profilepicture")
    .select("name ownerId content updatedAt _id");

    

    if (!findDocument) {
      logger.error(`No document found with ID: ${id}`);
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "Not found",
      });
    }

    // Retrieve online members from Redis
    const onlineMembers = await redis.lrange("onlineUsers", 0, -1);
    console.log(`Online members are: ${onlineMembers}`);

    // Check if the user is a member of the document
    const isMember = findDocument?.members.some((docMemberId) => 
      String(docMemberId._id) === String(user)
    );

    // Check if the document owner is online
    const isOwnerOnline = onlineMembers.includes(String(findDocument?.ownerId));

    console.log(`Is member: ${isMember}, Is owner online: ${isOwnerOnline}`);

    // If neither the user is a member nor the owner is online, deny access
    if (!isMember && !isOwnerOnline) {
      logger.error(`Unauthorized access attempt: Neither is member nor is the owner online`);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Not authorized",
      });
    }

     
    // Avoid modifying the Mongoose document directly
    const documentData = findDocument.toObject(); // Convert to plain object

      console.log( "djghieportjeiortgljkdlgdjgld",documentData)
    // Filter out members who are not online
     const UsersOnline = documentData.members.filter((member) =>{
      logger.error(`The member is ${member._id}`)
      console.log(`The map method includes ${onlineMembers.includes(String(member._id))}`)
      return onlineMembers.includes(String(member._id))
    }
    );

    // Return the document data
    return res.status(HttpStatus.OK).json({
      success: true,
      message: documentData,
      members : UsersOnline
    });

  } catch (error) {
    // Handle any errors that occur during the process
    logger.error(`Error retrieving document by ID: ${error}`);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
};



  
  export const DocumentUpdate : DocumentFnType= async (req,res)=>{

    try {
      logger.info(`The document update is running`)
        const {id, message } = req.body;
        const UpdateDocument = await Document.findById(id)

        if(!UpdateDocument){
          logger.warn(`NO document found `)
          return res.status(HttpStatus.NOT_FOUND).json({
            success : false,
            message :"No document found"
          })
        }

        UpdateDocument.content = message;
        await UpdateDocument.save()

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