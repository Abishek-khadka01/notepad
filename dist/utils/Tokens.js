"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecreateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_models_js_1 = require("../models/user.models.js");
const logger_js_1 = __importDefault(require("./logger.js"));
const RecreateAccessToken = async (refreshToken) => {
    try {
        logger_js_1.default.info(`The recreation of accessToken is runnning`);
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
        const token = jsonwebtoken_1.default.verify(refreshToken, refreshTokenSecret);
        console.log(token);
        if (!token) {
            throw new Error("Invalid refresh token");
        }
        console.log(token._id);
        const user = await user_models_js_1.User.findById(token._id);
        if (!user) {
            throw new Error("User not found");
        }
        const accessToken = user.generateAccessToken();
        logger_js_1.default.info(`the access token was created successfuly`);
        const userId = user._id;
        return {
            accessToken, userId
        };
    }
    catch (error) {
        logger_js_1.default.error(`Error in creating the access token ${error}`);
        throw error;
    }
};
exports.RecreateAccessToken = RecreateAccessToken;
