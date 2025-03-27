"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const Tokens_js_1 = require("../utils/Tokens.js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Codes_js_1 = __importDefault(require("../utils/Codes.js"));
const handleTokenVerification = (token, secret, tokenType) => {
    try {
        logger_js_1.default.info(`Handle token verification working `);
        console.log(`Secret is ${process.env.ACCESS_TOKEN_SECRET}`);
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        console.log(decoded);
        if (!decoded) {
            throw new Error(`${tokenType} is invalid`);
        }
        logger_js_1.default.info(`Decoded token is ${decoded.id}`);
        console.log(typeof decoded._id);
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_js_1.default.warn(`${tokenType} verification failed: ${error.message}`);
        }
        else {
            logger_js_1.default.error(`${tokenType} verification failed due to an unexpected error: ${error}`);
        }
        return null;
    }
};
const AuthMiddleware = async (req, res, next) => {
    try {
        logger_js_1.default.info("AuthMiddleware endpoint was hit");
        const { accessToken, refreshToken } = req.cookies;
        if (!accessToken && !refreshToken) {
            logger_js_1.default.warn("No tokens found in cookies");
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        // Handle missing access token but present refresh token
        if (!accessToken) {
            if (!refreshToken) {
                logger_js_1.default.error(`No refreshToken too `);
                res.status(Codes_js_1.default.UNAUTHORIZED).json({
                    success: false,
                    message: "No  tokens"
                });
            }
            else {
                const refreshDecoded = handleTokenVerification(refreshToken, process.env.REFRESH_TOKEN_SECRET, "Refresh Token");
                if (!refreshDecoded) {
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized - Refresh token invalid",
                    });
                }
            }
            // Recreate access token
            const { accessToken: newAccessToken, userId } = await (0, Tokens_js_1.RecreateAccessToken)(refreshToken);
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 15 * 60 * 1000, // 15 minutes
            });
            req.user = userId;
            next();
        }
        else {
            // If the access token exists, verify it
            const accessDecoded = handleTokenVerification(accessToken, process.env.ACCESS_TOKEN_SECRET, "Access Token");
            if (!accessDecoded) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized - Access token invalid",
                });
            }
            req.user = accessDecoded.id;
            next();
        }
    }
    catch (error) {
        logger_js_1.default.error(`Error in AuthMiddleware: ${error}`);
        next(error);
    }
};
exports.AuthMiddleware = AuthMiddleware;
