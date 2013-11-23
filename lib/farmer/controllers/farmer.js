var geolocation = require("geolocation");

/**
 * Farmer Routes
 */

exports.dashboard = function(req, res) {
	res.render("dashboard", {
		user : req.currentUser
	});
}
