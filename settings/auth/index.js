
/**
* Auth Config
*/
Account = require('auth').models.Account;

var hostname = "";
// EveryAuth options for regular users
if (process.env.NODE_ENV === "development") {
   hostname = "http://farmshares.com:3000";
} else if (process.env.NODE_ENV === "staging") {
   hostname = "http://staging.farmshares.com";
} else {
   hostname = "https://www.farmshares.com";
}

everyauth.everymodule.findUserById(function (id, callback) {
  winston.info("Looking up account", id);
  Account.findById(id , callback);
});

var auth = require("./everyauth");

everyauth.everymodule.handleLogout(function (req, res) {
    req.logout();
    this.redirect(res, "/");
});

// FACEBOOK LOGIN
everyauth.facebook
  .appId(process.env.FBAPPID)
  .appSecret(process.env.FBAPPSECRET)
  .scope('email')
  .findOrCreateUser(function (session, accessToken, accessTokenExtra, facebookUserMetadata) {
    return auth.findOrCreate("facebook", this.Promise(), session, accessToken, accessTokenExtra, facebookUserMetadata);
  }).redirectPath('/redirect');

// GOOGLE LOGIN
everyauth.google
  .appId(process.env.GGAPPID)
  .appSecret(process.env.GGAPPSECRET)
  .scope('https://www.googleapis.com/auth/userinfo.email') // What you want access to
  //.handleAuthCallbackError( function (req, res) {
    // If a user denies your app, Google will redirect the user to
    // /auth/facebook/callback?error=access_denied
    // This configurable route handler defines how you want to respond to
    // that.
    // If you do not configure this, everyauth renders a default fallback
    // view notifying the user that their authentication failed and why.
  //})
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
    return auth.findOrCreate("google", this.Promise(), session, accessToken, accessTokenExtra, googleUserMetadata);
  })
  .redirectPath('/redirect');

// PASSWORD LOGIN
everyauth.password
  .loginWith('email')
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView('../lib/auth/views/login.jade')
  .authenticate( function (login, password) {
    // Either, we return a user or an array of errors if doing sync auth.
    // Or, we return a Promise that can fulfill to promise.fulfill(user) or promise.fulfill(errors)
    // `errors` is an array of error message strings
    //
    // e.g., 
    // Example 1 - Sync Example
    // if (usersByLogin[login] && usersByLogin[login].password === password) {
    //   return usersByLogin[login];
    // } else {
    //   return ['Login failed'];
    // }
    //
    // Example 2 - Async Example
    // var promise = this.Promise()
    // YourUserModel.find({ login: login}, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // }
    // return promise;
    var promise
    , errors = [];
    if (!login) errors.push('Missing login.');
    if (!password) errors.push('Missing password.');
    if (errors.length) return errors;

    promise = this.Promise();
    Account.authenticate(login, password, function (err, account) {
      if (err) {
        errors.push(err.message || err);
        return promise.fulfill(errors);
      }
      if (!account) {
        errors.push('Failed login.');
        return promise.fulfill(errors);
      }
      promise.fulfill(account);
    });
    return promise;
  })
  .loginSuccessRedirect('/redirect') // Where to redirect to after a login

    // If login fails, we render the errors via the login view template,
    // so just make sure your loginView() template incorporates an `errors` local.
    // See './example/views/login.jade'

  .getRegisterPath('/register') // Uri path to the registration page
  .postRegisterPath('/register') // The Uri path that your registration form POSTs to
  .registerView('../lib/auth/views/register.jade')
  .validateRegistration( function (newAccountAttributes) {
    // Validate the registration input
    // Return undefined, null, or [] if validation succeeds
    // Return an array of error messages (or Promise promising this array)
    // if validation fails
    //
    // e.g., assuming you define validate with the following signature
    // var errors = validate(login, password, extraParams);
    // return errors;
    //
    // The `errors` you return show up as an `errors` local in your jade template    
    var promise = this.Promise()
    , account = new Account(newAccountAttributes)
    , errors = [];
    account.validate( function (err) {
      if (err) {
        errors.push(err.message || err);
      }
      if (errors.length)
        return promise.fulfill(errors);
      promise.fulfill(null);
    });
    return promise;
  })
  .registerUser( function (newAccountAttributes) {
    // This step is only executed if we pass the validateRegistration step without
    // any errors.
    //
    // Returns a user (or a Promise that promises a user) after adding it to
    // some user store.
    //
    // As an edge case, sometimes your database may make you aware of violation
    // of the unique login index, so if this error is sent back in an async
    // callback, then you can just return that error as a single element array
    // containing just that error message, and everyauth will automatically handle
    // that as a failed registration. Again, you will have access to this error via
    // the `errors` local in your register view jade template.
    // e.g.,
    // var promise = this.Promise();
    // User.create(newUserAttributes, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // });
    // return promise;
    //
    // Note: Index and db-driven validations are the only validations that occur 
    // here; all other validations occur in the `validateRegistration` step documented above.
    winston.info("Creating account", newAccountAttributes)
    var promise = this.Promise();
    Account.create(newAccountAttributes, function (err, createdAccount) {
      if (err) {
        console.log(err); // TODO Make depend on debug flag
        if (/duplicate key/.test(err)) {
          return promise.fulfill(['Someone already has claimed that login.']);
        }
        return promise.fail(err);
      }
      promise.fulfill(createdAccount);
    });
    return promise;
  })
  .registerSuccessRedirect('/redirect'); // Where to redirect to after a successful registration