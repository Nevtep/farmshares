var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var plugins = require("schema-plugins");

var PaymentSchema = exports.schema = new mongoose.Schema({
  currency_code: {
    type: String,
    max: 3,
    min: 2,
    required: true
  },
  amount: {
    type: Number,
    min: 1,
    required: true
  },
  provider: {
    name: String,
    data: [Types.Mixed]
  },
  date: Date
});
PaymentSchema.plugin(plugins.addStatus,["pending", "charged", "rejected"]);