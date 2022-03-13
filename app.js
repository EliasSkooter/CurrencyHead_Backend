require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
var bodyParser = require('body-parser');
const Currency = require("./model/currency");

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

const auth = require("./middleware/auth");

const url = require('url');

app.get("/", (req, res) => {
    res.send("This is home page.");
});

const User = require("./model/user");

//USER
//Register API
app.post("/register", async (req, res) => {

    // Our register logic starts here
    try {
        // Get user input
        const {
            first_name,
            last_name,
            email,
            password
        } = req.body;
        // Validate user input
        if (!(email && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({
            email
        });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 15);
        console.log(encryptedPassword)
        // Create user in our database
        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign({
                user_id: user._id,
                email
            },
            'randomTokenKeyWii', {
                expiresIn: "2h",
            }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});


// Login
app.post("/login", async (req, res) => {

    // Our login logic starts here
    try {
        // Get user input
        const {
            email,
            password
        } = req.body;
        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const user = await User.findOne({
            email
        });
        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign({
                    user_id: user._id,
                    email
                },
                'randomTokenKeyWii', {
                    expiresIn: "2h",
                }
            );

            // save user token
            user.token = token;

            // user
            //   res.status(200).json(user);
            res.redirect(url.format({
                pathname: "/welcome",
                query: {
                    "token": user.token,
                    "first_name": user.first_name,
                }
            }));
        } else
            res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

app.get("/getUsers", async (req, res) => {
    const allUsers = await User.find();
    res.status(200).json(allUsers);
});

app.post("/addUserCurrency", async (req, res) => {
    try {
        // Get user input
        const {
            email,
            name
        } = req.body;
        // Validate user input
        if (!(name && email)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const curr = await Currency.findOne({
            name
        });

        const user = await User.updateOne({
            email
        }, {
            $push: {
                currencies: curr._id
            }
        });

        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }

});

app.post("/deleteUserCurrency", async (req, res) => {
    try {
        // Get user input
        const {
            email,
            name
        } = req.body;
        // Validate user input
        if (!(name && email)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const curr = await Currency.findOne({
            name
        });

        const user = await User.updateOne({
            email
        }, {
            $pull: {
                currencies: curr._id
            }
        });

        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
});

//********

app.get("/welcome", auth, (req, res) => {
    res.status(200).send(`Welcome 🙌 ${req.query.first_name}`);
});

// CURRENCY APIS
app.post("/updateCurrency", async (req, res) => {

    // Our register logic starts here
    try {
        // Get user input
        const {
            name,
            value
        } = req.body;
        // Validate user input
        if (!(name && value)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const curr = await Currency.findOne({
            name
        });
        if (curr) {
            const updatedCurrency = await Currency.updateOne({
                name
            }, {
                value,
                updateDate: new Date().toISOString(),
                fluctuation: 1
            })
            res.status(201).json(updatedCurrency);
        } else {
            const currency = await Currency.create({
                name,
                value,
                //   updateDate: new Date().toISOString(), // sanitize: convert email to lowercase
            });
            res.status(201).json(currency);
        }

    } catch (err) {
        console.log(err);
    }

    // Our register logic ends here
});

app.get("/getCurrencies", async (req, res) => {
    const allCurrencies = await Currency.find();
    res.status(200).json(allCurrencies);
});

//*******

app.use("*", (req, res) => {
    res.status(404).json({
        success: "false",
        message: "Page not found",
        error: {
            statusCode: 404,
            message: "You reached a route that is not defined on this server",
        },
    });
});

module.exports = app;