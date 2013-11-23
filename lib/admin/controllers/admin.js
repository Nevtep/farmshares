var geolocation = require("geolocation");

/**
 * Admin Routes
 */

exports.dashboard = function(req, res) {
  res.render("dashboard");
}

exports.farms_add = function(req, res) {
  res.render("farms_add");
}

exports.farms_edit = function(req, res) {
  var fname = req.params.fname;
  if(!fname || fname === "" || fname === undefined) {
    res.redirect('/admin');
  }

  res.render("farms_edit", { farm : fname });
}

exports.farms_edit_process = function(req, res) {
  var AccountModel = require('auth').models.Account;
  var FarmModel = require('farms').models.Farm;
  var ShareModel = require('farms').models.Share;
  var SubscriptionModel = require('farms').models.Subscription;
  var SKUModel = require('farms').models.SKU;
  
  // get the vars in a handy fashion
  var farm = req.body;
  var farmer = farm.farmer;

  //winston.info("About to update this data:", farm);

  FarmModel.findById(
    farm._id
  , function(err, oldFarm) {
    if(err) {
      throw new Error(err);
    }
    
    AccountModel.findOne({
      email : farmer.email
    }, function(err, oldFarmer) {
      if(err) {
        throw new Error(err);
      }

      //data might be corrupt
      // can't find account
      if(!oldFarmer) {
        // create one with the email and name
        winston.warn("Creating account.");
        oldFarmer = new AccountModel();

        oldFarmer.name = {
            first: farmer.name.first,
            middle: farmer.name.middle,
            last: farmer.name.last
        };
        oldFarmer.email = farmer.email;
        // if the account is not a farmer
        if(oldFarmer.isnt("Farmer")) {
          winston.warn("Account ain't a farmer.");
          oldFarmer.addRole("Farmer")
        }

        oldFarm.farmer = oldFarmer;
      }

      if(oldFarmer.name.first !== farmer.name.first) {
        winston.info("Changing farmer first name from " + oldFarmer.name.first + " to ", farmer.name.first);
        oldFarmer.name.first = farmer.name.first;
      }

      if (oldFarmer.name.middle !== farmer.name.middle) {
          winston.info("Changing farmer middle name from " + oldFarmer.name.middle + " to ", farmer.name.middle);
          oldFarmer.name.middle = farmer.name.middle;
      }

      if (oldFarmer.name.last !== farmer.name.last) {
          winston.info("Changing farmer last name from " + oldFarmer.name.last + " to ", farmer.name.last);
          oldFarmer.name.last = farmer.name.last;
      }

      if(oldFarmer.email !== farmer.email) {
        winston.info("Changing farmer email from " + oldFarmer.email + " to ", farmer.email);
        oldFarmer.email = farmer.email;
      }

      if(oldFarm.name !== farm.name) {
        winston.info("Changing farm name from " + oldFarm.name + " to ", farm.name);
        oldFarm.name = farm.name;
      }

      if(oldFarm.location !== farm.location) {
        winston.info("Changing farm location from " + oldFarm.location + " to ", farm.location);
        oldFarm.location = {
            geometry: farm.location.geometry,
            str: farm.location.str,
            country: {
                name: farm.location.country.name,
                shortname: farm.location.country.shortname
            },
            state: {
                name: farm.location.state.name,
                shortname: farm.location.state.shortname
            },
            city: {
                name: farm.location.city.name,
                shortname: farm.location.city.shortname,
                zip: farm.location.city.zip
            },
            address: {
                street: {
                    main: {
                        name: farm.location.address.street.main.name,
                        number: farm.location.address.street.main.number
                    }
                }
            },
          telephone: {
            country_code:farm.location.telephone.country_code,
            local_code:farm.location.telephone.local_code,
            number:farm.location.telephone.number
          }
        };

        if (oldFarm.location.geometry == [0, 0]) {
            winston.warn("About to geolocate...");
            geolocation.getLatLongFromString(farm.location.str, function (geometry) {
                oldFarm.location.geometry = geometry;

            });
        }
        oldFarm.markModified('location');
      }

      if(oldFarm.video !== farm.video) {
        winston.info("Changing farm video from " + oldFarm.video + " to ", farm.video);
        oldFarm.video = farm.video;
        oldFarm.markModified('video')
      }

      if(oldFarm.disabled != farm.disabled) {
        winston.info("Changing farm disabled from " + oldFarm.disabled + " to ", farm.disabled);
        oldFarm.disabled = (farm.disabled === "false") ? false : true;
      }

      if(oldFarm.description !== farm.description) {
        winston.info("Changing farm description from " + oldFarm.description + " to ", farm.description);
        oldFarm.description = {
            en: farm.description.en,
            es: farm.description.es
        };
        oldFarm.markModified('description')
      }

      if(oldFarm.meta !== farm.meta) {
        winston.info("Changing farm meta from " + oldFarm.meta + " to ", farm.meta);
        oldFarm.meta = farm.meta;
        oldFarm.markModified('meta')
      }

      if(oldFarm.output !== farm.output) {
        winston.info("Changing farm output from " + oldFarm.output + " to ", farm.output);
        oldFarm.output = farm.output;
        oldFarm.markModified('output')
      }

      if(oldFarm.age !== farm.age) {
        winston.info("Changing farm age from " + oldFarm.age + " to ", farm.age);
        oldFarm.age = farm.age;
        oldFarm.markModified('age')
      }      
      
      if(oldFarm.gallery !== farm.gallery) {
        winston.info("Changing farm gallery from " + oldFarm.gallery + " to ", farm.gallery);
        oldFarm.gallery = farm.gallery;
        oldFarm.markModified('gallery')
      }

      // This recursive function edits all the skus one by one
      // simulating synchronicity
      
      function editSKUs(callback) {
          function editShares(err) {
              function editSubscriptions(err) {
                  if (err) {
                      winston.error(err);
                  }

                  if (!share.subscriptions || !share.subscriptions.length) {
                      return;
                  }

                
                  var subscription = share.subscriptions.shift();
                winston.info("Subscription id:", subscription._id)
                  var oldSubscription = oldShare.subscriptions.id(subscription._id) || new SubscriptionModel();
                  if (subscription._destroy) {
                      if(!oldSubscription.isNew)
                        oldSubscription.remove();
                      editSubscriptions()
                  }                  
                  oldSubscription.name = subscription.name;
                  oldSubscription.markModified("name");
                  oldSubscription.deliveries = subscription.deliveries;
                  oldSubscription.markModified("deliveries");
                  oldSubscription.discount = subscription.discount;
                  oldSubscription.markModified("discount");
                  oldSubscription.timespan = subscription.timespan;
                  oldSubscription.markModified("timespan");

                  if (oldSubscription.isNew) {
                      winston.info("Pushing Subscription \"" + oldSubscription.name + "\"");
                      oldShare.subscriptions.push(oldSubscription);
                  }
                  editSubscriptions();
              }
          if(err) {
            winston.error(err);
          }

          if(!sku.shares || !sku.shares.length) {
            return;
          }

          var share = sku.shares.shift();
          var oldShare = oldSKU.shares.id(share._id) || new ShareModel();
          if (share._destroy) {
              if(!oldShare.isNew)
                oldShare.remove();
              editShares()
          }
                    
          oldShare.name = share.name;
          oldShare.markModified("name");
          oldShare.price = share.price;
          oldShare.markModified("price");
          oldShare.amount = share.amount;
          oldShare.markModified("amount");
          oldShare.currency = share.currency;
          oldShare.markModified("currency");
          
          editSubscriptions();
          oldShare.markModified("subscriptions");

          if(oldShare.isNew) {
            winston.info("Pushing Share \"" + oldShare.name + "\"");
            oldSKU.shares.push(oldShare);            
          }
          editShares();
        }

          if(!farm.skus || !farm.skus.length) {
            callback();
          } else {

          var sku = farm.skus.shift();
          var oldSKU = null;
          SKUModel.findById( sku._id, function(err, existingSKU){
            

        if(err) {
            winston.error(err);
          }
            oldSKU = existingSKU || new SKUModel();
          if (sku._destroy) {
              if(!oldSKU.isNew)
                oldSKU.remove();
            editSKUs(callback);
          } else {
          oldSKU.farm = oldFarm._id;
          oldSKU.markModified("farm")
          oldSKU.type = sku.type;
          oldSKU.markModified("type")
          oldSKU.name = sku.name;
          oldSKU.markModified("name")
          oldSKU.title = sku.title;
          oldSKU.markModified("title")
          oldSKU.description = sku.description;
          oldSKU.markModified("description")
          oldSKU.batch_size = sku.batch_size;
          oldSKU.markModified("batch_size")          
          oldSKU.unit = sku.unit;
          oldSKU.markModified("unit");
          editShares();          
          oldSKU.markModified("shares")
          
          oldSKU.save(function(err){
            editSKUs(callback);
          });         
          }
          })
          }
      }
      // Save the farm
      oldFarm.save(function(err) {
        if(err) {
          winston.error("Holy crap!", err);
        } else {
          
          editSKUs(function(err){
            // Save the farmer
            oldFarmer.save(function(err) {
              if(err) {
                winston.error("Holy crap!", err);
                res.json({
                  status : false,
                  error : err
                });
              } else {
                winston.info("Farm edited succesfully, redirecting to listings page");
                res.json({
                  status : true,
                  farm : oldFarm
                });
              }
            });
          });
          
        }
      });
    });
  });
}

exports.farms_process = function(req, res) {
  winston.info("Processing Farm", req.body)
  var AccountModel = require('auth').models.Account;
  var FarmModel = require('farms').models.Farm;
  var SKUModel = require('farms').models.SKU;

  // get the vars in a handy fashion
  var farm = req.body;
  var farmer = farm.farmer;

  var errors = {};

  AccountModel.findOne({
    email : farmer.email
  }, function(err, account) {
    // can't find account
    if(!account) {
      // create one with the email and name
        account = new AccountModel();
        winston.warn("Creating account.");
      
        account.name = {
            first: farmer.name.first,
            middle: farmer.name.middle,
            last: farmer.name.last
        };
      account.email = farmer.email;
    }    
    winston.warn("Creating farm.");
    // Create the farm
    var newFarm = new FarmModel();    
    newFarm.name = farm.name;
    newFarm.farmer = account._id;
    winston.info("added farmer",account._id);
    newFarm.location = {        
        geometry: farm.location.geometry,
        str: farm.location.str,
        country: {
            name: farm.location.country.name,
            shortname: farm.location.country.shortname
        },
        state: {
            name: farm.location.state.name,
            shortname: farm.location.state.shortname
        },
        city: {
            name: farm.location.city.name,
            shortname: farm.location.city.shortname,
            zip: farm.location.city.zip
        },
        address: {
            street: {
                main: {
                    name: farm.location.address.street.main.name,
                    number: farm.location.address.street.main.number
                }
            }
        },
      telephone: {
            country_code:farm.location.telephone.country_code,
            local_code:farm.location.telephone.local_code,
            number:farm.location.telephone.number
          }
    };
    winston.info("Added location", newFarm.location);
    if (newFarm.location.geometry == [0, 0]) {
      winston.warn("About to geolocate...");
      geolocation.getLatLongFromString(farm.location.str, function(geometry) {
        newFarm.location.geometry = geometry;
        
      });
    }
    winston.info("updated geometry", newFarm.location.geometry);
    newFarm.markModified('location');
    newFarm.video = farm.video;
    newFarm.markModified('video');
    newFarm.disabled = farm.disabled;
    newFarm.markModified('disabled');
    newFarm.description = {
        en: farm.description.en,
        es: farm.description.es
    };
    newFarm.markModified('description');
    newFarm.meta = farm.meta;
    newFarm.markModified('meta');
    newFarm.output = farm.output;
    newFarm.markModified('output');
    newFarm.age = farm.age;
    newFarm.markModified('age');
    winston.info("Filled newFarm",newFarm);
    // This recursive function adds all the skus one by one
    // simulating synchronicity
    function addSkus (callback) {
      if(!farm.skus || !farm.skus.length)
        callback()
      
      var sku = farm.skus.shift();
      if(sku._destroy)
        addSkus(callback);
      else {
        
      var newSKU = new SKUModel();
      newSKU._id = sku._id;
      newSKU.farm = newFarm._id;
      newSKU.type = sku.type;
      newSKU.name = sku.name;
      newSKU.title = sku.title;
      newSKU.description = sku.description;
      newSKU.batch_size = sku.batch_size;
      newSKU.unit = sku.unit;
      newSKU.shares = sku.shares;
      
      newSKU.save(function(err){
        
      if(err)
        winston.error(err);
      addSkus(callback);
      });
      }
    }
      
    winston.warn("About to save!");
    // Actually save the farm
    newFarm.save(function(err) {
      if(err) {
        winston.error(err);
        res.json(err, 500);
      } else {
        winston.info("Adding SKUs");
        // Trigger the sku creation
        addSkus(function(){
          winston.info("Pushing Farm " + newFarm.name + " (Id: " + newFarm._id + ")");
        // Push the farm id into the farmer
        // account.roles.farmer.farms.push(newFarm._id);
        // Mark it modified
        // account.markModified('roles.farmer.farms');
        // Save the farmer
        winston.warn("About to save the farmer");
        account.save(function(err, saved) {
          if(err) {
            winston.error("Holy crap!", err);
            res.json({
              status : false,
              error : err
            });
          } else {
            // if the account is not a farmer
            if(saved.isnt("Farmer")) {
              winston.warn("Account ain't a farmer.");
              saved.addRole("Farmer")
            }
            winston.info("Farm processed succesfully, redirecting to listings page");
            res.json({
              status : true,
              farm : newFarm,
              farmer : saved
            });
          }
        });
        });
        
      }
    });
  });
}

exports.farms_list = function(req, res) {
	var FarmModel = require('farms').models.Farm;
	var AccountModel = require('auth').models.Account;

  var query = FarmModel.find().sort('name');
	//.populate('farmer', 'name email', 'Account');
	query.exec(function(err, farms) {
		if(err) {
			throw new Error(err);
		}
		res.render("farms_list", {
			farms : farms
		});
	});
}

exports.farms_wholesales = function(req, res) {
  var fid = req.params.fid;
  if (!fid || fid === "" || fid === undefined) {
    res.redirect('/admin');
  }

  res.render("farms_wholesales", {  farmId: fid });
}

exports.users_list = function(req, res) {
	var AccountModel = require('auth').models.Account;

  var query = AccountModel.find().sort('name.first name.last');

	query.exec(function(err, accounts) {
		if(err) {
			throw new Error(err);
		}
		res.render("users_list", {
			accounts : accounts
		});
	});
}

exports.users_shareholdings = function (req, res) {
    var accountId = req.params.accountId;
    if (!accountId || accountId === "" || accountId === undefined) {
        res.redirect('/admin');
    }

    res.render("users_shareholdings", {accountId: accountId });
}

exports.users_deliveryplan = function (req, res) {
    var accountId = req.params.accountId;
    if (!accountId || accountId === "" || accountId === undefined) {
        res.redirect('/admin');
    }

    res.render("users_deliveryplan", { accountId: accountId });
}

exports.users_deliveryschedule = function (req, res) {
    var accountId = req.params.accountId;
    if (!accountId || accountId === "" || accountId === undefined) {
        res.redirect('/admin');
    }

    res.render("users_deliveryschedule", { accountId: accountId });
}

exports.users_edit = function(req, res) {

  function contains(a, obj) {
      var i = a.length;
      while (i--) {
         if (a[i] === obj) {
             return true;
         }
      }
      return false;
  }

	var id = req.params.id;
	if(!id || id === "" || id === undefined) {
		res.redirect('/admin');
	}
	var AccountModel = require('auth').models.Account;

	AccountModel.findById(
	id
	,function(err, account) {
		if(err) {
			throw new Error(err);
		} else {
      winston.info("Editing Account Roles",account.roles);
      var admin = contains(account.roles, 'admin');
      var farmer = contains(account.roles, 'farmer');
      var courier = contains(account.roles, 'courier');
      var customer = contains(account.roles, 'customer');
      var storemanager = contains(account.roles, 'storemanager');

			res.render("users_edit", {
				account : account,
        admin : admin,
        farmer : farmer,
        courier : courier,
        customer : customer,
        storemanager : storemanager
			});
		}
	});
}


exports.users_edit_process = function (req, res) {
    var AccountModel = require('auth').models.Account;

    // get the vars
    var roles = [];
    if(req.body.admin == "on") roles.push('admin');
    if(req.body.farmer == "on") roles.push('farmer');
    if(req.body.courier == "on") roles.push('courier');
    if(req.body.customer == "on") roles.push('customer');
    if(req.body.storemanager == "on") roles.push('storemanager');


  winston.info("About to update this data:", roles, "On account ID:",req.body.id);
    AccountModel.findById(
      req.body.id,
      function (err, account) {
        if (err) {
            throw new Error(err);
        }
        account.roles = roles;
        //Save the role
        account.save(function (err) {
          if (err) {
            winston.error("Holy crap!", err);
            throw new Error(err);
          } else {
            winston.info("Account edited succesfully, redirecting to listings page");
            res.redirect('/admin/users/list/');
          }
        });
    });    

}
