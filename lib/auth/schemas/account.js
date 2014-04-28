var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types
  , _ = require('underscore')
  , bcrypt = require('bcrypt');

var ProfileSchema = require('./profile').schema;
var roles = require('./roles');

var AccountSchema = exports.schema = new mongoose.Schema({
  roles: {
    type:[String],
    default: ["customer"]
  },
  profiles: [ProfileSchema],
  salt: String,
  hash: String
});

AccountSchema.methods.is = function (role) {
  return _.contains(this.roles, role);  
}

AccountSchema.methods.isnt = function (role) {
  return !this.is(role);
}

AccountSchema.methods.addRole = function (role) {
  if (!this.roles || this.roles === undefined) {
    this.roles = []
  }
  winston.info("adding role",role);
  this.roles.push(role);
  this.markModified('roles');
  this.save( function (err) {
    if (err) {
      winston.error("Couldn't add role to account", role);
      winston.error("Error:", err)
      return { status: false, error: err};
    } else {
      // return {status: true, role: newRole};
      winston.info("New role \""+role+"\" succesfully added to account.", this.roles);
      return {status: true, role: role};
    }
  });
}

AccountSchema.virtual('password').get( function () {
  return this._password;
}).set( function (password) {
  this._password = password;
  var salt = this.salt = bcrypt.genSaltSync(10);
  this.hash = bcrypt.hashSync(password, salt);
});

AccountSchema.method('authenticate', function (password, callback) {
  bcrypt.compare(password, this.hash, callback);
});


AccountSchema.static('authenticate', function (login, password, callback) {  
  this.findOne({ email: login }, function (err, account) {
    if (err) return callback(err);
    if (!account) return callback('Account with login ' + login + ' does not exist');
    account.authenticate(password, function (err, didSucceed) {
      if (err) return callback(err);
      if (didSucceed) return callback(null, account);
      return callback(null, null);
    });
  });
});

AccountSchema.static('getEmailsByRole',function(role,callback){
  //winston.info("Looking for:", role)
  this.find({"roles":role},function(err, accounts){
    if (err) throw new Error(err);
    //winston.info("Found:",accounts)
    var emails = _.pluck(accounts,"email");
    
    callback(emails);
  });
});

var plugins = require('schema-plugins');

AccountSchema.plugin(plugins.addEmail);
AccountSchema.plugin(plugins.addName);
AccountSchema.plugin(plugins.addAddress,["billing_address","shipping_address"]); 
