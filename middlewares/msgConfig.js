const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const sendOTPMail = async (email, verifycode) => {
    try {
        const mailData = `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to MSFS APP – Your OTP for Secure Login</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&ampdisplay=swap" rel="stylesheet">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f9fcff; 
                        font-family: 'Inter', sans-serif;
                    }
                    .container {
                        max-width: 600px; 
                        margin: 20px auto; 
                        background-color: #ffffff; 
                        border-radius: 10px; 
                        overflow: hidden;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(90deg, #87CEEB, #5A9BD4);
                        padding: 20px;
                        text-align: center;
                    }
                    .header img {
                        width: 180px;
                    }
                    .content {
                        padding: 30px;
                        text-align: center;
                    }
                    .content h2 {
                        color: #2C3E50;
                        font-size: 22px;
                        margin-bottom: 20px;
                    }
                    .otp-box {
                        display: inline-block;
                        padding: 12px 22px;
                        font-size: 24px;
                        font-weight: bold;
                        color: #ffffff;
                        background: linear-gradient(90deg, #87CEEB, #5A9BD4);
                        border-radius: 6px;
                        letter-spacing: 5px;
                    }
                    .content p {
                        color: #34495E;
                        font-size: 16px;
                        margin: 20px 0;
                        text-align: left;
                    }
                    .footer {
                        background-color: #E3F2FD;
                        padding: 15px;
                        text-align: center;
                        font-size: 14px;
                        color: #2C3E50;
                    }
                    .footer a {
                        color: #5A9BD4;
                        text-decoration: none;
                        font-weight: 500;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        
                    </div>
                    <div class="content">
                        
                        <p>Dear Rev. Father,</p>
                        <p>Welcome to <strong>MSFS APP</strong>, the dedicated mobile app for MSFS Confreres!</p>
                        <p>Your registered email for this account is:</p>
                        <p><strong>${email}</strong></p>
                        <p>To access your account securely, please use the One-Time Password (OTP) below:</p>
                        <p class="otp-box">🔑 ${verifycode}</p>
                        <p>This OTP is valid for <strong>10 minutes</strong> and should not be shared with anyone.</p>
                        <p>If you did not request this OTP, please ignore this email.</p>
                        <p>For any assistance, feel free to contact our support team at:</p>
                        <p><strong><a href="mailto:estatusmsfs@gmail.com">estatusmsfs@gmail.com</a></strong></p>
                        <p>Enjoy using MSFS APP!</p>
                        <p>Fraternally,</p>
                        <p><strong>Admin Team</strong><br>DeSales Technologies</p>
                    </div>
                    <div class="footer">
                        &copy; 2025 <a href="https://www.desalestech.com">www.desalestech.com</a>. All rights reserved.
                    </div>
                </div>
            </body>
        </html>`;

        const transporter = nodemailer.createTransport(smtpTransport({
            host: "smtp-relay.gmail.com",
            port: 587,
            secure: false,
            service: "gmail",
            auth: {
                user: "estatusmsfs@gmail.com", 
                pass: "bgun xnqq ukwm stwn"  // Use your Gmail App Password
            },
            tls: {
                rejectUnauthorized: false
            }
        }));

        const mailOptions = {
            from: '"MSFS APP" <no-reply@desalestech.com>',
            to: email.toString(),
            subject: 'Welcome to MSFS APP – Your OTP for Secure Login',
            html: mailData,
        };

        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Email Sending Error: ", error);
        return false;
    }
};

module.exports = { sendOTPMail };
