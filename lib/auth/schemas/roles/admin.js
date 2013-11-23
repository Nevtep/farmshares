var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

// Admin Model
var AdminSchema = exports.schema = new mongoose.Schema({
  clearance: Number
});