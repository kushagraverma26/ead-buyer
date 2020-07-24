const express = require('express');
const tokenToId = require("../helpers/tokenToId");
const cron = require("node-cron");
var subscriptions = require('../models/subscription');
var buyers = require('../models/buyer');
var router = express.Router()

//For Flutter Application
//GET all subscriptions API
router.get("/allSubscriptions", (req, res) => {
  subscriptions.find(req.query).then((subscriptions) => {
    res.send(subscriptions)
  }).catch((err) => {
    res.status(400).send("Bad Request")
  })
})



//For React Application
//GET API for getting subscriptions for the current user
router.get("/mySubscriptions", buyerValidate, (req, res) => {
  tokenToId(req.get("token")).then((id) => {
    req.query['createdBy'] = id
    subscriptions.find(req.query).then((subscriptions) => {
      res.send(subscriptions)
    }).catch((err) => {
      res.status(400).send("Bad Request")
    })
  }).catch((err) => {
    res.status(400).send("Bad Request")
  })
})


//API for creating new subscriptions
router.post("/", buyerValidate, (req, res) => {
  var subscription = new subscriptions({
    name: req.body.name,
    createdBy: req.body.userId,
    details: req.body.details,
  })
  subscription.save((err, newSubscription) => {
    if (err) res.status(409).send(err)
    else {
      res.send(newSubscription)
    }
  })
})


//confirm delivery and update bill from flutter application
router.post("/delivered", (req, res) => {
  subscriptions.findByIdAndUpdate(req.body.id, { $set: { deliveredToday: true } }, { new: true }, function (err1, updatedSubscription) {
    if (err1) {
      res.status(500).send("DB error in updating")
    }
    else {
      buyers.findByIdAndUpdate(req.body.createdBy, { $inc: { 'outstandingBill': req.body.amount } }, { new: true }, function (err2, buyer) {
        if (err2) {
          console.log(err2);
          res.status(500).send("DB error in billing")
        }
        else {
          res.send([{ "outstandingBill": buyer.outstandingBill, "updatedSubscription": updatedSubscription.name }])
        }
      })
    }
  })
})


//API to delete subscription
router.delete("/:id", buyerValidate, (req, res) => {
  var id = req.params.id;
  subscriptions.findByIdAndDelete(id).then((subscription) => {
    res.send("Deleted " + subscription.name)
  }).catch((err) => {
    res.status(500).send("DB error")
  })
})


//Cron which sets all the subscriptions from "delivered" to "not deliverd" every midnight 
cron.schedule("0 0 * * *", async function () {
  console.log("running a task every midnight");
  var allSubscriptions = await subscriptions.find({});
  console.log(allSubscriptions);
  for (i = 0; i < allSubscriptions.length; i++) {
    console.log(allSubscriptions[i]['name']);
    subscriptions.findByIdAndUpdate(allSubscriptions[i]['_id'], { $set: { deliveredToday: false } }, { new: true }, function (err, subscription) {
      if (err) {
        console.log("DB error");
      }
      else {
        console.log(subscription);
      }
    })
  }
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