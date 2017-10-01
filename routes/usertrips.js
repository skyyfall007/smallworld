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


//var AmadeusSandbox = require("../util/AmadeusSandbox.js");
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
router.get('/:budget/:departureDate/:duration/:originCity/:leaveDate', function(req, res, next) {
    var id = req.params.id;
    var count = 0;
    var tripListJson = null;
    var tripBudget = null;
    var user = null;
    var flightBudget = null;
    var hotelBudget = null;
    var departureDate = null;
    var duration = null;
    var dailyBudget = null;
    var originCity = null;
    if (user == null){
        getUserById(id).then(function(data) {
            user = data;
            tripBudget = user.budget;
            departureDate = user.departureDate;
            duration = user.numberOfDays;
            originCity = user.originCity;

            flightBudget = getFlightBudget(tripBudget);
            hotelBudget = getHotelNightBudget(tripBudget);
            dailyBudget = getDailyBudget(tripBudget);

            //tripListJson = flightInspiration(originCity, flightBudget, departureDate, duration);
            flightInspiration(originCity, flightBudget, departureDate, duration).then(function (data) {
                tripListJson = data;
                res.status(200).json(tripListJson);
            });

        });
    };

});

var getUserById  = function (id) {
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

};
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

var apiKey = "3tiT2AwHzjXBasqIEoGf7KCJaXMqWEvk";
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
var flightInspiration = function (city, flightBudget, departureDate, duration){
    return new Promise(function (resolve, reject) {
        var query = FLIGHT_INSPIRATION_URL + "?apikey=" + apiKey + "&origin=" + city + "&max_price=" + flightBudget +
            "&departure_date=" + departureDate + "&duration=" + duration;
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
}
/**
 * Reduces the size of a json list by slicing off objects
 * @param json
 * @param size
 * @returns chopped json list
 */
var jsonChopper = function (json, size) {
    var jsonList = json;
    var tripList = [];
    var counter = 0;
    for (var i = 0; (i < size) && (i < jsonList.length); i++){
            tripList[i] = jsonList[i];
    }
    return tripList;
}



module.exports = router;