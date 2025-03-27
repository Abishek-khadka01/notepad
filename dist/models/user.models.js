import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilepicture: {
        type: String,
        default: "https://media.istockphoto.com/id/517998264/vector/male-user-icon.jpg?s=612x612&w=0&k=20&c=4RMhqIXcJMcFkRJPq6K8h7ozuUoZhPwKniEke6KYa_k="
    },
    refreshToken: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// Method to check password
UserSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};
UserSchema.methods.generateAccessToken = function () {
    let secret = process.env.ACCESS_TOKEN_SECRET;
    const accessToken = jwt.sign({ id: this._id,
    }, secret, { expiresIn: "15m" });
    return accessToken;
};
UserSchema.methods.generateRefreshToken = function () {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const refreshToken = jwt.sign({ _id: this._id }, secret, // Ensure you use a secure secret
    {
        expiresIn: "15d", // Default expiry if not set
    });
    return refreshToken;
};
export const User = mongoose.model("User", UserSchema);
