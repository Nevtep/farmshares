var express = require('express')
	, app = exports = module.exports = express();

exports.schemas = require("./schemas");
exports.models = require("./models");
exports.handlers = require("./controllers/order");
exports.dispatch = require("./controllers/dispatch");
exports.gateways = require("./controllers/gateways");

app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

// orders
app.get('/cart', function (req, res) {
    res.render("cart");
});

app.post('/checkout', exports.handlers.checkout);
app.get('/checkout', function (req, res) {
    req.session.nextUrl = "/checkout";
    req.session.save();
  res.render("checkout", {country:req.geo.country.toLowerCase()});
});
app.post('/payments/puntopagos/notify', exports.gateways.puntopagos.notify_post);
app.get('/payments/puntopagos/failure/:token', exports.gateways.puntopagos.failure);
app.get('/payments/puntopagos/success/:token', exports.gateways.puntopagos.success);

app.get("/payments/*", function (req, res) {
    res.redirect('/', 301);
});

// TODO: Security Validations.
app.get("/order/dispatch/wholesales/:farm_id", exports.handlers.wholesales);
app.get("/order/dispatch/shareholdings/:customer_id", exports.handlers.shareholdings);
app.get("/order/dispatch/delivery/plan/:courier_id", exports.handlers.deliveryPlan);
app.get("/order/dispatch/delivery/schedule/:courier_id", exports.handlers.deliverySchedule);

app.post("/order/dispatch/deliveries", exports.handlers.dispatchDeliveries);