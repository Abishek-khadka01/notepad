import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";
import { config } from "./utils/config.js";
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
    methods: ["POST", "GET", "PUT", "DELETE"],
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

httpServer.listen(config.PORT, () => {
  logger.info(`App is running at port ${config.PORT}`);
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

io.use(async (socket: SocketHandler, next: Function) => {
  logger.info("Socket.io middleware running");

  const { userID } = socket.handshake.auth;
  const { documentID } = socket.handshake.query;
  logger.info(userID, documentID);
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
    if (!ownerSocketId) {
      // If the document owner socket is not found
      socket.emit("end-document", {
        message: "You are not a member of the document",
      });
    } else {
      // Emit request to join the document to the owner
      socket.to(ownerSocketId).emit("request-to-join-document", {
        from: userId,
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
  }

  // Handle updates to the document text
  socket.on("update-text", async ({ from, message }) => {
    // You can handle text updates here
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    logger.info(`User with ID ${userId} disconnected from socket`);

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

export { MapIDToSocketId, SocketIdToID };
