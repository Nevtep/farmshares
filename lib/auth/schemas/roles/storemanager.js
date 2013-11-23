var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

// Store Manager Model
var StoreManagerSchema = exports.schema = new mongoose.Schema({
  stores: [{
    type: Types.ObjectId,
    rel: 'Place'
  }]
});

var plugins = require('schema-plugins');

StoreManagerSchema.plugin(plugins.addDisbursementInfo);
StoreManagerSchema.plugin(plugins.addTelephone);