const express = require('express');
const tokenToId = require("../helpers/tokenToId");
var buyers = require('../models/buyer');
var request = require('request');
const Razorpay = require("razorpay");
var router = express.Router()

const instance = new Razorpay({
    key_id: "rzp_test_e60Ree2kIvf22h",
    key_secret: "dzCakpcWRcFtgff0XXh087Pe",
});


//For Flutter Application
//GET details of the buyer
router.get("/buyerDetails", (req, res) => {
    buyers.find(req.query).then((buyer) => {
        res.send(buyer)
    }).catch((err) => {
        res.status(400).send("Bad Request")
    })
})


// Get profile of the buyer for react app
router.get("/myProfile", buyerValidate, (req, res) => {
    tokenToId(req.get("token")).then((id) => {
        req.query['_id'] = id
        buyers.find(req.query).then((buyer) => {
            res.send(buyer)
        }).catch((err) => {
            res.status(400).send("Bad Request")
        })
    }).catch((err) => {
        res.status(400).send("Bad Request")
    })
})


// API to create order for Razorpay
router.get("/order", buyerValidate, (req, res) => {
    console.log("starting order");
    tokenToId(req.get("token")).then((id) => {
        buyers.find({ "_id": id }).then((buyer) => {
            // console.log(buyer);
            console.log(buyer[0].outstandingBill);
            console.log(buyer[0]['outstandingBill']);

            var amt = (buyer[0].outstandingBill * 100) + 100;
            const options = {
                amount: amt, // amount == Rs 10
                currency: "INR",
                receipt: "receipt " + amt.toString(),
                payment_capture: 0,
            };
            console.log(options);
            instance.orders.create(options, async function (err, order) {
                if (err) {
                    return res.status(500).json({
                        message: "Something Went Wrong while creating order",
                    });
                }
                return res.status(200).json(order);
            });
        }).catch((dberror) => {
            console.log(dberror);
            res.status(400).send("Something went wrong in finding buyer")
        })
    }).catch((err) => {
        console.log(err);
        res.status(400).send("Bad Request")
    })
});



// Razorpay payment 
// Completes payment and settles the bill
router.post("/capture/:paymentId", buyerValidate, (req, res) => {
    console.log("starting payment");
    tokenToId(req.get("token")).then((id) => {
        try {
            return request({
                method: "POST",
                url: `https://rzp_test_e60Ree2kIvf22h:dzCakpcWRcFtgff0XXh087Pe@api.razorpay.com/v1/payments/${req.params.paymentId}/capture`,
                form: {
                    amount: req.body.amount,
                    currency: "INR",
                },
            }, async function (err, response, body) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Something Went Wrong",
                    });
                }
                else {
                    buyers.findByIdAndUpdate(id, { $inc: { 'outstandingBill': 0 } }, { new: true }, function (err, buyer) {
                        if (err) {
                            console.log(err);

                            res.status(500).send("DB error while settleing bill")
                        }
                        else {
                            console.log("Status:", response.statusCode);
                            console.log("Headers:", JSON.stringify(response.headers));
                            console.log("Response:", body);
                            return res.status(200).json([body, { "outstandingBill": buyer.outstandingBill }]);
                        }
                    })
                }
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Something Went Wrong",
            });
        }
    }).catch((err) => {
        res.status(400).send("Bad Request")
    })
});



// Token Validator
function buyerValidate(req, res, next) {
    tokenToId(req.get("token")).then((id) => {
        req.body.userId = id;
        buyers.findById(id).then((buyer) => {
            if (buyer) {
                next();
            }
        }).catch((err) => {
            res.status(500).send("DB Error")
        })
    }).catch((err) => { res.status(403).send("Token Error") })

}


module.exports = router;