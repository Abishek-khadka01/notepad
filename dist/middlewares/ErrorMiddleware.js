export const ErrorMiddleware = (err, req, res, next) => {
    if (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
