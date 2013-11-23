var mongoose = require('mongoose')
  , FarmSchema = require('../schemas').Farm

exports.model = mongoose.model("Farm", FarmSchema);
