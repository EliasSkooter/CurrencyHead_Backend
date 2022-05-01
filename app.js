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

        res.status(201).json(curr._id);
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

        res.status(201).json(curr._id);
    } catch (err) {
        console.log(err);
    }
});

//********

// app.get("/welcome", auth, (req, res) => {
//     res.status(200).send(`Welcome 🙌 ${req.query.first_name}`);
// });

// CURRENCY APIS
app.post("/updateCurrency", async (req, res) => {

    // Our register logic starts here
    try {
        // Get user input
        const {
            name,
            value,
            //added fluctuation
            fluctuation,
            history
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
                fluctuation,
                $push: {
                    history: history
                }
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
function fetchCurrencies() {
    updateLbp();
    let hourToday = new Date().getHours();
    let minUpdateFluctuation;
    if (hourToday >= 0 && hourToday < 4) minUpdateFluctuation = 6;
    else if (hourToday >= 4 && hourToday < 8) minUpdateFluctuation = 5;
    else if (hourToday >= 8 && hourToday < 12) minUpdateFluctuation = 1;
    else if (hourToday >= 12 && hourToday < 16) minUpdateFluctuation = 3;
    else if (hourToday >= 16 && hourToday < 20) minUpdateFluctuation = 2;
    else if (hourToday >= 20) minUpdateFluctuation = 1;

    // for the sake of manual update of all currencies
    // minUpdateFluctuation = 6;

    console.log(minUpdateFluctuation);
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
            const result = Object.keys(res.rates).map(key => ({
                [key]: res.rates[key]
            }));
            let currenciesMap = new Map();
            (await Currency.find()).forEach((curr) => {
                currenciesMap.set(curr.name, {
                    value: curr.value,
                    fluctuation: curr.fluctuation,
                    date: curr.updateDate
                })
            });
            console.log(currenciesMap);

            for (let item of result) {
                let resultString = JSON.stringify(item);
                let name = resultString.substring(resultString.indexOf('"') + 1, resultString.lastIndexOf('"'));
                let value = resultString.substring(resultString.indexOf(":") + 1, resultString.indexOf("}"));
                let fluctuation = currenciesMap.get(name).fluctuation;
                console.log("fluctuation =====> " + fluctuation);
                let oldValue = currenciesMap.get(name).value;
                let sensitivityThreshold = 0.1;
                console.log("name =>", name);
                console.log("rate =>", parseInt(value));
                if (fluctuation >= minUpdateFluctuation) {
                    if ((Math.abs(value - oldValue) / oldValue) > sensitivityThreshold) {
                        fluctuation++;
                        fluctuation = (fluctuation > 6) ? 6 : fluctuation;
                    } else {
                        fluctuation--;
                        fluctuation = (fluctuation < 1) ? 1 : fluctuation;
                    }

                    let bodyReq = {
                        name: name,
                        value: value,
                        fluctuation: fluctuation,
                        history: {
                            value: oldValue,
                            date: currenciesMap.get(name).date
                        }
                    }

                    if (name != "LBP") {

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
                }
            }
        });
}

async function updateLbp() {

    fetch("https://lirarate.org//wp-json/lirarate/v2/rates?currency=LBP", {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvbGlyYXJhdGUub3JnIiwiaWF0IjoxNjIwOTQxNDM5LCJuYmYiOjE2MjA5NDE0MzksImV4cCI6MTY1MzA4MjIzOSwiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMiJ9fX0.l0U9oMeNMbkGGpUtrllYh7cqt7blxuZCqSlOO-7hbsI'
            },
        }).then(res => res.json())
        .then(async resJson => {
            let currentLbp = await Currency.findOne({
                name: "LBP"
            });
            let oldVal = currentLbp.value;
            let oldUpdateDate = currentLbp.updateDate;
            let bodyReq = {
                name: "LBP",
                value: resJson.buy[resJson.buy.length - 1][1],
                fluctuation: 6,
                history: {
                    value: oldVal,
                    date: oldUpdateDate,
                }
            }
            console.log("body reqqq ===> " + JSON.stringify(bodyReq));
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
        })
}

async function updateLbpManually() {

    console.log("inn updating lbp manually");


    let currentLbp = await Currency.findOne({
        name: "LBP"
    });
    let oldVal = currentLbp.value;
    let oldUpdateDate = currentLbp.updateDate;
    let bodyReq = {
        name: "LBP",
        value: 26400,
        fluctuation: 6,
        history: {
            value: oldVal,
            date: oldUpdateDate,
        }
    }
    console.log("body reqqq ===> " + JSON.stringify(bodyReq));
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
//currency update every 4 hours
setInterval(fetchCurrencies, 14400000);

// used to manually call the functions
// fetchCurrencies();
// updateLbp();
// updateLbpManually();

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