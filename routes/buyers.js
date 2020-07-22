const express = require('express');
const tokenToId = require("../helpers/tokenToId");
var buyers = require('../models/buyer');
var router = express.Router()


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

//Pay Bill
//Use after recording payment
router.post("/payBill", buyerValidate, (req, res) => {
    tokenToId(req.get("token")).then((id) => {
        buyers.findByIdAndUpdate(id, { $inc: { 'outstandingBill': req.body.amount * -1 } }, { new: true }, function (err, buyer) {
            if (err) {
                res.status(500).send("DB error")
            }
            else {
                res.send([{ "outstandingBill": buyer.outstandingBill }])
            }
        }).catch((err) => {
            res.status(400).send("Bad Request")
        })
    })
})

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