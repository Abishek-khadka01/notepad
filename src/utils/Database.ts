import mongoose from "mongoose"
import logger from "./logger.js"
import { config } from "./config.js"

const connectToDataBase =async  ()=>{
try {
    await mongoose.connect(config.database.mongo_url as string, {
        dbName: config.database.name 
    })


    logger.info(`MongoDb connected ${config.database.mongo_url}`)

} catch (error) {
    logger.error(`Error in connecting to the database`)
    process.exit(1)
}



}

export default connectToDataBase