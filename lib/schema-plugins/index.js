var mongoose = require('mongoose')
  , Types = mongoose.Schema.Types; 

var Name = exports.addName = function (schema, options) {
  // add schema attributes
  schema.add({
    name: {

      first: {
        type: String,
        min: 1,
        max: 40,
        default: ""
      },

      last: {
        type: String,
        min: 1,
        max: 40,
        default: ""
      },

      middle: {
        type: String,
        default: "",
        min: 0
      }
    }
  });

  // add virtual accessors candy
  schema.virtual('name.full').get( function () {
    //concatenate the first middle (if exists) and last name to get the full name
    return this.name.first +
          ((this.name.middle!=="") ? " "+this.name.middle+".":"") +
          ((this.name.last!=="")? " "+this.name.last:"");
  });

  schema.virtual('name.full').set( function (name) {
    // handle the case of setting to null
    if (name === "") {
      this.name.first = this.name.last = this.name.middle = "";
      return;
    }
    // get the full name from a string and split it
    // this should support also having Last name, first name Initial(.)
    // in the case the order was reversed and the separator was a comma
    // but for the majority of the cases this will do just fine
    var split = name.split(" ");
    // first one should always be the first name
    this.name.first = split[0];
    // if there is more than just two elements
    if (split.length > 2) {
      // then the second element is the middle name
      this.name.middle = split[1].split(".")[0] //get rid of the dot if it is there
      // and the last one is the last name
      this.name.last = split[2];
    } else {
      // else, the last one is the last name
      this.name.last = split[1];
    }
  });

  // // add validation rules
  // schema.path("name.first").validate( function (value) {
  //   // check for length and definition
  //   return (value === undefined || value.length === 0) ? false : true;
  // }, "First name can't be blank");

  // schema.path("name.last").validate( function (value) {
  //   // check for length and definition
  //   return (value === undefined || value.length === 0) ? false : true;
  // }, "Last name can't be blank");
}

var Email = exports.addEmail = function (schema, options) {
  var regex = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i;

  // add schema attributes
  schema.add({
    email: [{
      type: String,
      lowercase: true,
      trim: true,
      min:3,
      max: 250,
      default: ""
      // validate: [{validator: regex, msg: "Invalid email"}]
    }]
  });

  // add sugar coating
  schema.virtual("email.main").set( function (value) {
    this.email[0] = value;
  });

  // add validation
  schema.path("email").validate( function (value) {
    console.log("Validation happening!");
    return (regex.test(value)) ? true : false;
  }, "Invalid email");
}

var BillingInfo = exports.addBillingInfo = function (schema, options) {
  // add schema attributes
  schema.add({
    billing: {
      name: {
        type: String,
        default: ""},
      address: {
        type: String,
        default: ""},
      cc_last_4_digits: {
        type: Number,
        min: 1000,
        max: 9999,
        default: 1000
      }
    }
  });
}

var DisbursementInfo = exports.addDisbursementInfo = function (schema, options) {
  // add schema attributes
  schema.add({
    bank: {
      account: {
        type: Number,
        default: 0
        },
      routing: {
        type: Number,
        default: 0
        },
      name: {
        type: String,
        default: ""
        },
      address: {
        type: String,
        default: ""
        },
      bank: {
        name: {
        type: String,
        default: ""
        },
        branch_address: {
        type: String,
        default: ""
        }
      },
      swift: {
        type: String,
        default: ""
        },
      intermediary: {
        account: {
        type: Number,
        default: 0
        },
        routing: {
        type: Number,
        default: 0},
        name: {
        type: String,
        default: ""
        },
        address: {
        type: String,
        default: ""
        }
      }
    },
    online: {
      provider: {
        type: String,
        default: ""},
      id: {
        type: String,
        default: ""}
    }
  });
}

var Telephone = exports.addTelephone = function (schema, options) {
  // add schema attributes
  schema.add({
    telephone: [{
      country_code: {
        type: Number,
        min: 1,
        max: 256,
        default:1
      },
      local_code: {
        type: Number,
        min: 1,
        max: 9999,
        default:1
      },
      number: {
        type: Number,
        default: 1
      },
      type: {
        type: String,
        default: ""
        }
    }]
  });  
}

var Address = exports.addAddress = function (schema, options) {
  // add schema attributes
  var addresses = {};
  for(var i = 0; i< options.length; i++) {
    addresses[options[i]] = {
      // MongoDB Geospatial Queries support
      geometry: {
        type: [Number],
        index: '2d',
        default: [0,0]
      },
      str: {
        type: String,
        default: "No location"
      },
      country: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        }
      },
      state: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        }
      },
      city: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        },
        zip: {
          type: Number,
          default: 0
        }
      },
      address: {
        street: {
          main: {
            name: {
              type: String,
              min: 10,
              max: 150,
              default:""
            },
            number: {
              type:Number,
              default:0
            }
          },
          secondary: {
            name: {
              type: String,
              min: 10,
              max: 150,
              default:""
            },
            number: {
              type:Number,
              default:0
            }
          }
        },
        apt: {
          type: String,
          default: "None"
        }
      },
      telephone: {
          country_code: {
            type: Number,
            default:1
          },
          local_code: {
            type: Number,
            default:1
          },
          number: {
            type: Number,
            default: 1
          },
          type: {
            type: String,
            default: ""
            }
        }
    };
  };
  schema.add(
    addresses
  );
}

var Location = exports.addLocation = function (schema, options) {
  // add schema attributesz
  schema.add({
    location: {
      // MongoDB Geospatial Queries support
      geometry: {
        type: [Number],
        index: '2d',
        default: [0,0]
      },
      str: {
        type: String,
        default: "No location"
      },
      country: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        }
      },
      state: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        }
      },
      city: {
        name: {
          type: String,
          trim: true,
          min: 3,
          max: 50,
          default:""
        },
        shortname: {
          type: String,
          trim: true,
          min: 2,
          max: 3,
          default:""
        },
        zip: {
          type: Number,
          default: 0
        }
      },
      address: {
        street: {
          main: {
            name: {
              type: String,
              min: 10,
              max: 150,
          default:""
            },
            number: {
              type:Number,
              default:0
            }
          },
          secondary: {
            name: {
              type: String,
              min: 10,
              max: 150,
          default:""
            },
            number: {
              type:Number,
              default:0
            }
          }
        },
        apt: {
          type: String,
          default: "None"
        }
      }
    }
  });
};

var Photo = exports.addPhoto = function (schema, options) {
  // add schema attributes
  var photo_schema = {
      title: {
        type: String,
        default: ""
        },
      url: {
        type: String,
        default: ""
        },
      size: {
            type: Number,
            default: 0
            },
      dimensions: {
        w: {
            type: Number,
            default: 0
            },
        h: {
            type: Number,
            default: 0
            }
      },
      thumbnail:[{
        size: {
            type: Number,
            default: 0
            },
        dimensions: {
          w: {
            type: Number,
            default: 0
            },
          h: {
            type: Number,
            default: 0
            }
        }
      }]
    };

  if (options.multiple && options.multiple === true) {
    schema.add({ photo: [photo_schema] });
  } else {
    schema.add({ photo: photo_schema})
  }

  // add virtual candy accessors
  schema.virtual("thumbnail.url").get( function (){
    return this.photo.url+this.photo.thumbnail.w+"x"+this.photo.thumbnail.h;
  });
}

var Timeframe = exports.addTimeframe = function (schema, options) {
  // add schema attributes
  schema.add({
    timeframe: {
      begin: Date,
      end: Date
    }
  });
}

var Tag = exports.addTag = function (schema, options) {
  // add schema attributes
  schema.add({
    tag: {
      type: String,
      enum: options,
      default: ""
    }
  });
}

var Status = exports.addStatus = function (schema, options) {
  // add schema attributes
  schema.add({
    status: [{
      name: {
        type: String,
        enum: options,
        default:""
      },
      timestamp: {
        type: Date,
      }
    }]
  });

  // add virtual accessors
  schema.virtual("status.current").get( function () {
    return this.status[this.status.length-1];
  });

  schema.virtual("status.last").get( function () {
    return this.status[this.status.length-2];
  });

  schema.virtual("status.first").get( function () {
    return this.status[0];
  });
}
