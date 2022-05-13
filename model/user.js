const mongoose = require("mongoose");
const currency = require("./currency");

const currencyAmount = new mongoose.Schema({
    currency : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "currency"
    },
    amount: {
        type: Number,
        default: 0
    }
});

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
    }],
    currencyWallet:[currencyAmount]
});

module.exports = mongoose.model("user", userSchema);