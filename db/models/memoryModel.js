var mongoose = require('../config/db');
var Schema = mongoose.Schema;

var memorySchema = new Schema({
  title: String,
  filePath: String,
  createdAt: Date,
  analyses: [],
  tags: [],
  latitude: Number,
  longitude: Number
});

module.exports = mongoose.model('Memory', memorySchema);