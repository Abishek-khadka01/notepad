import { Document, Schema } from "mongoose";

import { Request,Response } from "express";
import { JwtPayload } from "jsonwebtoken";
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

 export interface TypeJwtPayload extends JwtPayload  {
  id: Schema.Types.ObjectId; // User ID or unique identifier
  
};

export type RecreateTokenFnType = (token :string)=>Promise<{
  accessToken : string,
  userId : Schema.Types.ObjectId
}>

export type UserType = {
  username : string,
  email: string,
  password : string,
  createdAt : Date,
  profilepicture ?: string,
  refreshToken ?: string
}