// Mailer class the supports a mail queue
var sendTemplate = exports.sendTemplate = function (emailTransport, email, callback) {
    // Set the template path
    var templatePath = __dirname + "/../views/" + email.templateName + ".jade";

    var fs = require('fs');
    fs.readFile(templatePath, function (err, data) {
        if (err) {
            throw new Error(err);
        }
        var jade = require('jade');
        var I18n = require('i18n-2');
        new I18n({
            locales: ['en', 'es'],
            'register': email.templateData
        });

        var template = jade.compile(data, {
            filename: templatePath
        });
        winston.info("Template Data", email.templateData);
        // setup e-mail data with unicode symbols
        email.mailOptions.generateTextFromHTML = true;
        email.mailOptions.html = template(email.templateData);
        
        // send email
        emailTransport.sendMail(email.mailOptions, function (error, response) {
            if (error) {
                winston.error(error);
                email.status.push({ name: "failed", timestamp: new Date() });                
            } else {
                winston.info("Message sent: " + response.message);
                email.status.push({ name: "sent", timestamp: new Date() });             
            }            

            email.save(function (err) {
                if (err) winston.error(err);
                else callback();
            });
        });
    });
};

exports.sendEmails = function () {
    MailModel = require("mailing").models.Mail;

    MailModel.find({
        "$and": [
            {
                "status.name": "queued"
            },
            {
                "status.name": {
                    "$ne": "sent"
                }
            }
        ]
    }, function (err, emails) {
        winston.info("queued emails:", emails.length);
        if (err) winston.error(err);
        if (emails.length > 0) {
            var _ = require("underscore");
            // Send the emails
            var nodemailer = require("nodemailer");

            // create reusable transport method (opens pool of SMTP connections)
            var email_transport = nodemailer.createTransport("SMTP", {
                service: "Gmail",
                auth: {
                    user: process.env.SUPPORT_EMAIL,
                    pass: process.env.SUPPORT_PASS
                }
            });

            var processed = 0;
            var mailProcessed = function () {
                ++processed;
                // shut down the connection pool, no more messages
                if (processed === emails.length)
                    email_transport.close();
            }
            _.each(emails, function (email) {                
                    sendTemplate(email_transport, email, mailProcessed);                    
            });
        }
    });
};
