const express = require('express');
const router = express.Router();
const { authUser } = require('../models/User');
const { check, validationResult } = require('express-validator');
const { sendOTPMail } = require("../middlewares/msgConfig");
const authAccessToken = require("../middlewares/authAccessToken");
const authRefreshToken = require("../middlewares/authRefreshToken");
const authVerifyToken = require("../middlewares/authVerifyToken");
const jwt = require('jsonwebtoken');

// ✅ Step 1: Send OTP to email
router.post("/auth-email", [
  check('email')
    .notEmpty()
    .withMessage('The email is required and should not be empty.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      statuscode: 422,
      code: "VALIDATION_ERROR",
      message: "The request cannot be processed due to validation errors.",
      results: errors.array()[0]
    });
  }

  try {
    const email = req.body.email;
    const checkUser = await authUser(email);

    if (!checkUser) {
      return res.status(404).json({
        status: false,
        statuscode: 404,
        code: 'NOT_FOUND',
        message: 'The requested user resource could not be found.',
        results: null
      });
    }

    const verifyotp = '123456'; // You can replace this with generateOtp()
    const mailResp = await sendOTPMail(email, verifyotp);

    if (mailResp) {
      const payload = { email: email, verifyotp: verifyotp };
      const token = jwt.sign(payload, process.env.OTP_SECRET_KEY, {
        expiresIn: process.env.OTP_EXPIRE
      });

      return res.status(201).json({
        status: true,
        statuscode: 201,
        code: 'CREATED',
        message: "OTP sent to your email.",
        results: { verifytoken: token }
      });
    } else {
      return res.status(500).json({
        status: false,
        statuscode: 500,
        code: "MAIL_SENDING_FAILED",
        message: "Failed to send OTP email.",
        results: null
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      statuscode: 500,
      message: "Internal Server Error",
      results: error
    });
  }
});

// ✅ Step 2: Verify OTP and return JWT tokens
router.post("/auth-otp", [
  check('verifycode')
    .notEmpty().withMessage('OTP is required.')
    .isNumeric().withMessage('OTP must be numeric.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
], authVerifyToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      statuscode: 422,
      code: "VALIDATION_ERROR",
      message: "Validation failed.",
      results: errors.array()[0]
    });
  }

  const { email, verifyotp } = req.authOtp;
  const verifycode = req.body.verifycode;

  try {
    const checkUser = await authUser(email);
    if (!checkUser) {
      return res.status(404).json({
        status: false,
        statuscode: 404,
        code: 'NOT_FOUND',
        message: 'User not found.',
        results: null
      });
    }

    if (verifyotp === verifycode && email === checkUser.personal_mailid1) {
      const userData = {
        confrer_code: checkUser.confrer_code,  // ✅ use this consistently
        email: checkUser.personal_mailid1
      };

      const accessToken = jwt.sign(userData, process.env.ACCESS_SECRET_AKEY, {
        expiresIn: process.env.ACCESS_AEXPIRE
      });

      const refreshToken = jwt.sign(userData, process.env.REFRESH_SECRET_AKEY, {
        expiresIn: process.env.REFRESH_AEXPIRE
      });

      return res.status(201).json({
        status: true,
        statuscode: 201,
        code: 'VERIFIED',
        message: "OTP verified. Login successful.",
        results: { accessToken, refreshToken }
      });
    } else {
      return res.status(401).json({
        status: false,
        statuscode: 401,
        code: 'OTP_VERIFY_FAILURE',
        message: 'OTP verification failed. Try again.',
        results: null
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: false,
      statuscode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: "Server error during OTP verification.",
      results: error
    });
  }
});

// ✅ Step 3: Check if access token is valid
router.get("/auth-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userData = {
      confrer_code: "",
      personal_mailid1: ""
    };

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const tokenCheck = jwt.verify(token, process.env.ACCESS_SECRET_AKEY);
          const checkUser = await authUser(tokenCheck.email);
          
          if (checkUser) {
            userData = {
              confrer_code: checkUser.confrer_code || "",
              personal_mailid1: checkUser.personal_mailid1 || ""
            };
          }
        } catch (error) {
          // Token is invalid or expired, userData remains with empty strings
        }
      }
    }

    return res.status(200).json({
      status: true,
      statuscode: 200,
      code: 'VERIFIED',
      message: "Access token is valid.",
      results: userData
    });
  } catch (error) {
    return res.status(200).json({
      status: true,
      statuscode: 200,
      code: 'VERIFIED',
      message: "Access token is valid.",
      results: {
        confrer_code: "",
        personal_mailid1: ""
      }
    });
  }
});

// ✅ Step 4: Create new access token using refresh token
router.post("/create-token", async (req, res) => {
  const refreshToken = req.body.refreshtoken;

  if (!refreshToken) {
    return res.status(401).json({
      status: false,
      statuscode: 401,
      code: 'TOKEN_NOT_PROVIDED',
      message: 'Refresh token not provided.'
    });
  }

  try {
    const tokenCheck = jwt.verify(refreshToken, process.env.REFRESH_SECRET_AKEY);
    const checkUser = await authUser(tokenCheck.email);

    if (!checkUser) {
      return res.status(401).json({
        status: false,
        statuscode: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token or user not found.'
      });
    }

    const userData = {
      confrer_code: checkUser.confrer_code,
      email: checkUser.personal_mailid1
    };

    const accessToken = jwt.sign(userData, process.env.ACCESS_SECRET_AKEY, {
      expiresIn: process.env.ACCESS_AEXPIRE
    });

    return res.status(201).json({
      status: true,
      statuscode: 201,
      code: 'VERIFIED',
      message: 'Access token regenerated successfully.',
      results: { accessToken }
    });

  } catch (error) {
    return res.status(401).json({
      status: false,
      statuscode: 401,
      code: 'UNAUTHORIZED',
      message: 'Refresh token expired or invalid.',
      results: error.message
    });
  }
});

module.exports = router;
