var express = require('express');
var router = express.Router();
var app = require('../app.js');
var TripConstructor = require('../util/TripConstructor.js');
var USER_COLLECTION = 'users';
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
    console.log("/users Database connection ready");
});

//var AmadeusSandbox = require("../util/TripConstructor.js");
//var budgeter = require("../util/budgeting.js");

// Generic error handler used by all endpoints.
var handleError = function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
};

/**
 * GET trip objects constructed to user preferences
 */

router.get('/:id', function (req, res, next) {
    var id = req.params.id;
    var tripListJson = null;
    var tripBudget = null;
    var user = null;
    var departureDate = null;
    var duration = null;
    var originCity = null;
    var leaveDate = null;

    if (user == null) {
        getUserById(id).then(function (data) {
            user = data;
            tripBudget = user.budget;
            departureDate = user.departureDate;
            originCity = user.city;
            leaveDate = user.leaveDate;
            //tripListJson = flightInspiration(originCity, flightBudget, departureDate, duration);
            TripConstructor.packageTrips(originCity, tripBudget, departureDate, leaveDate).then(function (data) {
                    tripListJson = data;
                    res.status(200).json(tripListJson);
                }, function (err) {
                    console.log("could not get data");
                }
            );

        });
    };
});
/**
 * Get a user from the database with the given id
 * @param id
 * @returns {Promise}
 */
var getUserById = function (id) {
    return new Promise(function (resolve, reject) {
        var user;
        db.collection(USER_COLLECTION).findOne({_id: new ObjectID(id)}, function (err, doc) {
            if (err) {
                app.handleError(res, err.message, "Failed to find user");
                console.log("Cannot find user");
                reject(err);
            }
            else {
                user = doc;
                resolve(doc);
            }
        });
    });
};
module.exports = router;
