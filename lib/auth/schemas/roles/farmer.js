var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

// Farmer Schema
var FarmerSchema = exports.schema = new mongoose.Schema({
  farms: [{
    type: Types.ObjectId,
    rel: "Farm"
  }]
});

var plugins = require('schema-plugins');

FarmerSchema.plugin(plugins.addDisbursementInfo);
FarmerSchema.plugin(plugins.addTelephone);