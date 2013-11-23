var mongoose = require('mongoose')
	, AccountSchema = require('../schemas').Account;

exports.model = mongoose.model("Account", AccountSchema);