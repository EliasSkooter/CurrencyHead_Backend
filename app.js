require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
var bodyParser = require('body-parser');
const Currency = require("./model/currency");
const IP = "http://127.0.0.1:9090";
const fetch = require('node-fetch');
const EventEmitter = require('events');
const emitter = new EventEmitter();
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
        console.log("registered user successfully...");
        res.status(200).json(user);
    } catch (err) {
        console.log(err);
        res.status(400).send("registration failed");
    }
    // Our register logic ends here
});


// Login
app.post("/login", async (req, res) => {

    // Our login logic starts here
    console.log("req ==> " + req);
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
            // res.redirect(url.format({
            //     pathname: "/welcome",
            //     query: {
            //         "token": user.token,
            //         "first_name": user.first_name,
            //     }
            // }));
            let userDetails = {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "token": user.token,
                "currencies": user.currencies,
            };
            res.send(userDetails);

        } else {
            console.log("login failed...");
            res.status(400).send("Invalid Credentials");
        }
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
                updateDate: new Date().toISOString(), // sanitize: convert email to lowercase
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

//function for fetching currencies
function fetchCurrencies(){
    fetch("http://api.exchangeratesapi.io/v1/latest?access_key=6fac61839f259e7a3390db2d491dc263", {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },

        })
            .then(res => res.json())
            .then(async res => {
                console.log("Successfully retrieves exchange rates...", res.rates['AED']);
                const result = Object.keys(res.rates).map(key => ({ [key]: res.rates[key] }));

                for (let item of result) {
                    let resultString = JSON.stringify(item);
                    let name = resultString.substring(resultString.indexOf('"') + 1, resultString.lastIndexOf('"'));
                    let value = resultString.substring(resultString.indexOf(":") + 1, resultString.indexOf("}"));
                    console.log("name =>", name);
                    console.log("rate =>", parseInt(value));

                    let bodyReq = {
                        name: name,
                        value:(value/1.056401), //converting it to dollar
                        
                    }

                    await fetch(IP + "/updateCurrency", {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-type': 'application/json'
                        },
                        body: JSON.stringify(bodyReq)
                    })
                        .then(res => res.json())
                        .then(res => {
                            console.log("saved currency!", res);
                        })
                }
});
}
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
function intervalFunc() {
    console.log('WIIII PEEE!');
}
setInterval(intervalFunc, 10000);
// fetchCurrencies();
module.exports = app;