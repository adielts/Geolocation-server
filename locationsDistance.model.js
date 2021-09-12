var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var locationsSchema = new Schema({
id:String,
distance:Number,
hits:Number
})

module.exports = mongoose.model('LocationDistance',locationsSchema);