import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import logger from "./logger.js";
export const RecreateAccessToken = async (refreshToken) => {
    try {
        logger.info(`The recreation of accessToken is runnning`);
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
        const token = jwt.verify(refreshToken, refreshTokenSecret);
        console.log(token);
        if (!token) {
            throw new Error("Invalid refresh token");
        }
        console.log(token._id);
        const user = await User.findById(token._id);
        if (!user) {
            throw new Error("User not found");
        }
        const accessToken = user.generateAccessToken();
        logger.info(`the access token was created successfuly`);
        const userId = user._id;
        return {
            accessToken, userId
        };
    }
    catch (error) {
        logger.error(`Error in creating the access token ${error}`);
        throw error;
    }
};
