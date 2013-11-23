var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var MailSchema = exports.schema = new mongoose.Schema({
    templateName: String,
    templateData: Types.Mixed,
    mailOptions: Types.Mixed
});

var plugins = require("schema-plugins");
MailSchema.plugin(plugins.addStatus, ["queued", "failed", "sent"]);

