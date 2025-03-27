"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.SocketIdToID = exports.MapIDToSocketId = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const logger_js_1 = __importDefault(require("./utils/logger.js"));
const cors_1 = __importDefault(require("cors"));
const document_models_js_1 = require("./models/document.models.js");
const mongoose_1 = __importDefault(require("mongoose"));
const user_models_js_1 = require("./models/user.models.js");
const redis_1 = require("redis");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
}));
// Import routes and models
const user_routes_js_1 = require("./routes/user.routes.js");
const document_routes_js_1 = require("./routes/document.routes.js");
app.use("/api/v1/users", user_routes_js_1.UserRouter);
app.use("/api/v1/documents", document_routes_js_1.DocumentRouter);
// Connect To database
const Database_js_1 = __importDefault(require("./utils/Database.js"));
(0, Database_js_1.default)();
httpServer.listen(process.env.PORT, () => {
    logger_js_1.default.info(`App is running at port ${process.env.PORT}`);
});
// Set up Redis
console.log("Redis details are ", process.env.REDIS_USERNAME, " the passwrods is ", process.env.REDIS_PASSWORD, process.env.REDIS_HOST);
const redis = (0, redis_1.createClient)({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 12196
    }
});
exports.redis = redis;
redis.connect();
redis.on("error", (error) => {
    logger_js_1.default.error(`Error in connecting to the redis ${error.message}`);
});
redis.on("connect", () => {
    logger_js_1.default.info(`Redis is connected successfully`);
});
redis.on("disconnect", () => {
    logger_js_1.default.info(`Redis is disconnected successfully`);
});
// Socket connection management
const MapIDToSocketId = new Map();
exports.MapIDToSocketId = MapIDToSocketId;
const SocketIdToID = new Map();
exports.SocketIdToID = SocketIdToID;
const SocketIdDocument = new Set();
io.use(async (socket, next) => {
    logger_js_1.default.info("Socket.io middleware running");
    const { userID } = socket.handshake.auth;
    const { documentID } = socket.handshake.query;
    logger_js_1.default.info(`The user id is ${userID} and documentID is ${documentID}`);
    try {
        const findUser = await user_models_js_1.User.findById(userID);
        if (!findUser) {
            logger_js_1.default.warn("No user found");
            return next(new Error("No User found"));
        }
        const findDocument = await document_models_js_1.Document.findById(documentID);
        if (!findDocument) {
            logger_js_1.default.warn("No document found");
            return next(new Error("No document found"));
        }
        // Attach userId and documentId to the socket object
        socket.userId = userID;
        socket.documentId = documentID;
        next();
    }
    catch (error) {
        logger_js_1.default.error("Error during socket middleware", error);
        next(error); // Pass the error to next() to handle it properly
    }
});
io.on("connection", async (socket) => {
    logger_js_1.default.info(`User connected: ${socket.id}`);
    const userId = socket.userId;
    const documentId = socket.documentId;
    MapIDToSocketId.set(userId, socket.id);
    SocketIdToID.set(socket.id, userId);
    const onlineUsers = await redis.lRange("onlineUsers", 0, -1);
    if (!onlineUsers.includes(userId)) {
        await redis.lPush("onlineUsers", userId);
        logger_js_1.default.info(`User ${userId} added to online users.`);
    }
    const document = await document_models_js_1.Document.findById(documentId);
    const isMember = document?.members.includes(new mongoose_1.default.Types.ObjectId(userId));
    logger_js_1.default.warn(`Document members: ${document?.members}`);
    const ownerSocketId = MapIDToSocketId.get(String(document?.ownerId));
    // If the user is not a member of the document
    if (!isMember) {
        console.log(ownerSocketId, "ghdfhg", userId);
        if (!ownerSocketId) {
            console.log(`Socket owner id is not online `);
            socket.to(socket.id).emit("error", {
                message: "Owner is not online"
            });
        }
        else {
            const userID = SocketIdToID.get(socket.id);
            const user = await user_models_js_1.User.findById(userID).select("_id , username , profilepicture");
            // Emit request to join the document to the owner
            socket.to(ownerSocketId).emit("request-to-join-document", {
                from: userId,
                user,
                message: "Request to join the document",
            });
        }
    }
    else {
        // Add all document members to the set of active document users
        document?.members.forEach((id) => {
            const memberSocketId = MapIDToSocketId.get(String(id));
            if (memberSocketId) {
                SocketIdDocument.add(memberSocketId);
            }
        });
        console.log(`The document is passed through the is member check`);
    }
    // Handle updates to the document text
    socket.on("update-text", async ({ from, message, DocumentID }) => {
        logger_js_1.default.info(`Update text from ${from} to ${message}`);
        const socketIds = document?.members.map((id) => {
            return MapIDToSocketId.get(String(id));
        });
        // id , from, message, DocumentID, profile, name
        console.log(`Socket ids are ${socketIds}`);
        // To do 
        // Do not add the one who initiated the change
        const OnlineSOcketUserforDocument = socketIds?.filter(id => id);
        console.log(`The online users for document is ${OnlineSOcketUserforDocument}`);
        console.log(`Socket ids of the online users is ${socketIds}`);
        const finduser = await user_models_js_1.User.findById(from);
        OnlineSOcketUserforDocument?.forEach((socketId) => {
            console.log(socketId);
            socket.to(socketId).emit("update-text-event", { DocumentID, profile: finduser?.profilepicture,
                name: finduser?.username, from, message });
        });
    });
    //Accepts join request
    socket.on("accept_join_request", async ({ userId, documentID }) => {
        console.log(userId, documentID);
        const document = await document_models_js_1.Document.findById(documentID);
        document?.members.push(new mongoose_1.default.Types.ObjectId(userId));
        await document?.save();
        console.log(`Document change ${document}`);
        const socketId = MapIDToSocketId.get(userId);
        socket.emit("accepted_request", {
            message: "Accepted the request"
        });
    });
    // reject join request
    socket.on("reject_join_request", ({ userId }) => {
        console.log(userId);
        const socketIdofUser = MapIDToSocketId.get(userId);
        socket.to(socketIdofUser).emit("rejected_request");
    });
    // Handles Error 
    socket.on("error", (error) => {
        logger_js_1.default.error(error.message);
    });
    // Handle user disconnection
    socket.on("disconnect", async () => {
        logger_js_1.default.error(`User with ID ${userId} disconnected from socket`);
        // Clean up on disconnect
        MapIDToSocketId.delete(userId);
        SocketIdToID.delete(socket.id);
        await redis.lRem("onlineUsers", 0, userId);
    });
});
// Error Middleware
const ErrorMiddleware_js_1 = require("./middlewares/ErrorMiddleware.js");
app.use(ErrorMiddleware_js_1.ErrorMiddleware);
