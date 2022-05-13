const mongoose = require("mongoose");
const acceptedCurrencySchema = new mongoose.Schema({
        name:{
            type: String,
            required:true
        }
});
const marketListingSchema = new mongoose.Schema({
    user_email:{
        type: String,
        required: true
    },
    curr_name:{
        type: String,
        required:true
    },
    curr_amount:{
        type: Number,
        required: true
    },
    accepted_curr:[acceptedCurrencySchema]
});

module.exports = mongoose.model("marketListing", marketListingSchema);