var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types
  
var SubscriptionSchema = exports.schema = new mongoose.Schema({
  name:{
    type:String,
    default:""
  },
  deliveries:{
    type:Number,
    default:0
  },
  discount:{
    type:Number,
    default:0
  },
  timespan: {
      type: Number,
      default: 0
  }
});