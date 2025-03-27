"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRegisterValidator = exports.UserLoginValidator = void 0;
const joi_1 = __importDefault(require("joi"));
// Validator for user registration
const UserRegisterValidator = joi_1.default.object({
    username: joi_1.default
        .string()
        .required()
        .alphanum()
        .min(3)
        .max(20)
        // Adjusted regex: allows single spaces but not consecutive spaces
        .pattern(/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/),
    email: joi_1.default
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
    password: joi_1.default
        .string()
        .required()
        .min(6)
        .max(20),
});
exports.UserRegisterValidator = UserRegisterValidator;
// Validator for user login
const UserLoginValidator = joi_1.default.object({
    email: joi_1.default
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
    password: joi_1.default
        .string()
        .required()
        .min(6)
        .max(20),
});
exports.UserLoginValidator = UserLoginValidator;
