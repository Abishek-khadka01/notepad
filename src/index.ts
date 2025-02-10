import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express"
import cookieParser from "cookie-parser"
import {config} from "./utils/config.js"
import logger from "./utils/logger.js";
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
  

});
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())


// Connect To database
import connectToDataBase from "./utils/Database.js";
connectToDataBase()

httpServer.listen(config.PORT, ()=>{
    logger.info(`App is runnning at port ${config.PORT}`)
})