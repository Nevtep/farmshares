var mongoose = require('mongoose')
  , ShareSchema = require("../schemas").Share

exports.model = mongoose.model("Share", ShareSchema);
