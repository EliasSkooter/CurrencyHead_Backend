const mysql = require('mysql2');
const express = require("express");
const app = express();
const port = 9090;
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "currencyheaddb"
});

con.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("connection to database successful!");
});

app.get("/", (req, res) => {
   res.send("This is home page.");
});

app.post("/", (req, res) => {
   res.send("This is home page with post request.");
});

app.listen(port, (res) => {
    console.log(`Started at port ${port}`);
});
