var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;
  
// Courier Model
var CourierSchema = exports.schema = new mongoose.Schema({
  driver_license: String,
  vehicle_registration: String,
  has_smartphone: Boolean,
  availability: [{
    days: Date,
    timeframes: {
      begin: Date,
      end: Date,
    },
    // locations: [Location]
  }]
});

var plugins = require('schema-plugins');

CourierSchema.plugin(plugins.addLocation);
CourierSchema.plugin(plugins.addDisbursementInfo);
CourierSchema.plugin(plugins.addTelephone);