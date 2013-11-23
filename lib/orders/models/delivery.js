var mongoose = require('mongoose');

var DeliverySchema = require("../schemas").Delivery;

exports.model = mongoose.model('Delivery',DeliverySchema);