import { Router } from "express";

import { AuthMiddleware } from "../middlewares/auth.js";
import { createDocument, deleteDocument, FindDocuments } from "../controllers/document.controller.js";


const DocumentRouter = Router()


DocumentRouter.use(AuthMiddleware)
DocumentRouter.post("/create-document", createDocument)
DocumentRouter.put("/delete-document", deleteDocument)
DocumentRouter.get("/find",FindDocuments)


export {DocumentRouter}