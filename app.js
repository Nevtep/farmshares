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
        locales: ['en', 'es']
    });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: "thatisthewayitshouldbeitismydestiny",
        store: new MongoStore({
            url: mongoose.dbUrl
        })
    }));    
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
    , hostname: 'farmshares.com'
    , port: 80
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
* Create the webserver
*/
http.createServer(app).listen(app.get('port'), function() {
    winston.info("FarmShares server listening on port: " + app.get('port'));
    //This code will leave the server in nodejitsu out of memory.
    //geolocation will not work properly since without this only country data is retrieved
    /*console.log('Will download GeoIP-lite');  
    var ps = spawn('node', "./node_modules/geoip-lite/scripts/updatedb.js".split(" "));
    ps.stdout.pipe(process.stdout);
    ps.stderr.pipe(process.stderr);
    ps.stdout.on('end', function () { console.log('done')*/
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
  //});
  
  }
);