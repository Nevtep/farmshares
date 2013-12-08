exports.findOrCreate = function(provider, promise, session, accessToken, accessTokExtra, userMetadata) {
  // find or create user logic goes here
  winston.info("Provider", provider);
  winston.info("UserMetadata", userMetadata);
  
  //Create an account with role customer
  //Returns a Promise
  var createAccount = function() {
    //Create account as customer
    var newAccount;
    winston.info("Creating new user for " + userMetadata.email);
    // lets create an account
    // and assign it this name and email
    newAccount = new Account();
    newAccount.name.full = userMetadata.name;
    newAccount.email = userMetadata.email;
    //create the non existant profile
    // out of the userMetadata hash
    var newProfile = new require("auth").models.Profile({
      provider : provider,
      metadata : userMetadata
    });
    newAccount.profiles = new Array();        
    newAccount.profiles.push(newProfile);
    winston.info("New Account", newAccount);

    //save it
    newAccount.save(function(err, savedAccount) {
      // if there is no error
      if(!err) {        
        winston.log("Saving in session the account with brand new profile", savedAccount);
        savedAccount.addRole('customer');
        // and fulfill the promise
        promise.fulfill(savedAccount);
      } else {
        // otherwise return the errors
        winston.error("Unable to save new account with new profile", err);
        promise.fulfill(err.errors);
      }
    });
  }
  
  // Joins profiles together under the same account  
  var updateProfiles = function(account) 
  {    
    account.profiles = account.profiles || new Array();        
    var _ = require("underscore");
    if(!_.any(account.profiles, function(profile){ return profile.provider == provider })) {
      var newProfile = new require("auth").models.Profile({
        provider : provider,
        metadata : userMetadata
      });
      
      account.profiles.push(newProfile);    
      //save it
      account.save(function(err, savedAccount) {
        // if there is no error
        if(!err) {        
          winston.log("Saving in session the account with brand new profile", savedAccount);
          // and fulfill the promise
          promise.fulfill(savedAccount);
        } else {
          // otherwise return the errors
          winston.error("Unable to save new account with new profile", err);
          promise.fulfill(err.errors);
        }
      });
    }
  }
  //Finds or creates and account.
  var findOrCreateAccount = function(err, account) {
    // if there is an error
    if(err) {
      // or return the errors
      winston.info("Couldn't find account");
      console.log(err);
      winston.error("Couldn't find such account.", err);
      promise.fulfill(err.errors);
    }
    winston.info("Account", account);
    if(account === undefined || account === null) {
      createAccount();
    } else {
      updateProfiles(account);
    }
  }

  Account.findOne({
    email : userMetadata.email
  }, findOrCreateAccount);
  return promise;

}