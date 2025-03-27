import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";

import logger from "./utils/logger.js";
import cors from "cors";
import Redis from "ioredis";
import { Document } from "./models/document.models.js";
import mongoose from "mongoose";
import { User } from "./models/user.models.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
  })
);

// Import routes and models
import { UserRouter } from "./routes/user.routes.js";
import { DocumentRouter } from "./routes/document.routes.js";

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/documents", DocumentRouter);

// Connect To database
import connectToDataBase from "./utils/Database.js";
connectToDataBase();

httpServer.listen(process.env.PORT, () => {
  logger.info(`App is running at port ${process.env.PORT}`);
});

// Set up Redis
const redis = new Redis({
  host: "localhost",
  port: 6380,
});

redis.on("connect", () => {
  logger.info(`Redis is connected successfully`);
});
redis.on("disconnect", () => {
  logger.info(`Redis is disconnected successfully`);
});

// Socket connection management
const MapIDToSocketId = new Map<string, string>();
const SocketIdToID = new Map<string, string>();
const SocketIdDocument = new Set<string>();

io.use( async (socket: SocketHandler, next: Function) => {
  logger.info("Socket.io middleware running");

  const { userID } = socket.handshake.auth;
  const { documentID } = socket.handshake.query;
  logger.info(`The user id is ${userID } and documentID is ${documentID}`);
  try {
    const findUser = await User.findById(userID);
    if (!findUser) {
      logger.warn("No user found");
      return next(new Error("No User found"));
    }
    const findDocument = await Document.findById(documentID);
    if (!findDocument) {
      logger.warn("No document found");
      return next(new Error("No document found"));
    }

    // Attach userId and documentId to the socket object
    socket.userId = userID;
    socket.documentId = documentID as string;

    next();
  } catch (error) {
    logger.error("Error during socket middleware", error);
    next(error); // Pass the error to next() to handle it properly
  }
});

io.on("connection", async (socket: SocketHandler) => {
  logger.info(`User connected: ${socket.id}`);
  const userId = socket.userId 
  const documentId = socket.documentId  
  
  MapIDToSocketId.set(userId as string, socket.id as string);
  SocketIdToID.set(socket.id, userId as string);

  const onlineUsers = await redis.lrange("onlineUsers", 0, -1);
  if (!onlineUsers.includes(userId as string)) {
    await redis.lpush("onlineUsers", userId as string);
    logger.info(`User ${userId} added to online users.`);
  }

  const document = await Document.findById(documentId);
  const isMember = document?.members.includes(new mongoose.Types.ObjectId(userId));
  

  logger.warn(`Document members: ${document?.members}`);

  const ownerSocketId = MapIDToSocketId.get(String(document?.ownerId));
  
  // If the user is not a member of the document
  if (!isMember) {
    console.log(ownerSocketId, "ghdfhg",userId)

    if (!ownerSocketId) {
      console.log(`Socket owner id is not online `)
      socket.to(socket.id).emit("error", {
        message:"Owner is not online"
      })
    } else {

      const userID = SocketIdToID.get(socket.id as string )
      const user = await User.findById(userID).select("_id , username , profilepicture")
      

      // Emit request to join the document to the owner
      socket.to(ownerSocketId).emit("request-to-join-document", {
        from: userId,
        user,
        message: "Request to join the document",
      });
    }
  } else {
    // Add all document members to the set of active document users
    document?.members.forEach((id) => {
      const memberSocketId = MapIDToSocketId.get(String(id));
      if (memberSocketId) {
        SocketIdDocument.add(memberSocketId);
      }
    });
    console.log(`The document is passed through the is member check`)
  }

  // Handle updates to the document text
  socket.on("update-text", async ({ from, message, DocumentID }) => {
    logger.info(`Update text from ${from} to ${message}`);
     const socketIds = document?.members.map((id) => {
      return MapIDToSocketId.get(String(id))
    })

    // id , from, message, DocumentID, profile, name
    console.log(`Socket ids are ${socketIds}`)
// To do 

 // Do not add the one who initiated the change
    
      const OnlineSOcketUserforDocument =  socketIds?.filter(id=>id)
      console.log(`The online users for document is ${OnlineSOcketUserforDocument}`)

      console.log(`Socket ids of the online users is ${socketIds}`)
      const finduser = await User.findById(from )


    OnlineSOcketUserforDocument?.forEach((socketId) => {
      console.log(socketId)
      socket.to(socketId as string).emit("update-text-event", {DocumentID , profile : finduser?.profilepicture,
        name : finduser?.username , from, message });
    })

    
  });

  //Accepts join request

  socket.on("accept_join_request", async ({userId, documentID})=>{

    console.log(userId, documentID)

    const document = await Document.findById(documentID)

      document?.members.push(new mongoose.Types.ObjectId(userId))
      await document?.save()
    console.log(`Document change ${document}`)

      const socketId = MapIDToSocketId.get(userId)
      socket.emit("accepted_request", {
        message :"Accepted the request"
      })

  })


  // reject join request

  socket.on("reject_join_request", ({userId})=>{
      console.log(userId)
      const socketIdofUser = MapIDToSocketId.get(userId)
      socket.to(socketIdofUser as string ).emit("rejected_request")
      
  })


  
 // Handles Error 
 socket.on("error" , (error)=>{
  logger.error(error.message)
 })


  // Handle user disconnection
  socket.on("disconnect", () => {
    logger.error(`User with ID ${userId} disconnected from socket`);
    
    // Clean up on disconnect
    MapIDToSocketId.delete(userId as string);
    SocketIdToID.delete(socket.id);
    redis.lrem("onlineUsers", 0, userId as string);
    
  });
});

// Error Middleware
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware.js";
import { SocketHandler } from "./types/socket.types.js";
app.use(ErrorMiddleware);

export { MapIDToSocketId, SocketIdToID , redis};
