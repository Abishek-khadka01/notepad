import mongoose from "mongoose"
import logger from "./logger.js"


const connectToDataBase =async  ()=>{
try {
    await mongoose.connect(process.env.MONGO_URL as string, {
        dbName: process.env.MONGO_NAME 
    })


    logger.info(`MongoDb connected ${process.env.MONGO_URL}`)

} catch (error) {
    logger.error(`Error in connecting to the database`)
    process.exit(1)
}



}

export default connectToDataBase