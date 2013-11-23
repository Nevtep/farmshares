var express = require("express");
var app = exports = module.exports = express();

exports.handlers = {};
exports.handlers.auth = require("./controllers/auth");
exports.handlers.account = require("./controllers/account");
exports.middleware = require("./controllers/middleware");
exports.models = require("./models");
exports.schemas = require("./schemas");

app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

app.get('/users/get', exports.handlers.account.get);
app.get('/users/get/model', exports.handlers.account.getModel);