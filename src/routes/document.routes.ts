import { Router } from "express";

import { AuthMiddleware } from "../middlewares/auth.js";
import { createDocument, deleteDocument, FindDocuments, GetDocumentByID} from "../controllers/document.controller.js";


const DocumentRouter = Router()


DocumentRouter.use(AuthMiddleware)
DocumentRouter.post("/create-document", createDocument)
DocumentRouter.put("/delete-document", deleteDocument)
DocumentRouter.get("/find",FindDocuments)
DocumentRouter.get("/find/:documentID", GetDocumentByID)

export {DocumentRouter}