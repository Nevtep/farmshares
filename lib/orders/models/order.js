var mongoose = require('mongoose');

var OrderSchema = require("../schemas").Order;

exports.model = mongoose.model('Order',OrderSchema);