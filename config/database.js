const mongoose = require("mongoose");

const mongoUlr = "mongodb://127.0.0.1:27017";

exports.connect = () => {
    // Connecting to the database
    mongoose
        .connect(`${mongoUlr}/currencyhead_db`)
        .then(() => {
            console.log("Successfully connected to database");
        })
        .catch((error) => {
            console.log("database connection failed. exiting now...");
            console.error(error);
            process.exit(1);
        });
};