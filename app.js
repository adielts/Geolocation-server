var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var port = 8080;

app.get("/hello", (req, res) => {
  res.send();
});

app.listen(port, () => {
  console.log("app is listening on port: " + port);
});
