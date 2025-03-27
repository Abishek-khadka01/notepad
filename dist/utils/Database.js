"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_js_1 = __importDefault(require("./logger.js"));
const connectToDataBase = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_NAME
        });
        logger_js_1.default.info(`MongoDb connected ${process.env.MONGO_URL}`);
    }
    catch (error) {
        logger_js_1.default.error(`Error in connecting to the database`);
        process.exit(1);
    }
};
exports.default = connectToDataBase;
