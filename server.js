require("dotenv").config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
// const connectDb = require("./connection/dbConnection");
// const Payment = require("./models/paymentmodel");
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }))

//Mongodb connection
// connectDb()


//routes
//test endpoint to see if the generate token function works
app.get('/tokencheck', (req, res) => {
    // generateToken();
})
//create a generate token middleware
// const generateToken = async (req,res, next)=>{ 
//     const consumerKey =process.env.MPESA_CONSUMER_KEY
//     const consumerSecret = process.env.MPESA_CONSUMER_SECRET
//     const auth=new Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
//     try {
//         const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
//             headers: {
//                 authorization: `Basic ${auth}`,
//             }
//         });
//         console.log(response.data.access_token);
//         token = response.data.access_token;
//         next();
//     } catch (err) {
//         console.log(err.message);
//         // res.status(400).json(err.message);
//     }
// }

const generateToken = () => {
    return new Promise((resolve, reject) => {
      let endpoint_auth_credentials = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
      const auth=new Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
      request(
        {
          uri: endpoint_auth_credentials,
  
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
        (err, response, body) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            const access_token = JSON.parse(body).access_token;
            resolve(access_token);
          }
        }
      );
    });
};
  

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
            console.log("data",response.data);
            res.status(200).json(response.data);
        }).catch((err)=>{
            console.log(err)
            res.status(400).json(err.message)
        })


});


port = 8080 || process.env.PORT

app.listen(port, () => console.log(`server is listening on port ${port}`))