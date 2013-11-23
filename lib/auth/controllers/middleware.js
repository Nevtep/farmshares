isRole = function (req, res, next, role) {
  if(!req.user) {
    winston.error("This session doesn't have a registered user.");
  }
  
  if(!req.user || req.user.isnt(role)) {
    winston.error("Trying to access " + role + " area without enough privileges, redirecting to login.");
    winston.info("Taking current url as redirect path.", req.originalUrl);
    req.session.nextUrl = req.originalUrl;
    req.session.save();
    return res.redirect('/login');
  }
  
  winston.info("Hello " + role + "!");
  next();
}

exports.isAdmin = function (req, res, next) {
  return isRole(req, res, next, 'admin');
}

exports.isFarmer = function (req, res, next) {
  return isRole(req, res, next, 'farmer');
}

exports.isCourier = function (req, res, next) {
  return isRole(req, res, next, 'courier');
}

exports.isCustomer = function (req, res, next) {
  return isRole(req, res, next, 'customer');
}

exports.isStoremanager = function (req, res, next) {
  return isRole(req, res, next, 'storemanager');
}

// Login redirect middleware
exports.redirect = function (req, res, next) {
  if (req.session.nextUrl) {
    winston.info("Redirecting user to", req.session.nextUrl);
    var redirect_to = req.session.nextUrl;
    delete req.session.nextUrl;
    return res.redirect(redirect_to, 301);
  } 
  
  winston.info("No nextUrl attribute to session, proceeding regularly.")
  return res.redirect('/', 301);
}
