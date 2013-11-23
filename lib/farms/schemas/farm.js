var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types

var OrderSchema = require("orders").schemas.Order;
var SKUSchema = require("./sku").schema;

// The Farm Schema
var FarmSchema = exports.schema = new mongoose.Schema({
  name: { 
      type: String,
      default:""
  },
  disabled: {
    type: Boolean,
    default: true
  },
  slug: {
    type: String,
    unique: true,
    default: ""
  },
  farmer: {
    type: Types.ObjectId,
    rel: "Account"
  },
  video: { 
      type: String,
      default:""
  },
  production: [{
    name: { 
      type: String,
      default:""
  },
    category: { 
      type: String,
      default:""
  },
    technique: { 
      type: String,
      default:""
  }
  }],
  logo: { 
      type: String,
      default:""
  },
  gallery: {
    type: [String],
    default: []
  },
  meta: { 
      type: String,
      default:""
  },
  description: {
    en:{ 
      type: String,
      default:""
  },
  es:{ 
      type: String,
      default:""
  }
  },
  age: { 
      type: String,
      default:""
  },
  output: { 
      type: String,
      default:""
  },
  skus:{
    type: [SKUSchema],
    default:[]
  }
});

FarmSchema.pre('save', function (next) {
  function slugify (value) {
    return value.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  this.slug = slugify(this.name);
  next();
});

var plugins = require("schema-plugins");

FarmSchema.plugin(plugins.addAddress, ["location"]);
//FarmSchema.plugin(plugins.addPhoto, {multiple: true});