const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/secret');
var buyers = require('../models/buyer');
var router = express.Router()



router.post("/registerBuyer", (req, res) => {
    var hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var buyer = new buyers({
      email: req.body.email,
      password: hashedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: req.body.address,
      location: req.body.location,
    })
    buyer.save((err, newBuyer) => {
      if (err) res.status(409).send(err)
      else {
        var token = jwt.sign({ id: newBuyer._id }, config.secret, { expiresIn: 86400 });
        res.send([newBuyer, { "token": token }])
      }
    })
})



router.post("/buyerLogin", (req, res) => {
    buyers.findOne({ email: req.body.email }, (err, buyer) => {
      if (err) res.status(500).send("There has been an error")
      else if (buyer == null) res.status(404).send("No account with given credentials exists")
      else {
        if (bcrypt.compareSync(req.body.password, buyer.password)) {
          var token = jwt.sign({ id: buyer._id }, config.secret, { expiresIn: 86400 });
          res.send([{"id": buyer._id, "firstName" : buyer.firstName, "outstandingBill": buyer.outstandingBill}, { "token": token }])
        }
        else res.status(403).send("Auth Error")
      }
    })
  })
  

module.exports = router