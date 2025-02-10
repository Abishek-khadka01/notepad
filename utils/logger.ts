import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.NODE === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.colorize({ all: true }),

    format.printf(({ timestamp, level, message, error, metadata }) => {
      return `${error ? error : message} ${timestamp} ${level} `;
    })
  ),
  transports: [
    new transports.File({ filename: "./logs/error.log", level: "error" }),
    // new transports.File({ filename: "./logs/combined.log", level: "info" }),
    new transports.Console({
      level: process.env.NODE === "production" ? "info" : "debug",
      format: format.combine(
        format.timestamp(),
        format.colorize({ all: true }),
        format.printf(({ timestamp, level, message, error }) => {
          return `${error ? error : message} ${timestamp} ${level}`;
        })
      ),
    }),
  ],
});

export default logger;