var express = require("express");
var app = exports = module.exports = express();

exports.handlers = {};
exports.handlers.farms = require("./controllers/farm")
exports.handlers.skus = require("./controllers/sku")
exports.handlers.models = require("./controllers/models")
exports.schemas = require("./schemas")
exports.models = require("./models")

app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

// farms
// app.get('/farms', function (req, res) {
//   res.redirect('/discover');
// });
// app.get('/discover', farm.discover);
app.get('/farms/get', exports.handlers.farms.get);
app.get('/farms/get/nearby', exports.handlers.farms.getNearby);
app.get('/farms/view/:fname', exports.handlers.farms.view);

// skus
app.get('/skus/get/category', exports.handlers.skus.getByCategory);
app.get('/subscriptions/get/shareid', exports.handlers.skus.getSubscriptionsByShare);

// Models
app.get('/farms/get/model', exports.handlers.models.farm);
app.get('/shares/get/model', exports.handlers.models.share);
app.get('/subscriptions/get/model', exports.handlers.models.subscription);
app.get('/skutypes/get/model', exports.handlers.models.skutype);
app.get('/skus/get/model', exports.handlers.models.sku);
