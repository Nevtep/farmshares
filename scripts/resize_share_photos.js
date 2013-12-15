var winston = require("winston");
var util = require('util');
var utils = require("utils");
var mongoose = require("mongoose")
var fs = require('fs'), url = require('url'), zlib = require('zlib'), path=require("path");
global.winston=winston;
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
var AWSKEY = args[5];
var AWSSECRET = args[6];
var S3BUCKET = args[7];

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
      winston.info("Getting share's photo URLs...")
      var urls = [];
      _.each(skus,function(sku){
        _.each(sku.shares, function(share){
          if(share.photo) urls.push(url.parse("http:"+share.photo));
        });
      })
      
      var async = require('async');
      var knox = require("knox");
      
      var S3 = knox.createClient({
        key : AWSKEY,
        secret : AWSSECRET,
        bucket: S3BUCKET
      });
      async.eachLimit(urls,10,function(imageUrl,done){
        utils.processImageUrl(imageUrl.href,imageUrl.path,S3,done);
      },function(err){
        if(err) winston.error(err);
        else winston.info("All Done!");
        
        process.exit();
      })
    });
});

mongoose.connection.on('error', chill_out_winston);
mongoose.connection.on('open', chill_out_winston);
mongoose.connection.on('close', chill_out_winston);
