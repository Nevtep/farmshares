var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types
  
var ShareSchema = require("./share").schema;

var SKUSchema = exports.schema = new mongoose.Schema({
    farm: {
        type: Types.ObjectId,
        ref: 'Farm'
    },
    type: {
        type:String,
        enum: ["Eggs","Sweet","Poultry","Pork","Beef","Cheese","Fruit","Veggie","Meal","Dairy"],
        default:""
    },
    
    unit: { 
        type: String,
        default:""
    },
    name:{
      type:String,
      default:""
    },
    title:{
      type:String,
      default:""
    },
    description:{
      type:String,
      default:""
    },
    batch_size:{
      type:Number,
      default:0
    },
  shares:[ShareSchema]
});
