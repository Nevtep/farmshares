/**
 * Customer Routes
 */

exports.dashboard = function(req, res) {
	res.render("dashboard");
}

exports.info = function(req, res) {
	res.render("partials/info");
}

exports.update = function(req, res) {
	var customer = req.body;
  // validate editing customer
  if(req.user._id != customer._id)
    throw new Error("Trying to edit account without permissions");
  
  req.user.email = customer.email;
  req.user.name = customer.name;
  
  req.user.billing_address = customer.billing_address;
  req.user.shipping_address = customer.shipping_address;
  req.user.save(function(err, savedAccount) {
    if (err) throw new Error(err)
    res.json(savedAccount);
  });    
     
}