var express = require("express");
var app = module.exports = express();
var auth = require("auth");

// Export route handlers and models in case they are needed from other modules.
exports.handlers = require("./controllers/customer");

// Configure view Engine and paths.
app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

// Setup routes
app.get('/customer', auth.middleware.isCustomer, exports.handlers.dashboard);

app.get('/customer/section/info', auth.middleware.isCustomer, exports.handlers.info);

app.post('/customer/update', auth.middleware.isCustomer, exports.handlers.update);
