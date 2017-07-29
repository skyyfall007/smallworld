var express = require('express');
var router = express.Router();
var app = require('../app.js');
var COUNTRIES_COLLECTION = 'countries';
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var mongo_connection_uri = 'mongodb://ankith:test@ds151008.mlab.com:51008/journey';
var db;
mongodb.MongoClient.connect(mongo_connection_uri, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("/countries Database connection ready");
});
// Generic error handler used by all endpoints.
var handleError = function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
};

/* GET single COUNTRIES by id listing. */
router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    db.collection(COUNTRIES_COLLECTION).findOne({ _id: new ObjectID(id) }, function(err, doc) {
        if (err) {
            app.handleError(res, err.message, "Failed to find COUNTRIES");
        } else {
            res.status(200).json(doc);
        }
    });
});

/* GET all COUNTRIESs */
router.get('/', function (req, res, next){

    db.collection(COUNTRIES_COLLECTION).find({}).toArray(function (err, docs) {
        if (err){
            app.handleError(res, err.message, "Failed to get COUNTRIESs");
        }

        else {
            res.status(200).json(docs)
        }
    })
});

/*POST COUNTRIES */
router.post('/', function(req, res, next){
    var newCountry = req.body;

    db.collection(COUNTRIES_COLLECTION).insertOne(newCountry, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new contact.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});
/*UPDATE COUNTRIES */
router.put('/:id', function (req, res, next){
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(COUNTRIES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update COUNTRIES");
        } else {
            updateDoc._id = req.params.id;
            res.status(200).json(updateDoc);
        }
    });
})
/*DELETE COUNTRIES */

router.delete('/:id', function (req, res, next){
    db.collection(COUNTRIES_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete COUNTRIES");
        } else {
            res.status(200).json(req.params.id);
        }
    });
})


module.exports = router;
