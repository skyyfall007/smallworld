var express = require('express');
var router = express.Router();
var app = require('../app.js');
var db = app.db;
var objectId = app.ObjectID;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

