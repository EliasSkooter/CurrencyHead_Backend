const mongoose = require("mongoose");
const currencySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: Number,
        required: true
    },
    updateDate: {
        type: Date,
        default: new Date().toISOString()
    },
    fluctuation: {
        type: Number,
        default: 1
    },
});

module.exports = mongoose.model("currency", currencySchema);