exports.home = function (req, res) {
  winston.info("User:", req.user);
    res.render("home", {
        account: req.currentUser
    })
}

exports.subscribe = function (req, res) {
    winston.info("Subscribing", req.body.email);
    if (!req.body.email || req.body.email === "") {
        res.redirect('/', 301);
    }

    var MailChimpAPI = require('mailchimp').MailChimpAPI;
    var MailChimpKey = "88ba60e1bc65e47c636721f12fe98b8c-us5";

    try {
        var mc = new MailChimpAPI(MailChimpKey, {
            version: '1.3',
            secure: false
        });
    } catch (error) {
        winston.error("MailChimp", error.message);
    }

    mc.listSubscribe({
        id: "17e9d773a4",
        email_address: req.body.email
    }, function () {
        res.redirect('/', 301);
    });
};
