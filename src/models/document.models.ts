import mongoose from "mongoose";
import { DocumentSchema } from "../types/document.types.js";

const DocumentSchema = new mongoose.Schema<DocumentSchema>({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default:"hello world"
    
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

 export const Document = mongoose.model("Document", DocumentSchema);