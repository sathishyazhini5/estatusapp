require('dotenv').config();
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
    var authHeader = req.headers.authorization;
    if (Boolean(authHeader)) {
        var token = authHeader.split(' ')[1];
        if (token) {
            jwt.verify(token, process.env.OTP_SECRET_KEY, async (error, tokenCheck) => {
                if (error) {
                    return res.status(401).json({ 
                        status: false, 
                        statuscode:401,
                        code:"UNAUTHORIZED",
                        message: "The provided token is not authorized or is expired.",
                        results: error
                    });
                } else {
                    req.authOtp = tokenCheck;
                    next();
                }
            });
        } else {
            return res.status(401).json({ 
                status: false, 
                statuscode:401,
                code:"TOKEN_NOT_PROVIDED",
                message: "Token not provided. Please include a valid authentication token in the request headers.",
                results: null
            });
        }
    } else {
        return res.status(401).json({ 
            status: false, 
            statuscode:401,
            code:"TOKEN_NOT_PROVIDED",
            message: "Token not provided. Please include a valid authentication token in the request headers.",
            results: null
        });
    }
};