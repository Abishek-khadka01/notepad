"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const logger = (0, winston_1.createLogger)({
    level: process.env.NODE === "production" ? "info" : "debug",
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.colorize({ all: true }), winston_1.format.printf(({ timestamp, level, message, error, metadata }) => {
        return `${error ? error : message} ${timestamp} ${level} `;
    })),
    transports: [
        new winston_1.transports.File({ filename: "./logs/error.log", level: "error" }),
        // new transports.File({ filename: "./logs/combined.log", level: "info" }),
        new winston_1.transports.Console({
            level: process.env.NODE === "production" ? "info" : "debug",
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.colorize({ all: true }), winston_1.format.printf(({ timestamp, level, message, error }) => {
                return `${error ? error : message} ${timestamp} ${level}`;
            })),
        }),
    ],
});
exports.default = logger;
