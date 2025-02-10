
import Document, {Schema} from "mongoose"

export interface DocumentSchema extends Document{

    name : string,
    content : string,
    ownerId : Schema.Types.ObjectId,
    members : Schema.Types.ObjectId[],
    createdAt : Date,
    updatedAt : Date


}