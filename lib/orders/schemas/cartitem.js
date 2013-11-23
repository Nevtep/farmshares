var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var CartItemSchema = exports.schema = new mongoose.Schema({    
    sku: {
        type: Types.ObjectId,
        ref:'SKU'
    },
    share: Types.ObjectId,
    quantity: Number,
    subscription: Types.ObjectId
    
});