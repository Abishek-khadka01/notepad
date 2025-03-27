"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
let origin = process.env.CORS_ORGIN;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    corsConfig: {
        origin,
        methods: ["POST", "GET", "PUT"],
    },
    CookieConfig: {
        httpOnly: true,
        secure: true,
        samesite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 15
    },
    database: {
        mongo_url: process.env.MONGO_URL,
        name: process.env.MONGO_NAME
    },
    PORT: process.env.PORT,
    jsontoken: {
        accessToken: process.env.ACCESS_TOKEN_SECRET,
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
        refreshToken: process.env.REFRESH_TOKEN_SECRET,
        refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY
    }
};
