/**
* Module dependencies.
*/
var winston = require("winston")
  , express = require('express')
  , everyauth = require('everyauth')
  , https = require('https')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , semver = require('semver')
  , MongoStore = require('connect-mongo')(express)
  , mongoose = require('mongoose')
  , i18n = require('i18n-2')
  , locale = require('locale')
  , errors = require('errorhandling')
  , spawn = require('child_process').spawn;

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.on('uncaughtException', function(err){  
  errors(err);
});

global.winston = winston;
global.everyauth = everyauth;
global.mongoose = mongoose;
//Load Settings (winston, mongoose, everyauth)
require('./settings/winston');
require('./settings/mongoose');
require('./settings/auth');

/**
* WebServer Config
*/
var app = express();

var port = process.env.PORT || 3000;
var supportedLocales=['en', 'es'];
app.configure(function () {
    app.set('port', port);

    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.enable('trust proxy');
    app.use(require('stylus').middleware({ src: __dirname + '/public', force: true}));    
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.favicon());    
    i18n.expressBind(app, {
        // setup some locales - other locales default to en silently
        locales: supportedLocales
    });
    app.use(locale(supportedLocales));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: "thatisthewayitshouldbeitismydestiny",
        store: new MongoStore({
            url: mongoose.dbUrl
        })
    }));    
    //Set session locale
    app.use(function(req,res,next){
      if(!req.query.lang) {
        if(req.session.preferredLocale)
          req.i18n.setLocale(req.session.preferredLocale);
        else {
          req.i18n.setLocale(req.locale);
        }
      } else {
        req.session.preferredLocale = req.i18n.getLocale();
        req.session.save();
      } 
      next();
    });
    app.use(require('geolocation').middleware);
    app.use(everyauth.middleware());    
    //app.use(app.router);
});


app.configure('development', function () {
  app.use(express.logger());
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
});

app.configure('staging', function () {
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
});


app.configure('production', function() {
  app.use(
    function(req,res,next){
      if (req.headers['x-forwarded-proto'] !== 'https') {
        var url = 'https://' + req.headers.host + '/';
        res.writeHead(301, {'location': url});
        return res.end('Redirecting to <a href="' + url + '">' + url + '</a>.');
      } else {
        return next(); 
      }
    }
  );
});


// Setup routes
var home = require('home');
var farms = require('farms');
var auth = require('auth');
var admin = require('admin');
var upload = require('uploads');
var orders = require('orders');
var farmer = require('farmer');
var courier = require('courier');
var customer = require('customer');
var storemanager = require('storemanager');

app.use(home);
app.use(farms);
app.use(auth);
app.use(admin);
app.use(upload);
app.use(orders);
app.use(farmer);
app.use(courier);
app.use(customer);
app.use(storemanager);
app.use(errors);
/**
* CDN Config
*/
// Set the CDN options

var cdnOptions = {}
if(process.env.NODE_ENV === "production")
    cdnOptions = {
        publicDir: path.join(__dirname, 'public')
	  , viewsDir: path.join(__dirname, 'lib')
	  , domain: process.env.CDNHOST
	  , bucket: process.env.S3BUCKET
	  , key: process.env.AWSKEY
	  , secret: process.env.AWSSECRET
	  , hostname: 'www.farmshares.com'
	  , port: 443
	  , ssl: true
	  , production: true
	  , logger: winston.info
    };
else if (process.env.NODE_ENV === "staging")
    cdnOptions = {
        publicDir: path.join(__dirname, 'public')
	  , viewsDir: path.join(__dirname, 'lib')
	  , domain: process.env.CDNHOST
	  , bucket: process.env.S3BUCKET
	  , key: process.env.AWSKEY
	  , secret: process.env.AWSSECRET
	  , hostname: 'staging.farmshares.com'
	  , port: 80
	  , ssl: false
	  , production: true
	  , logger: winston.info
    };
else	
    cdnOptions = {
        publicDir: path.join(__dirname, 'public')
    , viewsDir: path.join(__dirname, 'lib')
    , domain: process.env.CDNHOST
    , bucket: process.env.S3BUCKET
    , key: process.env.AWSKEY
    , secret: process.env.AWSSECRET
    , hostname: process.env.HOSTNAME
    , port: process.env.PORT
    , ssl: false
    , production: false
    , logger: winston.info 
    };

/* MIXPANEL */
// grab the Mixpanel factory
var Mixpanel = require('mixpanel');

// create an global.instance of the mixpanel client
var mixpanel = Mixpanel.init('e1c74e6ca2c4d4cdbcdc6e9fdd55ae20');
global.mixpanel = mixpanel;


/**
* Delivery E-Mail sending cron task
*/
var courierEmailDaemon = function(){
	var dispatch = require("orders").dispatch
	  , _ = require("underscore");
	// get deliveries
	var now = new Date();
	var nextMonday = now.getDay() > 1 ? new Date(now.getTime() + ((8 -now.getDay()) * (60*60*24*1000))) : new Date(now.getTime() + ((1 -now.getDay()) * (60*60*24*1000)));
	nextMonday.setHours(23);
	nextMonday.setMinutes(59);
	nextMonday.setSeconds(59);
	
	var filters = { 
		"timeframe.end" : { "$lt" : nextMonday }
	};
	var Account = require("auth").models.Account;
	dispatch.getDeliveries(filters, function(deliveries){
  	Account.find({"roles" : "courier" }, function(err,accounts) {
  	  var sendEmails = _.after(accounts.length,function(){
        
  	  });
  	  
  	  _.each(accounts, function(courier){
      	
    		var deliveries_obj = {
    		  courier : courier.toObject(),
          deliveries : deliveries
        };
        var deliveriesMailOptions = {
          from: "Farm Shares Support <support@farmshares.com>", // sender address
          cco: ["support@farmshares.com"], // loopback address
          to: courier.email, // list of receivers
          subject: "Próximas Entregas de FarmShares.com" // Subject line
        };
        var MailModel = require("mailing").models.Mail;

        var email = new MailModel();
    
        email.status.push({name:"queued", timestamp:new Date()});
        email.templateName = "upcomingdeliveries";
        email.templateData = deliveries_obj;
        email.mailOptions = deliveriesMailOptions;
    
        email.save(function (err) {
            if(err) throw new Error(err);
        });
      });
    });
  });    
};

/**
* Create the webserver
*/
http.createServer(app).listen(app.get('port'), function() {
    winston.info("FarmShares server listening on port: " + app.get('port'));
    
    // Initialize the CDN magic
    var CDN = require('express-cdn')(app, cdnOptions);
  
    global.CDN = CDN();
    // Add the view helper
    home.locals({ CDN: CDN() });
    farms.locals({ CDN: CDN() });
    auth.locals({ CDN: CDN() });
    admin.locals({ CDN: CDN() });
    upload.locals({ CDN: CDN() });
    orders.locals({ CDN: CDN() });
    farmer.locals({ CDN: CDN() });
    courier.locals({ CDN: CDN() });
    customer.locals({ CDN: CDN() });
    storemanager.locals({ CDN: CDN() });
    app.locals({ CDN: CDN() });
    
    
    // Run Courier Emails task
    var now = new Date();
    var nextFriday = now.getDay() > 5 ? new Date(now.getTime() + ((12 -now.getDay()) * (60*60*24*1000))) : new Date(now.getTime() + ((5 -now.getDay()) * (60*60*24*1000)));
    nextFriday.setHours(20);
    nextFriday.setMinutes(0);
    nextFriday.setSeconds(0);
    winston.info("Sending delivery emails in: ", nextFriday.getTime() - now.getTime())
    
    setTimeout(function(){
      courierEmailDaemon();
      setInterval(function(){courierEmailDaemon()},1000*60*60*24*7)
    },nextFriday.getTime() - now.getTime());
    
    // Start Email Daemon
    setInterval(function(){
      var mailer = require("mailing").Mailer;
      mailer.sendEmails();
    }, 60000);
  }
);