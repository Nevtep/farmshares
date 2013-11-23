var express = require("express");
var app = exports = module.exports = express();
var auth = require("auth");

// Export route handlers and models in case they are needed from other modules.
exports.handlers = require("./controllers/admin");
//exports.models = require("./models")

// Configure view Engine and paths.
app.set("views", __dirname + "/views");
app.set("viewengine", "jade");

// Setup routes
app.get('/admin',  auth.middleware.isAdmin, exports.handlers.dashboard);

app.get('/admin/farms/add', auth.middleware.isAdmin, exports.handlers.farms_add);
app.get('/admin/farms/edit/:fname',  auth.middleware.isAdmin, exports.handlers.farms_edit);  
app.post('/admin/farms/update', auth.middleware.isAdmin, exports.handlers.farms_edit_process);  
app.post('/admin/farms/create', auth.middleware.isAdmin, exports.handlers.farms_process);

app.get('/admin/farms/list', auth.middleware.isAdmin, exports.handlers.farms_list);
app.get('/admin/farms/wholesales/:fid', auth.middleware.isAdmin, exports.handlers.farms_wholesales);
app.get('/admin/farms', function (req, res) {
	res.redirect('/admin/farms/list');
});

app.get('/admin/users/list', auth.middleware.isAdmin, exports.handlers.users_list);
app.get('/admin/users/shareholdings/:accountId', auth.middleware.isAdmin, exports.handlers.users_shareholdings);
app.get('/admin/users/deliveryplan/:accountId', auth.middleware.isAdmin, exports.handlers.users_deliveryplan);
app.get('/admin/users/deliveryschedule/:accountId', auth.middleware.isAdmin, exports.handlers.users_deliveryschedule);
app.get('/admin/users/edit/:id', auth.middleware.isAdmin, exports.handlers.users_edit); 
app.post('/admin/users/edit', auth.middleware.isAdmin, exports.handlers.users_edit_process);
