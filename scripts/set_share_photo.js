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

mongoose.hostName = util.format("%s:%s@%s:%s", user, password, hostname, port);
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
    
    var SKU = require('farms').models.SKU;   
    var _ = require("underscore");
  winston.info("Searching SKUs...")  
  SKU.find({}, function (err, skus) {
      if (err) winston.error(err)
        winston.info("Transforming shares...")
        function transform() {
            if (!skus || !skus.length) {
                winston.info("Finished!");
                process.exit();
            };
            sku = skus.shift();
            winston.info("Processing:",sku.name);
          _.each(sku.shares, function(share){
            if(share.gallery[0])
              share.photo=share.gallery[0];
          });
          sku.markModified("shares");
          sku.save(function(err){
            
            transform();
          });            
        };

        transform();
    });
});

mongoose.connection.on('error', chill_out_winston);
mongoose.connection.on('open', chill_out_winston);
mongoose.connection.on('close', chill_out_winston);
