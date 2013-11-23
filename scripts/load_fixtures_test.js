if(process.env.NODE_ENV == "development") return;

function loadFixturesMongo(callback) {
	console.log(loadFixturesMongo);
	var fixtures = require('pow-mongodb-fixtures').connect(
		'nodejitsu_realfilling_nodejitsudb1255966962'/*, 
		{
			host: "ds051977.mongolab.com",
			port: 51977,
			user: "farmshares_test",
			pass: "citiesofthefuture"
		}*/);

	//Objects
	var data = {};

	['Account', 'Farm', 'SKU', 'Order']
		.forEach(function(model) {
			var name = model.toLowerCase();
			data[name] = require(__dirname+'/../test/routes/unit/fixtures/'+name+'.js')[model]
		});

	fixtures.addModifier(function(collection, doc, cb) {
		if(collection == 'orders') {
			doc.payments.forEach(function(p) {
				p.date = new Date();
			});
		}
		cb(null, doc);
	});

	fixtures.clearAndLoad({
	    accounts: data.account,
	    farms: data.farm,
	    skus: data.sku,
	    orders: data.order
	}, function(err) {
		if(err) console.log(err);
		fixtures.close(callback);
	});
}
loadFixturesMongo();
module.exports = loadFixturesMongo;
