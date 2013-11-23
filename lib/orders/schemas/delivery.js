var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var plugins = require("schema-plugins");

var DeliverySchema = exports.schema = new mongoose.Schema({
  info: Types.Mixed, 
  orders: {
    type: [Types.ObjectId],
    ref: "Order"
  }
});
DeliverySchema.plugin(plugins.addTimeframe);
DeliverySchema.plugin(plugins.addTag,["shipping", "courier", "dropoff"]);
DeliverySchema.plugin(plugins.addStatus,["planned", "scheduled", "onitsway", "signed", "delivered", "lost", "returned"]);
