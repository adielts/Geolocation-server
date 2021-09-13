var express = require("express");
var app = express();
var axios = require("axios").default;
var mongoose = require("mongoose");
var LocationsDistance = require("./locationsDistance.model");
const replaceAll = require("string.prototype.replaceall");

var port = 8080;
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/locationsDistance").then(() => {
  console.log("MongoDB is connected");
});

var db = mongoose.connection;

app.get("/hello", (req, res) => {
  res.send();
});

app.get("/health", (req, res) => {
  if (db.readyState == 1) {
    res.status(200).send();
  } else {
    res.status(500).send("Error, DB is not connected");
  }
});

app.get("/popularsearch", (req, res) => {
  // console.log(db.collection("locationdistances").find({}).limit(1).id);
  res.send(db.collection("locationdistances").findOne({ hits }));
});

app.get("/distance", (req, res) => {
  var source = req.query.source;
  var dest = req.query.destination;

  // Error handaling: illigal input
  if (source == undefined || dest == undefined) {
    res
      .status(400)
      .send("Error, invalid location - missing one or more locations");
  }

  source = replaceAll(source, "-", " ");
  dest = replaceAll(dest, "-", " ");
  var location2Id, location1Id;
  var resSent = false;

  var options = initOptions(source);

  getCityId(options).then((data) => {
    location1Id = data;
    // console.log(location1Id);
    options = initOptions(dest);
    setTimeout(() => {
      getCityId(options).then((data) => {
        location2Id = data;
        //   console.log(location2Id);
        checkIfExistInLocalDB(location1Id, location2Id).then((data) => {
          res.send({ distance: data.distance });
          resSent = true;
        });
      });
      setTimeout(() => {
        if (!resSent) {
          getDistance(location1Id, location2Id).then((km) => {
            updateLocation(location1Id, location2Id, km);
            res.send({ distance: km });
          });
        }
      }, 2000);
    }, 2000);
  });
});

app.post("/distance", (req, res) => {
  var source = req.body.source;
  var destination = req.body.destination;
  var distance = req.body.distance;
  var sourceId, destId;

  options = initOptions(source);
  setTimeout(() => {
    getCityId(options).then((data) => {
      sourceId = data;
      options = initOptions(destination);
      setTimeout(() => {
        getCityId(options).then((data) => {
          destId = data;
          updateLocation(sourceId, destId, distance);
          res.status(201).send();
        }, 2000);
      });
    }),
      2000;
  });
});

function createID(location1Id, location2Id) {
  if (location1Id > location2Id) {
    var temp = location1Id;
    location1Id = location2Id;
    location2Id = temp;
  }
  location1Id = JSON.stringify(location1Id);
  location2Id = JSON.stringify(location2Id);

  return location1Id + location2Id;
}

function checkIfExistInLocalDB(location1Id, location2Id) {
  if (location1Id == undefined || location2Id == undefined) {
    console.log("Error, location's ID not available");
  }
  var newId = createID(location1Id, location2Id);
  return db.collection("locationdistances").findOne({ id: newId });
}

function updateLocation(location1Id, location2Id, km) {
  if (location1Id == undefined || location2Id == undefined) {
    console.log("Error, location's ID not available");
  }

  var newId = createID(location1Id, location2Id);

  var query = { id: newId },
    update = { $inc: { hits: 1 }, $set: { distance: km } },
    options = { upsert: true, new: true };
  db.collection("locationdistances").findOneAndUpdate(
    query,
    update,
    options,
    (error, result) => {
      if (error) {
        console.log(error);
      }
    }
  );
}

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

app.listen(port, () => {
  console.log("app is listening on port: " + port);
});
