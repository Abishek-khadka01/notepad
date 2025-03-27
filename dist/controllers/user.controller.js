"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProfileDetails = exports.AddProfilePicture = exports.UserLogOut = exports.UserLogin = exports.UserRegister = void 0;
const user_validator_js_1 = require("../validators/user.validator.js");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const Codes_js_1 = __importDefault(require("../utils/Codes.js"));
const user_models_js_1 = require("../models/user.models.js");
const Cloudinary_js_1 = require("../utils/Cloudinary.js");
const fs_1 = __importDefault(require("fs"));
const UserRegister = async (req, res) => {
    try {
        logger_js_1.default.info(`The userRegister endpoint hit`);
        const validate = user_validator_js_1.UserRegisterValidator.validate(req.body);
        if (validate.error) {
            logger_js_1.default.warn(`Validation Error in the User Register${validate.error.message}`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: validate.error.message
            });
        }
        const { username, email, password } = req.body;
        const UserExists = await user_models_js_1.User.findOne({ email: email });
        if (UserExists) {
            logger_js_1.default.warn(`User Already exists`);
            return res.status(Codes_js_1.default.FORBIDDEN).json({
                success: false,
                message: `User Already exists `
            });
        }
        const user = await user_models_js_1.User.create({
            username,
            email,
            password,
        });
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: "User created Successfully",
            user
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in registering the user`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.UserRegister = UserRegister;
const UserLogin = async (req, res) => {
    try {
        logger_js_1.default.info(`The user login is running `);
        const validate = user_validator_js_1.UserLoginValidator.validate(req.body);
        if (validate.error) {
            logger_js_1.default.warn(`Error in the validation of the userlogin ${validate.error.message}`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: `${validate.error.message}`
            });
        }
        const { email, password } = req.body;
        const finduser = await user_models_js_1.User.findOne({
            email: email
        });
        if (!finduser) {
            logger_js_1.default.warn(`The user does not exist`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: `User does not exist`
            });
        }
        else {
            const validatePassword = await finduser?.checkPassword(password);
            if (!validatePassword) {
                logger_js_1.default.warn(`Password Incorrect`);
                message: "Invalid credentials";
            }
            const accessToken = finduser?.generateAccessToken();
            const refreshToken = finduser?.generateRefreshToken();
            finduser.refreshToken = refreshToken;
            await finduser.save({
                validateBeforeSave: false
            });
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 15
            }).cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 60 * 24 * 15
            });
            return res.status(Codes_js_1.default.OK).json({
                success: true,
                message: "User Logged in successfully",
                user: finduser
            });
        }
    }
    catch (error) {
        logger_js_1.default.error(`Error in loggin in  the user, ${error}`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.UserLogin = UserLogin;
const UserLogOut = async (req, res) => {
    try {
        logger_js_1.default.info(`The UserLogOut function was hit`);
        const { user } = req;
        logger_js_1.default.info(`The user id is ${user}`);
        const findUser = await user_models_js_1.User.findById(user);
        if (!findUser) {
            logger_js_1.default.warn(`NO user exists `);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: "No user found"
            });
        }
        res.clearCookie("refreshToken").clearCookie("accessToken");
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: "User LogOut successfully"
        });
    }
    catch (error) {
        logger_js_1.default.error(`Error in logging out   the user`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.UserLogOut = UserLogOut;
const AddProfilePicture = async (req, res) => {
    try {
        const { user } = req;
        const findUser = await user_models_js_1.User.findById(user);
        if (!findUser) {
            logger_js_1.default.info(`the user does not exist`);
            return res.status(Codes_js_1.default.UNAUTHORIZED).json({
                success: false,
                message: "No user exist"
            });
        }
        else {
            const file = req.file?.path;
            if (!file) {
                logger_js_1.default.error(`NO files was received`);
                return res.status(Codes_js_1.default.NOT_FOUND).json({
                    success: false,
                    message: "No files was found"
                });
            }
            const uploadUrl = await (0, Cloudinary_js_1.uploadOnCloudinary)(file);
            findUser.profilepicture = uploadUrl;
            await findUser.save({
                validateBeforeSave: false
            });
            fs_1.default.rmSync(file);
            logger_js_1.default.info(`Profile Picture updated `);
            return res.status(Codes_js_1.default.OK).json({
                success: true,
                message: "File uploaded successfully",
                profile: findUser.profilepicture
            });
        }
    }
    catch (error) {
        logger_js_1.default.error(`Error in uploading the profile picture`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Internal server error${error}`
        });
    }
};
exports.AddProfilePicture = AddProfilePicture;
const GetProfileDetails = async (req, res) => {
    try {
        const { user } = req;
        if (!user) {
            logger_js_1.default.warn(`The user does not exist`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: `Userid from middleware does not exist`
            });
        }
        const findUser = await user_models_js_1.User.findById(user).select("-password -refreshToken");
        if (!findUser) {
            logger_js_1.default.warn(`The user does not exist`);
            return res.status(Codes_js_1.default.BAD_REQUEST).json({
                success: false,
                message: `User does not exist`
            });
        }
        return res.status(Codes_js_1.default.OK).json({
            success: true,
            message: "User is found",
            user: findUser
        });
    }
    catch (error) {
        logger_js_1.default.error(`error in the getting profile details`);
        return res.status(Codes_js_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error
        });
    }
};
exports.GetProfileDetails = GetProfileDetails;
