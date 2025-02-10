import { Document, Schema } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { Request,Response } from "express";
export interface UserDocumentType extends Document {

    username : string,
    email : string,
    password : string,
    profilepicture? : string,
    refreshToken?: string,
    createdAt : Date,
    checkPassword(password : string) :  Promise<boolean>,

    generateAccessToken : ()=>string,
    generateRefreshToken : ()=>string


}
declare global {
    namespace Express {
      interface Request {
        file?: Express.Multer.File;
        files?: Express.Multer.File[];
        user?: Schema.Types.ObjectId | null;
      }
    }
  }


export type UserFnType = (req : Request,res:  Response) => Promise<void>
