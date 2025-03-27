import { v2 as cloudinary } from "cloudinary";
import logger from "./logger.js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables
// Configure Cloudinary
cloudinary.config({
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
        if (!fs.existsSync(filepath)) {
            throw new Error(`File does not exist: ${filepath}`);
        }
        const result = await cloudinary.uploader.upload(filepath);
        console.log(result);
        logger.info(`The file is uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    }
    catch (error) {
        logger.error(`Error in uploading the file to Cloudinary: ${error}`);
        throw error;
    }
}
export { uploadOnCloudinary };
