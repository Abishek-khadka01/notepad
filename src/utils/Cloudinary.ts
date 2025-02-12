import { v2 as cloudinary } from "cloudinary";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});



 async function uploadOnCloudinary(filepath : string)  {
  try {
    const result =   await cloudinary.uploader.upload(filepath, {
        quality_analysis: true,
        folder:"/users-profile",
        format:"auto"
    })
    
    logger.info(`The files is uploaded`)
    return result.secure_url
  } catch (error) {
    logger.error("Error in uploading the file to Cloudinary", error);
    throw error;
  }
}


export {uploadOnCloudinary}