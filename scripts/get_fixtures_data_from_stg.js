if(process.env.NODE_ENV !== "development") return;

var fs = require('fs');

global.winston = require("winston");
global.mongoose = require('mongoose');
require('../settings/mongoose');


var models = {
	account: require('auth').models.Account,
	order: require("orders").models.Order,
	farm: require("farms").models.Farm,
	share: require("farms").models.Share,
	subscription: require("farms").models.Subscription,
	sku: require("farms").models.SKU
};

global.mongoose.connection.on('open', function() {
	Object.keys(models).forEach(function(name) {
		var model = models[name];
		var fixturesFile = __dirname+'/../test/routes/unit/fixtures/'+name+'.js';
		model.find(function(err, data) {
			fs.writeFileSync(
				fixturesFile,
				JSON.stringify(data, true, 2)
			);
		});
	});
});