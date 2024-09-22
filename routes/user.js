const express = require('express');
const connection = require('../connection');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

// Signup Route
router.post('/signup', (req, res) => {
    let user = req.body;
    let query = "SELECT email, password, role, status FROM user WHERE email=?";

    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                query = "INSERT INTO user(name, contactNumber, email, password, status, role) VALUES (?, ?, ?, ?, 'false', 'user')";
                connection.query(query, [user.name, user.contactNumber, user.email, user.password], (err, results) => {
                    if (!err) {
                        return res.status(200).json({ message: "Successfully Registered" });
                    } else {
                        return res.status(500).json(err);
                    }
                });
            } else {
                return res.status(400).json({ message: "Email Already Exists" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// Login Route
router.post('/login', (req, res) => {
    const user = req.body;
    let query = "SELECT email, password, role, status FROM user WHERE email=?";

    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0 || results[0].password !== user.password) {
                return res.status(401).json({ message: "Incorrect username or password" });
            } else if (results[0].status === 'false') {
                return res.status(401).json({ message: "Wait for Admin Approval" });
            } else if (results[0].password === user.password) {
                const response = { email: results[0].email, role: results[0].role };
                const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: "8h" });
                return res.status(200).json({ token: accessToken });
            } else {
                return res.status(400).json({ message: "Something went wrong. Please try again later." });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// Email setup for nodemailer
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD
    }
});

// Forgot Password Route
router.post('/forgotPassword', (req, res) => {
    const user = req.body;
    let query = "SELECT email, password FROM user WHERE email=?";
    
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(400).json({ message: "User not found." });
            } else {
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results[0].email,
                    subject: 'Password by Cafe Management System',
                    html: `<p><b>Your Login details for Cafe Management System</b><br><b>Email:</b> ${results[0].email}<br><b>Password: </b>${results[0].password} <br><a href="http://localhost:4200/">Click here to login</a></p>`
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).json({ message: "Email sending failed" });
                    } else {
                        console.log("Email sent: " + info.response);
                        return res.status(200).json({ message: "Password sent successfully to your email." });
                    }
                });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// Get all users with 'user' role
router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let query = "SELECT id, name, email, contactNumber, status FROM user WHERE role='user'";
    
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});

// Update user status
router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let user = req.body;
    let query = "UPDATE user SET status=? WHERE id=?";
    
    connection.query(query, [user.status, user.id], (err, results) => {
        if (!err) {
            if (results.affectedRows == 0) {
                return res.status(404).json({ message: "User ID does not exist." });
            } else {
                return res.status(200).json({ message: "User updated successfully." });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// Check token validity
router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" });
});

// Change Password Route
router.post('/changePassword', auth.authenticateToken, (req, res) => {
    const user = req.body;
    const email = res.locals.email; // email from token
    console.log(email);
    let query = "SELECT * FROM user WHERE email=? AND password=?";
    connection.query(query, [email, user.oldPassword], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(400).json({ message: "Incorrect Old Password" });
            } else if (results[0].password == user.oldPassword) {
                query = "UPDATE user SET password=? WHERE email=?";
                connection.query(query, [user.newPassword, email], (err, results) => {
                    if (!err) {
                        return res.status(200).json({ message: "Password Updated Successfully" });
                    } else {
                        return res.status(500).json(err);
                    }
                });
            } else {
                return res.status(400).json({ message: "Something went wrong. Please try again later." });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

module.exports = router;
