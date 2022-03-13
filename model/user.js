const mongoose = require("mongoose");
const currency = require("./currency");

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        default: null
    },
    last_name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    token: {
        type: String
    },
    currencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "currency"
    }]
});

module.exports = mongoose.model("user", userSchema);