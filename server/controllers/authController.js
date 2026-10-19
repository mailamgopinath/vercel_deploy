const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authModel = require("../models/authModel");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                status: false,
                message: "Email and Password are required"
            });
        }

        const user = await authModel.findUserByEmail(
            email.trim().toLowerCase()
        );

        if (!user || user.status !== "active") {
            return res.status(401).json({
                status: false,
                message: "Invalid Email or Password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                status: false,
                message: "Invalid Email or Password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h"
            }
        );

        return res.status(200).json({
            status: true,
            message: "Login Successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    login
};