import { Document } from "mongoose";
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

