var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

// Customer Model
var CustomerSchema = exports.schema = new mongoose.Schema({
  orders: [{
    type: Types.ObjectId,
    rel: "Order"
  }]
});

var plugins = require('schema-plugins');

CustomerSchema.plugin(plugins.addBillingInfo);
CustomerSchema.plugin(plugins.addLocation); // shipping info
CustomerSchema.plugin(plugins.addTelephone);