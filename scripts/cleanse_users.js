var winston = require("winston");
var util = require('util');
var mongoose = require("mongoose")
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    prettyPrint: true
});

var args = process.argv.slice(2);
var user = args[0];
var password = args[1];
var hostname = args[2];
var port = args[3];
var db = args[4];

mongoose.hostName = util.format("%s:%s@%s:%s",user,password,hostname,port);
mongoose.dbName = db;
mongoose.dbUrl = "mongodb://" + mongoose.hostName + "/" + mongoose.dbName;
	
winston.info("Database URI: " + mongoose.dbUrl);

var chill_out_winston = function (error) {
    if (error) {
        winston.error(error);
    }
}

mongoose.connect(mongoose.dbUrl, function () {
  winston.info("Database connected.");
  var AccountModel = require('auth').models.Account;	
	var _ = require('underscore');
	
	AccountModel.find({}, function (err, accounts) {
	  winston.info("Cleansing roles...")
	  function complete() {
	    if(!accounts || !accounts.length) {
	      winston.info("Finished!");
	      process.exit();
	    }
	    account = accounts.shift();
	    winston.info(account.name.full+" @ "+account.roles);
	    account.roles = ["customer"]      
      account.markModified("roles");
      account.profiles = null;
      account.markModified("profiles");
      account.save(function(err){
        if(err)
        {
          winston.error("Holy crap!", err);
          winston.error("You'll need to manually fix this, good luck!", account);
          process.exit();
        }
        complete();
      });
	  };
	
	  complete();
	});
});

mongoose.connection.on('error', chill_out_winston);
mongoose.connection.on('open', chill_out_winston);
mongoose.connection.on('close', chill_out_winston);