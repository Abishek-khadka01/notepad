"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentUpdate = exports.GetDocumentByID = exports.FindDocuments = exports.deleteDocument = exports.createDocument = void 0;
const document_models_js_1 = require("../models/document.models.js");
const Codes_js_1 = __importDefault(require("../utils/Codes.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const user_models_js_1 = require("../models/user.models.js");
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("../index.js");
const createDocument = async (req, res) => {
    try {
        logger_js_1.default.info(`The create Document Endpoint hit`);
        let user = req.user;
        const { name } = req.body;
        if (name.length < 6) {
            logger_js_1.default.warn(`The file name should be of atleast 6 length`);
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: "The file name should be of atleast 6 length"
            });
        }
        const doesUserExists = await user_models_js_1.User.findById(user);
        if (!doesUserExists) {
            logger_js_1.default.warn(`the user does not exist`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: "the user does not exist"
            });
        }
        // Check if the user have already made the document named as the file 
        const CheckDocumentExists = await document_models_js_1.Document.findOne({
            ownerId: user,
            name,
        });
        if (CheckDocumentExists) {
            logger_js_1.default.warn(`The document with the same name already exits and is created by user`);
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: "The document with the same name already exits and is created by user"
            });
        }
        const newDocument = await document_models_js_1.Document.create({
            name,
            ownerId: user,
        });
        let newUser = new mongoose_1.default.Types.ObjectId(user.toString());
        newDocument.members.push(newUser);
        await newDocument.save({
            validateBeforeSave: false
        });
        logger_js_1.default.info(`The document is created successfully`);
        return res.status(Codes_js_1.default.CREATED).json({
            success: true,
            message: "Document Created Successfluuy",
            document: newDocument
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in creating the document ${error}`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.createDocument = createDocument;
const deleteDocument = async (req, res) => {
    try {
        logger_js_1.default.info(`delete document is running `);
        const { user } = req;
        const { id } = req.params;
        console.log(`Document id is ${id}`);
        if (!id) {
            logger_js_1.default.warn(`Select the document to delete`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: "Select the document to delete "
            });
        }
        const doesUserExists = await user_models_js_1.User.findById(user);
        if (!doesUserExists) {
            logger_js_1.default.warn(`There is no such user`);
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: " the user does not exist"
            });
        }
        await document_models_js_1.Document.findOneAndDelete({
            _id: id
        });
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            messsage: "the File was deleted successfully"
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in deleting the document${error}`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
exports.deleteDocument = deleteDocument;
const FindDocuments = async (req, res) => {
    try {
        let user = req.user;
        // Early returns for invalid user
        if (!user || !mongoose_1.default.Types.ObjectId.isValid(user)) {
            logger_js_1.default.warn("Invalid or missing userId");
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: "Invalid or missing user ID format",
            });
        }
        // Check if the user exists in the database
        const doesUserExist = await user_models_js_1.User.findById(user);
        if (!doesUserExist) {
            logger_js_1.default.warn("There is no such user");
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: "The user does not exist",
            });
        }
        // Fetch documents where the user is a member
        const documents = await document_models_js_1.Document.find({
            members: { $in: [user] },
        }).populate("members", "username profilepicture").select("name updatedAt _id ");
        // Handle no documents case
        if (!documents || documents.length === 0) {
            logger_js_1.default.error("No documents found");
            return res.status(Codes_js_1.default.NOT_FOUND).json({
                success: false,
                message: "No documents found",
            });
        }
        // If we reach here, we haven't sent a response yet, so this is fine
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: "Documents found",
            documents,
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in finding the documents: ${error}`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error instanceof Error ? error.message : String(error),
        });
        if (!res.headersSent) {
            return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error instanceof Error ? error : String(error),
            });
        }
    }
};
exports.FindDocuments = FindDocuments;
const GetDocumentByID = async (req, res) => {
    try {
        const { user } = req; // Extract user from request
        let { id } = req.params; // Extract document ID from params
        id = id.trim();
        console.log(`ID is ${id}`);
        // Ensure the user is authenticated
        if (!user) {
            logger_js_1.default.warn(`User not found, unauthorized request`);
            return res.status(Codes_js_1.default.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // Find the document by its ID
        let findDocument = await document_models_js_1.Document.findById(id).populate("members", "_id username profilepicture")
            .select("name ownerId content updatedAt _id");
        if (!findDocument) {
            logger_js_1.default.error(`No document found with ID: ${id}`);
            return res.status(Codes_js_1.default.NOT_FOUND).json({
                success: false,
                message: "Not found",
            });
        }
        // Retrieve online members from Redis
        const onlineMembers = await index_js_1.redis.lRange("onlineUsers", 0, -1);
        console.log(`Online members are: ${onlineMembers}`);
        // Check if the user is a member of the document
        const isMember = findDocument?.members.some((docMemberId) => String(docMemberId._id) === String(user));
        // Check if the document owner is online
        const isOwnerOnline = onlineMembers.includes(String(findDocument?.ownerId));
        console.log(`Is member: ${isMember}, Is owner online: ${isOwnerOnline}`);
        // If neither the user is a member nor the owner is online, deny access
        if (!isMember && !isOwnerOnline) {
            logger_js_1.default.error(`Unauthorized access attempt: Neither is member nor is the owner online`);
            return res.status(Codes_js_1.default.UNAUTHORIZED).json({
                success: false,
                message: "Not authorized",
            });
        }
        // Avoid modifying the Mongoose document directly
        const documentData = findDocument.toObject(); // Convert to plain object
        console.log("djghieportjeiortgljkdlgdjgld", documentData);
        // Filter out members who are not online
        const UsersOnline = documentData.members.filter((member) => {
            logger_js_1.default.error(`The member is ${member._id}`);
            console.log(`The map method includes ${onlineMembers.includes(String(member._id))}`);
            return onlineMembers.includes(String(member._id));
        });
        // Return the document data
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: documentData,
            members: UsersOnline
        });
    }
    catch (error) {
        // Handle any errors that occur during the process
        logger_js_1.default.error(`Error retrieving document by ID: ${error}`);
        return res.status(500).json({
            success: false,
            message: `Internal server error: ${error}`,
        });
    }
};
exports.GetDocumentByID = GetDocumentByID;
const DocumentUpdate = async (req, res) => {
    try {
        logger_js_1.default.info(`The document update is running`);
        const { id, message } = req.body;
        const UpdateDocument = await document_models_js_1.Document.findById(id);
        if (!UpdateDocument) {
            logger_js_1.default.warn(`NO document found `);
            return res.status(Codes_js_1.default.NOT_FOUND).json({
                success: false,
                message: "No document found"
            });
        }
        UpdateDocument.content = message;
        await UpdateDocument.save();
        logger_js_1.default.info(`the message is updated successfully`);
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: "Updated successfully"
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in DocumentUpdate: ${error}`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.DocumentUpdate = DocumentUpdate;
