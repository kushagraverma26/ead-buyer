const express = require('express');
const tokenToId = require("../helpers/tokenToId")
var subscriptions = require('../models/subscription');
var buyers = require('../models/buyer');
var router = express.Router()



router.get("/",buyerValidate,(req,res)=>{
    subscriptions.find(req.query).then((subscriptions)=>{
      res.send(subscriptions)
    }).catch((err)=>{
      res.status(400).send("Bad Request")
    })
})
  


router.post("/", buyerValidate, (req, res) => {
    var subscription = new subscriptions({
      name: req.body.name,
      createdBy: req.body.userId,
      details: req.body.details,
      type: req.body.type
    })
    subscription.save((err, newSubscription) => {
      if (err) res.status(409).send(err)
      else {
        res.send(newSubscription)
      }
    })
})
  

router.delete("/:id", buyerValidate, (req, res) => {
    var id = req.params.id;
    subscriptions.findByIdAndDelete(id).then((subscription) => {
      res.send("Deleted " + subscription.name)
    }).catch((err) => {
      res.status(500).send("DB error")
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