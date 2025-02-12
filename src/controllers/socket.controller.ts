import { Socket } from "socket.io";
import logger from "../utils/logger.js";
import { SocketHandler } from "../types/socket.types.js";
import {ERROR} from "../constants/socket.js"
import { onlineUsers, MapUsers } from "../index.js";



 export const ConnectUsers = async (socket : SocketHandler ) =>{
   try {
        const userId = socket.handshake.auth.userId
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



