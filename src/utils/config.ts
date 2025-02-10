let origin : string = process.env.CORS_ORGIN as string
import dotenv from "dotenv"
dotenv.config()
export const config=  {
    
    corsConfig :{
        origin ,
        methods:["POST", "GET", "PUT"],

    },

    CookieConfig :{
        httpOnly : true,
        secure : true,
        samesite:"none",
    },
    database :{
        mongo_url : process.env.MONGO_URL,
        name : process.env.MONGO_NAME
    },
    PORT : process.env.PORT ,

    jsontoken :{
        accessToken : process.env.ACCESS_TOKEN_SECRET,
        accessTokenExpiry : process.env.ACCESS_TOKEN_EXPIRY,
        refreshToken : process.env.REFRESH_TOKEN_SECRET,
        refreshTokenExpiry : process.env.REFRESH_TOKEN_EXPIRY
    }


}