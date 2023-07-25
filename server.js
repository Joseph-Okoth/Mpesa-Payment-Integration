require("dotenv").config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDb = require("./connection/dbConnection");
const Payment = require("./models/paymentmodel");
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }))

//Mongodb connection
connectDb()


//routes
//test endpoint to see if the generate token function works
app.get('/tokencheck', (req, res) => {
    generateToken();
})
//create a generate token middleware
const generateToken = async (req,res, next)=>{ 
    const consumerKey =process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const auth=new Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            headers: {
                authorization: `Basic ${auth}`,
            }
        });
        console.log(response.data.access_token);
         token = response.data.access_token;
        next();
    } catch (err) {
        console.log(err.message);
        // res.status(400).json(err.message);
    }
}

app.post('/mpesa',generateToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;

    const date = new Date();
    const timeStamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

        const shortCode =process.env.MPESA_PAYBILL;
        const passkey = process.env.MPESA_PASS_KEY;

        const password = new Buffer.from(shortCode + passkey +timeStamp).toString("base64")

    // res.json({ phone: phone, amount: amount })Avoid sending multipe responses to the client
    await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
            BusinessShortCode:shortCode ,
            Password:password,
            Timestamp: timeStamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: `254${phone}`,
            PartyB: shortCode,
            PhoneNumber: `254${phone}`,
            CallBackURL: "https://27f8-197-237-80-19.ngrok.io/callback",
            AccountReference: `254${phone}`,
            TransactionDesc: "Test"
        },
        {
            headers:{
                Authorization: `Bearer ${token}`,
            },
        }
        ).then((response)=>{
            console.log(response.data);
            res.status(200).json(response.data);
        }).catch((err)=>{
            console.log(err.message)
            res.status(400).json(err.message)
        })

});

app.post("/callback",(req,res)=>{
    const callbackData= req.body;
    console.log(callbackData);
    if(!callbackData.Body.stkCallback.CallbackMetadata){
        console.log(callbackData.Body);
        res.sendStatus(200)// Respond with a status of 200 to acknowledge receipt of the callback  
    }

    console.log(callbackData.Body.stkCallback.CallbackMetadata);
    
    const phoneNumber=callbackData.Body.stkCallback.CallbackMetadata.Item[4].Value;
    const transaction_id=callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;
    const amount=callbackData.Body.stkCallback.CallbackMetadata.Item[0].Value;

    // console.log({phoneNumber,amount,transaction_id});
    //initiate saving transaction information into the mongoose database
    const payment = new Payment();
    payment.phoneNumber = phoneNumber;
    payment.amount = amount;
    payment.transaction_id= transaction_id;
    //save the info in the payment model
    payment.save().then((data)=> {
        console.log({message:"Saved successfully",data});
    }).catch((err)=>{
        console.log(err.message)
    })
})


port = 8080 || process.env.PORT

app.listen(port, () => console.log(`server is listening on port ${port}`))