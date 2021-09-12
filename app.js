var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var axios = require("axios").default;
const replaceAll = require("string.prototype.replaceall");
var sleep = require("sleep");

var port = 8080;

app.get("/hello", (req, res) => {
  res.send();
});

app.get("/distance", (req, res) => {
  var source = req.query.source;
  var dest = req.query.destination;

  // Error handaling: illigal input
  if (source == undefined || dest == undefined) {
    res.status(400);
    res.send("Error, invalid location - missing one or more locations");
  }

  source = replaceAll(source, "-", " ");
  dest = replaceAll(dest, "-", " ");
  var location2Id, location1Id;

  var options = initOptions(source);

  getCityId(options).then((data) => {
    location1Id = data;
    // console.log(location1Id);
    options = initOptions(dest);
    setTimeout(() => {
      getCityId(options)
        .then((data) => {
          location2Id = data;
        //   console.log(location2Id);
        })
       setTimeout(() => {
        getDistance(location1Id, location2Id).then((km)=>
        res.send({"distance":km})); 
       }, 2000);
    }, 2000);
  });
});

app.listen(port, () => {
  console.log("app is listening on port: " + port);
});

function initOptions(location) {
  var option = {
    method: "GET",
    url: "https://wft-geo-db.p.rapidapi.com/v1/geo/cities",
    params: { limit: "10", namePrefix: location },
    headers: {
      "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
      "x-rapidapi-key": "9508850122msh5104052f9add195p1be1cejsne200822ba786",
    },
  };
  return option;
}

function getCityId(options) {
  return axios.request(options).then((response) => {
    return response.data.data[0].id;
  });
}

function getDistance(location1, location2) {
  var options = {
    method: "GET",
    url:
      "https://wft-geo-db.p.rapidapi.com/v1/geo/cities/" +
      location1 +
      "/distance",
    params: { fromCityId: location1, toCityId: location2 },
    headers: {
      "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
      "x-rapidapi-key": "9508850122msh5104052f9add195p1be1cejsne200822ba786",
    },
  };

  return axios.request(options).then((response) => {
    return response.data.data;
  });
}
