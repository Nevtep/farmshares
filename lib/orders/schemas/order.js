var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var plugins = require("schema-plugins");
var PaymentSchema = require("./payment").schema;
var CartItemSchema = require("./cartitem").schema;

var OrderSchema = exports.schema = new mongoose.Schema({
    customer:{
        type: Types.ObjectId,
        ref:'Account'
    },
    cartitems:[CartItemSchema],
    payments: [PaymentSchema]
});
OrderSchema.plugin(plugins.addStatus, ["placed", "processing", "finished", "canceled"]);