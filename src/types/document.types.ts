
import Document, {Schema} from "mongoose"
import {Request, Response} from "express"
import { Types } from "mongoose"
export interface DocumentSchema extends Document{

    name : string,
    content : string,
    ownerId : Types.ObjectId,
    members : Types.ObjectId[],
    createdAt : Date,
    updatedAt : Date


}

export type DocumentFnType = (arg1 :Request, arg2: Response)=>Promise<void>