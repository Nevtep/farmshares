var mongoose = require('mongoose')
  , MailSchema = require("../schemas").Mail

exports.model = mongoose.model("Mail", MailSchema);
