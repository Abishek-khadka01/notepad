import { Socket } from "socket.io";
import logger from "../utils/logger.js";
import { DocumentType, SocketHandler } from "../types/socket.types.js";
import {CHECK_STATUS, ERROR, RECIEVE_TEXT, SEND_REQUEST} from "../constants/socket.js"
import { onlineUsers, MapUsers } from "../index.js";
import { NextFunction } from "express";
import { User } from "../models/user.models.js";
import { Document } from "../models/document.models.js";
import { DocumentSchema } from "../types/document.types.js";
import { Schema, Types } from "mongoose";


 export const ConnectUsers = async (socket : SocketHandler ) =>{
   try {
        const userId = socket.userId
        const documentId = socket.documentId

    if(!userId){
        socket.emit(ERROR, {
            errror: true,
            message :`No userId was received`
        })
    }
    logger.info(`A user connected ${socket.id}`)

    onlineUsers.add(socket.id)
    MapUsers.set(userId, socket.id)
        logger.info(`the Users ares set ${onlineUsers} ${MapUsers}`)

    


     
   } catch (error) {
    logger.error(`Error in the connecting the user ${error}`)
        socket.emit(ERROR, {
            errror: true,
            message :error
        })
   }

}


// the io middleware checks if the given document is member in the document and if is member then is passed
export const IOMiddleware = async(socket : SocketHandler, next : NextFunction)=>{
    try {
        
        const {documentId, userId } =socket.handshake.auth
            if(!documentId || !userId){
                logger.error(`document id is ${documentId} and userID is ${userId}`)
                socket.emit(ERROR, {
                    error : true,
                    message :"NO userid or documentId"
                })

            }

            const user = await User.findById(userId)
            if(!user){
                logger.error(`NO user exist `)
               next(new Error(`No users found`))
            }


            const document: DocumentType | null  = await Document.findById(documentId).select("-createdAt -updateAt")
            if(!document){
                logger.error(`No document exist`)
               next(new Error(`NO documents found`))
            }else{
            
            const isMember = document?.members.includes(userId)
            socket.isMember = isMember,
            socket.userId = userId,
            socket.document = document
            }
    } catch (error) {
        logger.error(`Error in the io middleware`)
        next(error)
    }


}


export const SendRequest =async (socket: SocketHandler)=>{
    try {

        const isMember = socket.isMember
        const document = socket.document
        const userId = socket.userId

        const findUser = await User.findById(userId).select("username profilepicture")
        if(!findUser){
            logger.error(`Error in getting the user `);

            socket.emit(ERROR, {
                error : true,
                message :` the user not found`
            }) 
        }

        const socketIDofOwner = MapUsers.get(document?.ownerId.toString())
        if(!socketIDofOwner){
            logger.error(`Error in getting the socket id of the owner`);

            socket.emit(ERROR, {
                error : true,
                message :`Socket id of the user not found`
            }) 
        }

        socket.to(socketIDofOwner).emit(SEND_REQUEST, {
                userId : userId,
                username  : findUser?.username,
                profilepicture  : findUser?.profilepicture
        })
        
        
    } catch (error) {
        logger.error(`Error in sending the request`);
        socket.emit(ERROR, {
            error : true,
            message :error
        })
    }



}


export const AcceptRequest = async (socket : SocketHandler)=>{
    try {
        let {documentId , userId} = socket.data


        if(!documentId  || !userId){
            logger.error(`${documentId} ${userId}`)
            socket.emit(ERROR, {
                error : true,
                message :`No valid details`
            })
        }

        const document= await Document.findById(documentId)
        if(!document){
            
                logger.error(`Error in accepting the request the request`);
                socket.emit(ERROR, {
                    error : true,
                message :` No document found`   
                })  
            }else{
            userId   = new Types.ObjectId(userId as string) as Types.ObjectId  
            document?.members.push(userId);
            await document.save({
                validateBeforeSave : false
            })
            
            socket.to(socket.id).emit(CHECK_STATUS, {
                error : false,
                message :"User added successfully"
            })

            socket.join(documentId)

           
        }
        
    } catch (error) {
        logger.error(`Error in accepting the request the request`);
        socket.emit(ERROR, {
            error : true,
            message :error
        })
    }


}


export const UpdateText = async (socket: SocketHandler)=>{
    try {
        
        const {documentId , userId, content} = socket.data
        if(!documentId  ||  !userId || !content){
            logger.error(`Error in  the updating the text`);
            socket.emit(ERROR, {
                error : true,
                message : `No documentids , userids and content`
            })
        }

        const user = await User.findById(userId).select("username profilepicture")


        const document = await Document.findById(documentId)
        if(!document){
            logger.error(`Error in  the updating the text`);
            socket.emit(ERROR, {
                error : true,
                message :`No document found`
            })   
        }

        socket.to(documentId).emit(RECIEVE_TEXT, {
            editor :{
                username : user?.username,
                profilepicture : user?.profilepicture
            },
            content,

        })

    } catch (error) {
        logger.error(`Error in  the updating the text`);
        socket.emit(ERROR, {
            error : true,
            message :error
        })
    }


}
