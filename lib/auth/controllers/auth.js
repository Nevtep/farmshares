exports.login = function(req, res){
  res.render("login");
};

exports.logout = function (req, res) {
  req.currentUser = null;
  req.logout();
  res.redirect( '/' );
}