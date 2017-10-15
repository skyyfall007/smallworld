var express = require('express');
var router = express.Router();
var app = require('../app.js');
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

/* GET single TRIPS by id listing. */
/*
@TODO add hotel and daily budget to each trip before sending them out
 */
router.get('/:budget/:checkInDate/:leaveDate/:city/', function(req, res, next) {
    var budget = req.params.budget;
    var checkInDate = req.params.checkInDate;
    //var duration = req.params.duration;
    var city = req.params.city;
    var tripListJson = null;
    var leaveDate = req.params.leaveDate;

    var flightBudget = getFlightBudget(budget);
    var hotelBudget = getHotelNightBudget(budget);
    var dailyBudget = getDailyBudget(budget);

    var resultList = [];

    hotelSearch(city, checkInDate, leaveDate, budget).then(function (data) {
        var hotelList = data.results[0];
        //console.log(flightList);
        res.status(200).json(hotelList);
    });
})
;
/*var getUserById  = function (id) {
    return new Promise(function (resolve, reject) {

        var user;
        db.collection(USER_COLLECTION).findOne({ _id: new ObjectID(id) }, function(err, doc) {
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

};*/
/*
@TODO make the three budgeting methods work
 */

// calculates daily spending budget from total budget
var getDailyBudget = function(totalBudget, numberOfDays){
    var d =  (totalBudget/numberOfDays) * 0.3;
    return parseInt(d);
};
// calculates flight budget from total budget
var getFlightBudget = function (totalBudget, numberOfDays) {
    var d = 0.1 * getDailyBudget(totalBudget, numberOfDays) * numberOfDays;
    //return parseInt(d);
    return totalBudget;
};
//calculates hotel nightly budget from total budget
var getHotelNightBudget = function (totalBudget, numberOfDays) {
    var d = getDailyBudget(totalBudget, numberOfDays) * 2;
    return parseInt(d);
};

var apiKey = "FBIg0ZH9w6GpqX0FIlDzp51H2GffPziy";
var FLIGHT_INSPIRATION_URL = "http://api.sandbox.amadeus.com/v1.2/flights/inspiration-search";
var HOTEL_SEARCH_URL = "https://api.sandbox.amadeus.com/v1.2/hotels/search-airport";
var http = require('http');
/*
TODO: Make a flight budget calculator method as well as cost per day calculator method
TODO: Make a holiday object
 */
/*
Function responsible for finding available locations for the given budget
Sample request = http://api.sandbox.amadeus.com/v1.2/flights/inspiration-search?origin=BOS&
departure_date=2017-12-01&duration=7--9&max_price=500&apikey=3tiT2AwHzjXBasqIEoGf7KCJaXMqWEvk
 */
var hotelSearch = function (originCity, checkInDate, checkOutDate, maxPrice) {
    return new Promise(function (resolve, reject) {
        var query = HOTEL_SEARCH_URL + "?apikey=" + apiKey + "&origin=" + originCity + "&max_price=" + maxPrice +
            "&check_in=" + checkInDate + "&check_out=" + checkOutDate + "&number_of_results=" + 1;
        var request = require('request');
        request(query, function (error, response, body) {
            if (body == null){
                reject(error);
            }
            else {
                var tripList = body;
                resolve(JSON.parse(tripList));
            }
        });
    });
};

/**
 * Reduces the size of a json list by slicing off objects
 * @param json
 * @param size
 * @returns chopped json list
 */


var hotelSearch = function (originCity, checkInDate, checkOutDate, maxPrice) {
    return new Promise(function (resolve, reject) {
        var query = HOTEL_SEARCH_URL + "?apikey=" + apiKey + "&location=" + originCity + "&max_price=" + maxPrice +
            "&check_in=" + checkInDate + "&check_out=" + checkOutDate + "&number_of_results=" + 2;
        var request = require('request');
        console.log("url", query);
        request(query, function (error, response, body) {
            if (body == null){
                reject(error);
            }
            else {
                var tripList = body;
                resolve(JSON.parse(tripList));
            }
        });
    });
};



module.exports = router;