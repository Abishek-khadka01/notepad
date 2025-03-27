"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DocumentSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
exports.Document = mongoose_1.default.model("Document", DocumentSchema);
