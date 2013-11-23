// Require dependencies
var geoip = require('geoip-lite');
var gmaps = require('googlemaps');
var async = require('async');
var _     = require('underscore');

// @method  middleware
// @desc    Geolocation Middleware that takes the IP and attaches
//          a geo object to the request.
exports.middleware = function (req, res, next) {
  // When/if using Google Maps from the client side
  // This should just check if the session has already
  // a geolocation object and if it doesnt
  // then look one up using the ip address

  winston.info("Retrieving geolocation data for:", req.ip);
  req.geo = geoip.lookup(req.ip);
  next();
}

// @method  geoFilterFarms
// @param   geo       users geometry
// @param   cb        callback
// @param   options   additional search options
// @return  array of farms filtered by location or an empty array
// 
// @desc    Filter farms by location by triangulating their
//          positions. This is actually kinda useful because you
//          could pass in any geo object as long as it has a
//          ll propierty that is composed by lat/long as numbers
//          in an array. So this is easily usable wether you 
//          get the geo object upon every request or store it in
//          the session or in the database.
//          The options allow to extend the filtering or replace it 
//          altogether thou the default is ok for now.
exports.geoFilterFarms = function (geo, options, cb) {
  // Empty results is what you get!
  var result = [];

  // Allow for geoFilterFarms(geo,options,cb)
  // and for geoFilterFarms(geo,cb)
  if(typeof(options) === 'function' && (!cb || cb === undefined) ){
    cb = options;
    options = {};
  }

  // Check the geo object has what we need
  // and that there is a callback
  if( !geo || !geo.ll || !cb) {
    winston.error("geoFilterFarms: either geo or cb are empty", [geo,cb]);
    throw result;
  } else {
    // Get the Farm model
    var Farm = require('farms').models.Farm;
    // Define the geospatial conditions
    // This is pretty easier than what it sounds like
     winston.info("Geocords:", geo.ll);
    var conditions = _.isEqual(geo.ll,[0,0]) ? { "location.country.shortname" : geo.country }:{
      "location.geometry" : {
        $nearSphere: [geo.ll[1], geo.ll[0]], //lat/lon to lon/lat
        $maxDistance: 10
      }
    }  ;
    // Extend the conditions with the options passed as arguments
    options = options || {};
    _.extend(conditions, options);
    winston.info("Conditions:", conditions);
    // Get the farms!
    Farm.find(conditions, null, {lean :true}, function (err, farms) {
        // If there is any problem (and I can assure you there were)
        // Log the error and return an empty string
        // On the front end this should be interpreted as an error
        // And either reload the page or show a message or whateva
        if(err) {
          winston.error("geoFilterFarms: Geospatial query error", err);
          result = [];
        } else {
          // Otherwise save the farms
          result = farms;
        }
        // And lets call cb with both the err and result vars
        cb(err, result);
      }
    );
  }
}

// @method  geoFilterSKUs
// @param   geo       users geometry
// @param   cb        callback
// @param   options   additional search options
// @return  array of SKUs filtered by farm location or an empty array
// 
// @desc    Filter SKUs by farm location by triangulating their
//          positions. This is actually kinda useful because you
//          could pass in any geo object as long as it has a
//          ll propierty that is composed by lat/long as numbers
//          in an array. So this is easily usable wether you 
//          get the geo object upon every request or store it in
//          the session or in the database.
//          The options allow to extend the filtering or replace it 
//          altogether thou the default is ok for now.
exports.geoFilterSKUs = function (geo, options, cb) {
  // Empty results is what you get!
  var result = [];

  // Allow for geoFilterSKUs(geo,options,cb)
  // and for geoFilterSKUs(geo,cb)
  if(typeof(options) === 'function' && (!cb || cb === undefined) ){
    cb = options;
    options = {};
  }

  // Check the geo object has what we need
  // and that there is a callback
  if( !geo || !geo.ll || !cb) {
    winston.error("geoFilterSKUs: either geo or cb are empty", [geo,cb]);
    throw new Error("geoFilterSKUs: either geo or cb are empty");
  } else {
    // Get the SKU model
    var SKU = require('farms').models.SKU;
    // Get the Farm model
    var Farm = require('farms').models.Farm;
    // Define the geospatial conditions
    // This is pretty easier than what it sounds like
    winston.info("Geocords:", geo.ll);
    var geoConditions = _.isEqual(geo.ll,[0,0]) ? { "location.country.shortname" : geo.country }:{
      "location.geometry" : {
        $nearSphere: [geo.ll[1], geo.ll[0]], //lat/lon to lon/lat
        $maxDistance: 10
      }
    }  ;
    // Extend the conditions with the options passed as arguments
    options = options || {};
    _.extend(geoConditions, { disabled : false });
    winston.info("Conditions:", geoConditions);
    Farm.find(geoConditions, {_id: 1}, null, function (err, farms) {
    // Get the skus!
      var conditions = { farm : { "$in" : _.pluck(farms,"_id")} };
      
    _.extend(conditions, options);
      
    winston.info("Conditions:", conditions);
    SKU.find(conditions, null, {lean :true}, function (err, skus) {
        // If there is any problem (and I can assure you there were)
        // Log the error and return an empty string
        // On the front end this should be interpreted as an error
        // And either reload the page or show a message or whateva
        if(err) {
          winston.error("geoFilterSKUs: Geospatial query error", err);
          result = [];
        } else {
          // Otherwise save the skus
          result = skus;
        }
        // And lets call cb with both the err and result vars
        cb(err, result);
      }
    );
    });
  }
}

// @method  getLatLongFromString
// @param   location_string   the string to be queried upon
// @param   cb                the callback
// @return  [latitude, longitude] as a float number 2-element array
//          of empty array
//          
// @desc    processes a location string to retrieve it's absolute position
//          as an utility function its useful to re-encode a farms location
//          if it has been set erroneously
exports.getLatLongFromString = function (location_string, cb) {
  // Default result
  var geometry = [0,0];
  // If the location string isnt there then the callback won't be there
  // Or the callback would be the string or something weird
  // So lets just check if it's empty when trimmed
  if(location_string.trim().length == 0) {
    // And return the origin
    cb(geometry)
    return;
  }
  // Or, geocode it
  gmaps.geocode(location_string, function (err, res) {
    // So lets return by default the origin if there's an error
    // encoding this string. We don't want a whole batch process
    // to terminate weirdly because of a uncatched exception here
    if (err) {
      winston.error("getLatLongFromString Failed", { error: err });
      cb(geometry);
    } else {
      // Else, lets take this values
      // Remember that Mongo usas LONG/LAT
      // whereas google uses LAT/LONG
      // Actually everyone uses LAT/LONG
      geometry[0] = res.results[0].geometry.location.lng || 0;
      geometry[1] = res.results[0].geometry.location.lat || 0;
    }
    // Pass in the result to the callback
    cb(geometry);
  });
}
