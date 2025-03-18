import { JwtPayloadType } from "../types/user.types.js";
import logger from "../utils/logger.js";
import { RecreateAccessToken } from "../utils/Tokens.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import HttpStatus from "../utils/Codes.js";

type HandleVerification =   (token: string, secret: string, tokenType: string) => JwtPayloadType | null ;

const handleTokenVerification: HandleVerification =  (token, secret, tokenType) => {
  try {
    logger.info(`Handle token verification working `)
    console.log(`Secret is ${process.env.ACCESS_TOKEN_SECRET}`)
    const decoded =   jwt.verify(token, secret) as JwtPayloadType;
    console.log(decoded)
    if (!decoded) {
      throw new Error(`${tokenType} is invalid`);
    }

      logger.info(`Decoded token is ${decoded.id}`)
      console.log(typeof decoded._id)
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

export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("AuthMiddleware endpoint was hit");

    const { accessToken, refreshToken } = req.cookies;

      console.table(req.cookies)
    if (!accessToken && !refreshToken) {
      logger.warn("No tokens found in cookies");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle missing access token but present refresh token
    if (!accessToken) {


        if(!refreshToken){
          logger.error(`No refreshToken too `)
          res.status(HttpStatus.UNAUTHORIZED).json({
            success : false,
            message :"No  tokens"
          })
        }else{
      const refreshDecoded = handleTokenVerification(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
        "Refresh Token"
      );

      if (!refreshDecoded) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Refresh token invalid",
        });
      }
      }

      try {
        // Recreate access token
        const { accessToken: newAccessToken, userId } = await RecreateAccessToken(refreshToken);

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        req.user = userId;
 
         next();
      } catch (error) {
        logger.error(`Failed to recreate access token: ${error}`);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    }

    // If the access token exists, verify it
    const accessDecoded = handleTokenVerification(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
      "Access Token"
    );

    if (!accessDecoded) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Access token invalid",
      });
    }

    req.user = accessDecoded.id;
    next();
  } catch (error) {
    logger.error(`Error in AuthMiddleware: ${error}`);
    next(error);
  }
};
