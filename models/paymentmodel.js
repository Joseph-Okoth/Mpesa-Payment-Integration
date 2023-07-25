const mongoose = require('mongoose');


const paymentSchema = mongoose.Schema(
    {
        transaction_id:{ type:String, required:true},
        phoneNumber:{ type:String, required:true},
        amount:{ type:String, required:true},
    },{
        timestamps:true,
    }
);

module.exports = mongoose.model("Payment",paymentSchema);
