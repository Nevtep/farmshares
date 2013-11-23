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
    
    var FarmModel = require('farms').models.Farm;
    var SKUModel = require('farms').models.SKU;        
    var _ = require('underscore');

    FarmModel.find({}, function (err, farms) {
        winston.info("Transforming shares...")
        function transform() {
            if (!farms || !farms.length) {
                winston.info("Finished!");
                process.exit();
            };
            farm = farms.shift();
            winston.info("Processing:",farm.name);
            
            var skus = {};
            _.each(farm.shares, function (share) {
                // Create the SKU type
                if (skus[share.type] === undefined) {
                    var sku = {};
                    sku.farm = farm._id;
                    sku.title = share.title;
                    sku.type = share.type;
                    sku.name = share.name + " " + share.type;
                    sku.unit = share.unit;
                    sku.shares = [];

                    skus[share.type] = sku;
                };
                // Add the shares
                var newShare = {};
                newShare.subscriptions = [];
                newShare.name = share.name;
                newShare.price = share.price / 4;
                newShare.currency = share.currency;
                newShare.amount = share.amount;
                newShare.gallery = share.gallery;                
                

                // Add subscriptions
                var newSubscription = {};
                newSubscription.name = "Monthly";
                newSubscription.deliveries = 4;
                newSubscription.discount = 0;
                newSubscription.timespan = 2592000000; // Milliseconds
                newShare.subscriptions.push(newSubscription);
                if (share.discounts[3]) {
                    var newSubscription = {};
                    newSubscription.name = "3 Months";
                    newSubscription.deliveries = 12;
                    newSubscription.discount = share.discounts[3][0];
                    newSubscription.timespan = 7776000000;
                    newShare.subscriptions.push(newSubscription);
                };
                if (share.discounts[6]) {
                    var newSubscription = {};
                    newSubscription.name = "6 Months";
                    newSubscription.deliveries = 24;
                    newSubscription.discount = share.discounts[6][0];
                    newSubscription.timespan = 15552000000;
                    newShare.subscriptions.push(newSubscription);
                };
                if (share.discounts[12]) {
                    var newSubscription = {};
                    newSubscription.name = "12 Months";
                    newSubscription.deliveries = 48;
                    newSubscription.discount = share.discounts[12][0];
                    newSubscription.timespan = 31104000000;
                    newShare.subscriptions.push(newSubscription);
                };
                
                skus[share.type].shares.push(newShare);
            });
            winston.info("Processed Shares...");
            var inProgress = 0;
            _.each(_.toArray(skus),function(sku, index, list){
              inProgress += 1;
              winston.info("Processing SKU:", index +1)
              var newSKU = new SKUModel(sku);
              newSKU.save(function(err){
                  if (err) {
                      winston.error(err)
                      inProgress -= 1;
                  }
                  else {
                      winston.info("Saved SKU:", index + 1);
                      inProgress -= 1;
                  };
                  
                
                if (inProgress == 0) {
                    farm.disabled = true;
                    farm.save(function (err, farm) {
                        if (err) throw new Error(err);
                        transform();
                    });
                };
              });
            })
            if(inProgress==0)
              transform();
                        
        };

        transform();
    });
});

mongoose.connection.on('error', chill_out_winston);
mongoose.connection.on('open', chill_out_winston);
mongoose.connection.on('close', chill_out_winston);
