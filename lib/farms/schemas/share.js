var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var SubscriptionSchema = require("./subscription").schema;

var ShareSchema = exports.schema = new mongoose.Schema({
   name: {
    type:String,
    default:""
  },
  price: {
    type: Number,
    min: 0,
    default:0
  },
  currency: {
    type: String,
    min: '3',
    max: '3',
    default: 'USD'
  },
  amount: { 
      type: String,
      default:""
  },
  gallery: {
    type: [String],
    default: []
  },
  photo:{
    type : String,
    default : ""
  },
  subscriptions: {
    type: [SubscriptionSchema],
    default: []
  }
});
