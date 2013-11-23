var env = process.env.NODE_ENV || "development";

var settings = {
	"development": {
		hostName: "realfilling_dev:timetravel@ds051977.mongolab.com:51977",
		dbName: "nodejitsu_realfilling_nodejitsudb5631547726"
	},
	"test": {
		hostName: "farmshares_test:citiesofthefuture@ds051977.mongolab.com:51977",
		dbName: "nodejitsu_realfilling_nodejitsudb1255966962"
	},
	"local": {
		hostName: "localhost",
		dbName: "nodejitsu_realfilling_nodejitsudb1255966962"		
	}
}[env];

if(settings)
	mongoose.dbUrl = "mongodb://" + settings.hostName + "/" + settings.dbName;
else
	mongoose.dbUrl = process.env.MONGOLAB_URI
	
winston.info("Database URI: " + mongoose.dbUrl);

var chill_out_winston = function (error) {
    if (error) {
        winston.error(error);
    }
}

mongoose.connect(mongoose.dbUrl, function () {
    winston.info("Database connected.");
});
mongoose.connection.on('error', chill_out_winston);
mongoose.connection.on('open', chill_out_winston);
mongoose.connection.on('close', chill_out_winston);

