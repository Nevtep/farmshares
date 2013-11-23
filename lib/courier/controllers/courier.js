var geolocation = require("geolocation");

/**
 * Courier Routes
 */

exports.dashboard = function(req, res) {
	res.render("dashboard", {
		user : req.currentUser
	});
}
