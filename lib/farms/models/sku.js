var mongoose = require('mongoose')
  , SKUSchema = require("../schemas").SKU

exports.model = mongoose.model("SKU", SKUSchema);
