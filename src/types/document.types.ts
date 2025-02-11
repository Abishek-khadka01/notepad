
import Document, {Schema} from "mongoose"
import {Request, Response} from "express"
export interface DocumentSchema extends Document{

    name : string,
    content : string,
    ownerId : Schema.Types.ObjectId,
    members : Schema.Types.ObjectId[],
    createdAt : Date,
    updatedAt : Date


}

export type DocumentFnType = (arg1 :Request, arg2: Response)=>Promise<void>