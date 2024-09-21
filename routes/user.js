const express = require('express');
const connection = require('../connection');
const router = express.Router();


const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
require('dotenv').config();

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


var transporter = nodemailer.createTransport({
    service : 'gmail',
    auth :{
        user : process.env.EMAIL,
        password : process.env.PASSWORD
    }
});

router.post('/forgotPassword', (req, res)=>{
    const user = req.body;
    query = "Select email,password from user where email=?";
    connection.query(query, [user.email], (err, results) =>{
        if(!err){
            if(results.length <= 0){
                return res.status(200).json({message : "Password sent successfully to your email."});
            }
            else{
                var mailOptions = {
                    from : process.env.EMAIL,
                    to :results[0].email,
                    subject : 'Password by Cafe Management System',
                    html : '<p> <b> Your Login details for Cafe Management System </b><br><b>Email:</b> '+results[0].email+'<br><b>Password : </b>'+ results[0].password+' <br> <a href="http://localhost:4200/">Click here to login</p>'
                };
                transporter.sendMail(mailOptions, function(error , info){
                    if(error){
                        console.log(error);
                    }
                    else{
                        console.log("Email sent :" +info.response)
                    }
                });
                return res.status(200).json({message : "Password sent successfully to your email."});

            }

        }
        else{
            return res.status(500).json(err);
        }
    })
})



module.exports = router;
