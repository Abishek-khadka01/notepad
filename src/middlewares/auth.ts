
import { JwtPayloadType } from "../types/user.types.js";
import logger from "../utils/logger.js";
import { RecreateAccessToken } from "../utils/Tokens.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request,Response, NextFunction } from "express";

type HandleVerification = (token: string, secret: string, tokenType: string) => JwtPayloadType | null;

const handleTokenVerification: HandleVerification = (token, secret, tokenType) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayloadType;
    
    if (!decoded) {
      throw new Error(`${tokenType} is invalid`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`${tokenType} verification failed: ${error.message}`);
    } else {
      logger.error(`${tokenType} verification failed due to an unexpected error: ${error}`);
    }
    return null;
  }
};


export const AuthMiddleware = async (req :Request, res: Response, next : NextFunction) => {
  try {
    logger.info("AuthMiddleware endpoint was hit");
    console.log(req.cookies);

    const { accessToken, refreshToken } = req.cookies;

    // If no tokens are found, respond with Unauthorized
    if (!accessToken && !refreshToken) {
      logger.warn("No tokens found in cookies");
       res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle case where no access token is provided but refresh token exists
    if (!accessToken) {
      if (!refreshToken) {
         res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Verify the refresh token

      const refreshDecoded = await handleTokenVerification(

        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
        "Refresh Token"
      );

      if (!refreshDecoded) {
         res.status(401).json({
          success: false,
          message: "Unauthorized - Refresh token invalid",
        });
      }

        console.log(refreshToken)
      // Recreate access token and set in cookies
      const { accessToken, userId } = await RecreateAccessToken(refreshToken);
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      req.user = userId;
      next();
    }

    // If the access token exists, verify it
    const accessDecoded = await handleTokenVerification(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
      "Access Token"
    );

    if (!accessDecoded) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Access token invalid",
      });
    }

    req.user = accessDecoded?._id;
     next();
  } catch (error) {
    logger.error(`Error in AuthMiddleware: ${error}`);
     next(error);
  }
};