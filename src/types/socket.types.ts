import { Socket } from "socket.io";
import mongoose, { ObjectId } from "mongoose";

export interface SocketHandler extends Socket {
    userId?: string;  
    document?: DocumentType
    isMember?: boolean;  
    documentId ? : string
}


export type  DocumentType= {
       
        _id: mongoose.Types.ObjectId;  
        name: string;
        ownerId: mongoose.Types.ObjectId;
        members: mongoose.Types.ObjectId[];
    }