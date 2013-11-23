var express = require("express");
var app = module.exports = express();
var auth = require("auth");

exports.handlers = require("./controllers/home");

app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

// index
app.get('/', exports.handlers.home);

app.get('/redirect', auth.middleware.redirect, function (req, res) { });

// newsletter
app.post('/subscribe', exports.handlers.subscribe);

app.get('/products', function (req, res) {
    res.redirect("/", 303);
});

app.get('/farms', function (req, res) {
    res.redirect("/", 303);
});

app.get('/about', function (req, res) {
    res.render("about");
});

app.get('/joinus', function (req, res) {
    res.render("joinus");
});