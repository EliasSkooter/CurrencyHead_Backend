const mongoose = require("mongoose");
const currencHistorySchema = new mongoose.Schema({
    value:{
        type: Number,
        required: true
    },
    date:{
        type: Date,
        required:true
    }
});
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
        default: 6
    },
    history:[currencHistorySchema],
});

module.exports = mongoose.model("currency", currencySchema);