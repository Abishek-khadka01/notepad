import { Router } from "express";

import { AuthMiddleware } from "../middlewares/auth.js";
import { createDocument, deleteDocument, DocumentUpdate, FindDocuments, GetDocumentByID} from "../controllers/document.controller.js";


const DocumentRouter = Router()


DocumentRouter.use(AuthMiddleware)
DocumentRouter.post("/create-document", createDocument)
DocumentRouter.delete("/delete-document/:id", deleteDocument)
DocumentRouter.get("/find",FindDocuments)
DocumentRouter.get("/find/:id", GetDocumentByID)
DocumentRouter.patch("/update-document", DocumentUpdate)

export {DocumentRouter}        