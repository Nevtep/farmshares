var express = require('express')
	, app = exports = module.exports = express()
	, auth = require('auth');

exports.handlers = require("./controllers/upload");

app.post('/upload/*', auth.middleware.isAdmin, exports.handlers.upload);