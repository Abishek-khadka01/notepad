import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import logger from "./logger.js";
import { JwtPayloadType, RecreateAccessTokenType, UserDocumentType } from "../types/user.types.js";
import { Schema } from "mongoose";
import { config } from "./config.js";
export const RecreateAccessToken : RecreateAccessTokenType = async (refreshToken) => {
  try {
    logger.info(`The recreation of accessToken is runnning`)
    const refreshTokenSecret : string = config.jsontoken.refreshToken as string
    const token = jwt.verify(
      refreshToken,
      refreshTokenSecret
    ) as JwtPayloadType


    console.log(token)
    if (!token) {
      throw new Error("Invalid refresh token");
    }
    console.log(token._id)
    const user : UserDocumentType | null = await User.findById(token._id)
    if (!user) {
      throw new Error("User not found");
    }


    const accessToken = user.generateAccessToken();

    logger.info(`the access token was created successfuly`);
    const userId : Schema.Types.ObjectId = user._id as Schema.Types.ObjectId
    return{
      accessToken, userId 
    }
  } catch (error) {
    logger.error(`Error in creating the access token ${error}`);
    throw error;
  }
};