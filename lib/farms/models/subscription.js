var mongoose = require('mongoose')
  , SubscriptionSchema = require("../schemas").Subscription

exports.model = mongoose.model("Subscription", SubscriptionSchema);
