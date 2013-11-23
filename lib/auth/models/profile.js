var mongoose = require('mongoose');

var ProfileSchema = require("../schemas").Profile;

// Not needed actually, embedding this into Account
exports.model = mongoose.model('Profile',ProfileSchema);