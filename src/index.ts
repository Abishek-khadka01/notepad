import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express"
import cookieParser from "cookie-parser"
import {config} from "./utils/config.js"
import logger from "./utils/logger.js";
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors :{
    origin : config.corsConfig.origin
  }

});


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())


// Connect To database
import connectToDataBase from "./utils/Database.js";
connectToDataBase()

httpServer.listen(config.PORT, ()=>{
    logger.info(`App is runnning at port ${config.PORT}`)
})


// sockets 
const onlineUsers = new Set<string>()
const MapUsers = new Map() // the map contains the data in the format of userId : socketId 
import { ConnectUsers } from "./controllers/socket.controller.js";
import { SocketHandler } from "./types/socket.types.js";
import { DISCONNECT } from "./constants/socket.js";
io.on("connection",async (socket :SocketHandler)=>{
  const userId = socket.handshake.auth.userId
 await ConnectUsers(socket)
  socket.on(DISCONNECT,(socket)=>{
      logger.info(`the user is disconnected`)
      onlineUsers.delete(socket.id)
      MapUsers.delete(userId)
      logger.info(`the datas deleted from the online users and map users ${onlineUsers} ${MapUsers}`)
  })  
})



export {onlineUsers,MapUsers }


