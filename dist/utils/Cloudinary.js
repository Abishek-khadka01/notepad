"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadOnCloudinary = uploadOnCloudinary;
const cloudinary_1 = require("cloudinary");
const logger_js_1 = __importDefault(require("./logger.js"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
async function uploadOnCloudinary(filepath) {
    console.log(filepath);
    try {
        if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
            throw new Error("Cloudinary environment variables are missing");
        }
        if (!fs_1.default.existsSync(filepath)) {
            throw new Error(`File does not exist: ${filepath}`);
        }
        const result = await cloudinary_1.v2.uploader.upload(filepath);
        console.log(result);
        logger_js_1.default.info(`The file is uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    }
    catch (error) {
        logger_js_1.default.error(`Error in uploading the file to Cloudinary: ${error}`);
        throw error;
    }
}
