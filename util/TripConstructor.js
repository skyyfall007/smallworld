var apiKey = "FBIg0ZH9w6GpqX0FIlDzp51H2GffPziy";
var googleApiKey = "AIzaSyDOjFExTVI96xAH5TlLZ0_-4eRmjG9Lt-A";
var GOOGLE_IMAGE_URL = "https://maps.googleapis.com/maps/api/place/photo?";
var GOOGLE_RESULT_IMAGE_URL = "https://maps.googleapis.com/maps/api/place/photo?";
var POINTS_OF_INTEREST_URL = "https://api.sandbox.amadeus.com/v1.2/points-of-interest/yapq-search-text";
var express = require('express');
var app = require('../app.js');
var FLIGHT_INSPIRATION_URL = "https://api.sandbox.amadeus.com/v1.2/flights/inspiration-search";
var HOTEL_SEARCH_URL = "https://api.sandbox.amadeus.com/v1.2/hotels/search-airport";
var http = require('http');
var ArrayList = require('arraylist');
var http = require('http');

// calculates daily spending budget from total budget
var getDailyBudget = function (totalBudget, numberOfDays) {
    var d = (totalBudget / numberOfDays) * 0.3;
    return (Math.floor(d));
};
// calculates flight budget from total budget
var getFlightBudget = function (totalBudget, numberOfDays) {
    var d = 0.1 * getDailyBudget(totalBudget, numberOfDays) * numberOfDays;
    console.log(d);
    return Math.floor(d);
    //return totalBudget;
};
//calculates hotel nightly budget from total budget
var getHotelNightBudget = function (totalBudget, numberOfDays) {
    var d = getDailyBudget(totalBudget, numberOfDays) * 2;
    return Math.floor(d);
};
/**
 * Function responsible for finding available locations for the given budget
 Sample request = http://api.sandbox.amadeus.com/v1.2/flights/inspiration-search?origin=BOS&
 departure_date=2017-12-01&duration=7--9&max_price=500&apikey=3tiT2AwHzjXBasqIEoGf7KCJaXMqWEvk
 * @param city
 * @param flightBudget
 * @param departureDate
 * @param duration
 * @returns {Promise} list of flight json objects
 */

var flightInspiration = function (city, flightBudget, departureDate, duration) {
    return new Promise(function (resolve, reject) {
        var query = FLIGHT_INSPIRATION_URL + "?apikey=" + apiKey + "&origin=" + city + "&max_price=" + flightBudget +
            "&departure_date=" + departureDate + "&duration=" + duration;
        var request = require('request');
        console.log("flight url", query);
        request(query, function (error, response, body) {
            if (body == null) {
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
    for (var i = 0; (i < size) && (i < jsonList.length); i++) {
        tripList[i] = jsonList[i];
    }
    return tripList;
}

/**
 * Hotel search that communicates with amadeus sandbox
 * @param originCity
 * @param checkInDate
 * @param checkOutDate
 * @param maxPrice
 * @returns {Promise} list of hotels found based on params
 */
var hotelSearch = function (originCity, checkInDate, checkOutDate, maxPrice) {
    return new Promise(function (resolve, reject) {
        var query = HOTEL_SEARCH_URL + "?apikey=" + apiKey + "&location=" + originCity + "&max_price=" + maxPrice +
            "&check_in=" + checkInDate + "&check_out=" + checkOutDate + "&number_of_results=" + 1;
        var request = require('request');
        console.log("url", query);
        request(query, function (error, response, body) {
            if (body == null) {
                reject(error);
            }
            else {
                var tripList = body;
                resolve(JSON.parse(tripList));
            }
        });
    });
};

var pointOfInterest = function (city) {
    return new Promise(function(resolve, reject){
        var query = POINTS_OF_INTEREST_URL + "?apikey=" + apiKey + "&city_name=" + city;
        var request = require('request');
        console.log("poi-url", query);
        request(query, function (error, response, body) {
            if (body == null){
                reject(error);
            } else {
                var poiList = body;
                resolve(JSON.parse(poiList));
            }
        })
    });
}
var resultList = new ArrayList();
var listWithHotel = new ArrayList();
var finalList = new ArrayList();
var flightArrayList = new ArrayList();
/**
 * Method responsible for packaging trips from amadeus data using flight and hotel searches
 * @param city
 * @param budget
 * @param departureDate
 * @param leaveDate
 * @param duration
 * @returns {Promise}
 */

var packageTrips = function (city, budget, departureDate, leaveDate) {
    return new Promise(function (resolve, reject) {
        var duration = durationFinder(departureDate, leaveDate);
        var flightBudget = getFlightBudget(budget, duration);
        var dailyBudget = getDailyBudget(budget, duration);
        var hotelBudget = getHotelNightBudget(budget, duration);

        //var flightList = [];
        flightInspiration(city, flightBudget, departureDate, duration).then(function (data) {
            var flightList = data.results;
            //console.log(flightList);
            //flightList = JSON.parse(flightList);
            var requiredSize = 4;
            if (requiredSize < flightList.length) {
                flightList = jsonChopper(flightList, requiredSize);
            }
            for (var i = 0; i < flightList.length; i++) {
                flightArrayList.add(flightList[i]);
            }
            hotelAdder(departureDate, leaveDate, hotelBudget, dailyBudget).then(function (data) {
                    if (data == null) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                        var updatedList = data;
                        for (var i = 0; i < updatedList.length; i++){
                            listWithHotel.add(updatedList[i]);
                        }
                        (pointsOfInterestAdder(data)).then(function (data) {
                            if (data == null){
                                reject(err);
                            } else {
                                resolve(data);
                            }
                        });
                    }
                }
            )
            })
        }, function (err) {
            console.log("could not get flight data");
        });
}

/**
 * Function responsible for adding hotel data to the existing arrayList of flights
 * @param departureDate
 * @param leaveDate
 * @param hotelBudget
 * @param dailyBudget
 * @returns {Promise.<*[]>}
 */
var hotelAdder = function (departureDate, leaveDate, hotelBudget, dailyBudget) {
    var duration  = durationFinder(departureDate, leaveDate);
    var results = [];
    for (var flight of flightArrayList) {
        var resPromise = hotelSearch(flight.destination, departureDate, leaveDate, hotelBudget).then(function (data) {
            var trip = {
                "city": "",
                "city_image_link": "",
                "from_date": "",
                "to_date": "",
                "total_budget": "",
                "daily_budget": "",
                "flight_string": "",
                "flight_cost": "",
                "hotel_name": "",
                "hotel_night_price": "",
                "hotel_image_link": "",
                "points_of_interest" : "",
                "city_code" : ""
            }
            var hotel = (data.results);
            if (hotel != undefined && hotel[0] != undefined) {
                //console.log(hotel[0]);
                trip.city = hotel[0].address.city;
                //trip.city_image_link = hotel.images[0];
                trip.from_date = departureDate;
                trip.to_date = leaveDate;
                trip.total_budget = (hotel[0].min_daily_rate.amount)*duration + dailyBudget*duration + flight.cost;
                trip.daily_budget = dailyBudget;
                trip.flight_string = flight.airline;
                trip.flight_cost = flight.cost;
                trip.hotel_name = hotel[0].property_name;
                trip.hotel_night_price = hotel[0].min_daily_rate.amount;
                trip.hotel_image_link = hotel[0].images[0];
                trip.city_code = flight.destination;
                //console.log(trip);
                resultList.add(trip);
            }
            console.log(trip.city);
            return trip;
        });
        results.push(resPromise);
    }
    return Promise.all(results).catch(err => console.log(err));
}

/**
 * Method to calculate duration of the trip given the departure and arrival date in the string format YYYY-mm-dd
 * @param departureDate
 * @param arrivalDate
 * @returns {number} duration of the trip
 */

var durationFinder = function (departureDate, arrivalDate) {
    var result = 0;
    var departureDateYEAR=departureDate.substring(0,4);
    var departureDateMONTH=departureDate.substring(5,7);
    var departureDateDATE=departureDate.substring(8,10);

    var PARSEdepartureDateYEAR=parseInt(departureDateYEAR);
    var PARSEdepartureDateMONTH=parseInt(departureDateMONTH);
    var PARSEdepartureDateDATE=parseInt(departureDateDATE);

    var YearCounterDeparture=0;
    for(var i=1;i<PARSEdepartureDateYEAR;i++)
    {
        if(i%4==0)
        {
            YearCounterDeparture=YearCounterDeparture+366;
        }
        else
        {
            YearCounterDeparture=YearCounterDeparture+365;
        }
    }

    var MonthCounterDeparture=0;
    for(var i=0;i<PARSEdepartureDateMONTH;i++)
    {
        if(i==1||i==3||i==5||i==7||i==8||i==10||i==12)
        {
            MonthCounterDeparture=MonthCounterDeparture+31;
        }
        if(i==4||i==6||i==9||i==11)
        {
            MonthCounterDeparture=MonthCounterDeparture+30;
        }
        if(i==2 && PARSEdepartureDateYEAR%4==0)
        {
            MonthCounterDeparture=MonthCounterDeparture+29;
        }
        if(i==2 && PARSEdepartureDateYEAR%4!=0)
        {
            MonthCounterDeparture=MonthCounterDeparture+28;
        }
    }

    var DayCounterDeparture=PARSEdepartureDateDATE-1;

    var TOTALDepartureDays= YearCounterDeparture+MonthCounterDeparture+DayCounterDeparture;

    var arrivalDateYEAR=arrivalDate.substring(0,4);
    var arrivalDateMONTH=arrivalDate.substring(5,7);
    var arrivalDateDATE=arrivalDate.substring(8,10);

    var PARSEarrivalDateYEAR=parseInt(arrivalDateYEAR);
    var PARSEarrivalDateMONTH=parseInt(arrivalDateMONTH);
    var PARSEarrivalDateDATE=parseInt(arrivalDateDATE);

    var YearCounterArrival=0;
    for(var i=1;i<PARSEarrivalDateYEAR;i++)
    {
        if(i%4==0)
        {
            YearCounterArrival=YearCounterArrival+366;
        }
        else
        {
            YearCounterArrival=YearCounterArrival+365;
        }
    }
    var MonthCounterArrival=0;
    for(var i=0;i<PARSEarrivalDateMONTH;i++)
    {
        if(i==1||i==3||i==5||i==7||i==8||i==10||i==12)
        {
            MonthCounterArrival=MonthCounterArrival+31;
        }
        if(i==4||i==6||i==9||i==11)
        {
            MonthCounterArrival=MonthCounterArrival+30;
        }
        if(i==2 && PARSEarrivalDateYEAR%4==0)
        {
            MonthCounterArrival=MonthCounterArrival+29;
        }
        if(i==2 && PARSEarrivalDateYEAR%4!=0)
        {
            MonthCounterArrival=MonthCounterArrival+28;
        }
    }
    var DayCounterArrival=PARSEarrivalDateDATE-1;
    var TOTALArrivalDays= YearCounterArrival+MonthCounterArrival+DayCounterArrival;
    result=TOTALArrivalDays-TOTALDepartureDays;
    return result
}

var pointsOfInterestAdder = function (resultList) {
    var results = [];
    for (var trip of listWithHotel) {
        var resPromise = pointOfInterest(trip.city_code).then(function (data) {
            var poiData = data;
            if (poiData != undefined) {
                trip.points_of_interest = poiData.points_of_interest;
                finalList.add(trip);
            }
            return trip;
        });
        results.push(resPromise);
    }
    return Promise.all(results).catch(err => console.log(err));
}
module.exports.packageTrips = packageTrips;