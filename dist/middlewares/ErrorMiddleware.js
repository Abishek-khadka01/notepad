"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const ErrorMiddleware = (err, req, res, next) => {
    if (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.ErrorMiddleware = ErrorMiddleware;
