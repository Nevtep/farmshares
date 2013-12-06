exports.Mailer = require("./controllers/mailer");
exports.models = require("./models");

exports.queueEmail = function (mailOptions, templateName, templateData) {
    var MailModel = require("mailing").models.Mail;

    var email = new MailModel();

    email.status.push({name:"queued", timestamp:new Date()});
    email.templateName = templateName;
    email.templateData = templateData;
    email.mailOptions = mailOptions;

    winston.info("Sending Mail");
    email.save(function (err) {
        if(err) throw new Error(err);
        // replace by daemon task
        var mailer = exports.Mailer;
        mailer.sendEmails();
    });
};
