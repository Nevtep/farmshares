var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types;

var ProfileSchema = exports.schema = new mongoose.Schema({
  provider: { 
      type: String,
      enum:["facebook","password","google"],
      default:"password"
  },
  metadata: Types.Mixed
});