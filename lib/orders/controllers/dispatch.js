var _ = require("underscore")
    , async = require("async");

// Admin Dashboard
var getDeliveries = exports.getDeliveries = function (conditions, callback) {
  var Delivery = require("orders").models.Delivery;
  var Account = require("auth").models.Account;
  var filters = {};
  
  _.extend(filters,conditions);
  
  Delivery.find(filters,{info:1,orders:1,timeframe:1},null,function(err, deliveries){
    if(err) throw new Error(err);
    Account.populate(deliveries,{path:"info.customer",options:{lean:true},select:{name:1,shipping_address:1,email:1}},function(err, deliveries){
      if(err) throw new Error(err);
      async.map(deliveries,function(delivery,done){
        fillOrders({"_id" : { "$in" : delivery.orders }},function(dispatchOrders){          
          var transformOrders = function(doc, ret, options) {
            ret.orders = dispatchOrders;
          };
          
          done(null,delivery.toObject({ transform : transformOrders}));
        });
      },function(err,dispatchDeliveries){
        if(err) throw new Error(err);
        else callback(_.sortBy(dispatchDeliveries,function(delivery){return delivery.timeframe.begin}));
      });
    });
  });
}

var fillOrders = exports.fillOrders = function (conditions, callback) {
  var Order = require("orders").models.Order;
  var SKU = require("farms").models.SKU;
  var filters = {};
  
  _.extend(filters,conditions);
  
  Order.find(filters,{payments:1,cartitems:1},null,function(err,orders){
    if(err) throw new Error(err);
    async.map(orders,function(order, done){      
      SKU.populate(order.cartitems,{path:"sku",select:{name:1,shares:1}},function(err,cartitems){        
        var products = []
        _.each(cartitems, function(element,index,list){          
          var share = element.sku.shares.id(element.share)          
          products.push({ name : element.sku.name, 
                         amount: share.amount, 
                         type: share.name, 
                         quantity: element.quantity
                        })
        });
        var transformOrder = function(doc, ret, options){          
          delete ret.cartitems;
        };
        
        order =order.toObject({ transform:transformOrder })
        order.products = products;
                
        done(null,order);
      });
    }, function(err, orders){
      if(err) throw new Error(err);
      callback(orders);
    });
  });
}

// Users Dashboard
var getOrderSummary = exports.getOrderSummary =function( order, callback){
  var Farm = require("farms").models.Farm;
  var SKU = require("farms").models.SKU;
  
  var farms = {};
  SKU.populate(order.cartitems,{path:"sku"},function(err,cartitems){
    async.eachSeries(cartitems,function(cartitem,done){
      Farm.populate(cartitem.sku,{path:"farm"},function(err,sku){
        if(err) done(err)
        if(!farms.hasOwnProperty(sku.farm._id)) {
          farms[sku.farm._id] = {
            name: sku.farm.name,
            products:[],
            total:0
          }
        }
        var farm = farms[sku.farm._id];
        var share = sku.shares.id(cartitem.share);
        var subscription = share.subscriptions.id(cartitem.subscription);
        var product={
          photo:share.photo,
          quantity:cartitem.quantity,
          total:cartitem.quantity * share.price,
          description:sku.name,
          amount: share.amount + " " + sku.unit,
          subscription:subscription.name
        };
        farm.products.push(product);
        farm.total += product.total;
        done();
      });
    }, function(err){
      if (err) callback(err);
      else callback(null, _.toArray(farms));
    });
  });
  
}

exports.getShareholdings = function (customer, callback) {
    var Order = require("orders").models.Order;

    // Find orders scheduled or planned for this customer
    Order.find({        
        "$and": [
            {
                "status.name": "placed"
            },
            {
                "status.name": {
                    "$nin": ["finished","cancelled"]
                }
            }
        ],
        'customer': customer._id        
    },
    function (err, orders) {
        if (err) callback(err);

        var processOrders = [];
        var shareholdings = {};
        
      
        _.each(orders, function (order) {                        
            processOrders.push(function (done) { processOrderShareholdings(order, done) });
        });

        async.parallel(processOrders, function (err, results) {
            if (err) callback(err);          
            _.each(results, function (_shareholdings) {
              
                // Add farm data
                _shareholdings.forEach(function(shareholding) {
                  if (shareholdings[shareholding.farm._id] === undefined)
                    shareholdings[shareholding.farm._id] = {
                      farm: shareholding.farm,
                      skus: []
                    };
                  shareholding.skus.forEach(function(sku)   {
                    
                    var existing = _.find(shareholdings[shareholding.farm._id].skus, function(_sku) {                      
                      return _.isEqual(sku.share._id, _sku.share._id) && _.isEqual(sku.subscription._id, _sku.subscription._id) && _.isEqual(sku.delivery, _sku.delivery);
                    });
                    if(existing == undefined)
                      shareholdings[shareholding.farm._id].skus.push(sku);
                    else
                      existing.quantity += sku.quantity;
                    });
                });
            });
            callback(null, _.toArray(shareholdings));
        })
    });
}

var processOrderShareholdings = exports.processOrderShareholdings = function (order, callback) {
  
  //winston.info("Processing shareholdings for:",order);
    // get the next dropoff, first payment, and process CartItems, call the callback with err and results.
    var SKU = require("farms").models.SKU;
    var Farm = require("farms").models.Farm;
var Delivery = require("orders").models.Delivery;

    var now = new Date();
    var shareholdings = {};
  Delivery.find({orders:{"$in":[order._id]}},null,{lean:true},function(err,deliveries){
    var nextDelivery = _.chain(deliveries)
                               .sortBy(function (delivery) { return delivery.timeframe.begin })
                               .find(function (delivery) { return delivery.timeframe.begin > now })
                               .value();
  //winston.info("Next delivery:",nextDelivery)
    // Get the first payment to calculate subscription
    var firstPayment = _.chain(order.payments)
                        .sortBy(function (payment) { return payment.date })
                        .first()
                        .value();
 //winston.info("First payment:",firstPayment);
    // Process the cartitems
    SKU.populate(order.cartitems, { path: 'sku' }, function(err, cartitems) {
        if (err) callback(err);
        async.each(cartitems, function (cartitem, done) {          
            // Get the share and subscription
            var share = cartitem.sku.shares.id(cartitem.share);
            var subscription = share.subscriptions.id(cartitem.subscription);
            // Check if the subcription is still active
            var active = (now.getTime() - firstPayment.date.getTime()) < subscription.timespan;
          //winston.info("Is active:",active)
            if (active) {
                // Populate Farm Data
                Farm.populate(cartitem.sku, { path: 'farm' }, function (err, sku) {
                    if (err) done(err);
                    // Add farm data
                 // winston.info("Farm:",sku.farm._id);
                 // winston.info("Exists:",shareholdings[sku.farm._id]);
                 // winston.info("create:",shareholdings[sku.farm._id] === undefined);
                 // winston.info("Item:",cartitem);
                    if (shareholdings[sku.farm._id] === undefined)
                    {
                      shareholdings[sku.farm._id] = {
                            farm: sku.farm,
                            skus: []
                        };                    
                    }
                  var info = {
                        share: share,
                        subscription: subscription,
                        quantity: cartitem.quantity,
                        delivery: nextDelivery
                    };
                    shareholdings[sku.farm._id].skus.push(info);
                    done();
                });
            } else {
                done();
            }
        }, function (err) {
            if (err) callback(err);
            else callback(null, _.toArray(shareholdings)); // Transform the object to array
        });
    });
  });
};

exports.getDeliveryPlan = function (courier, callback) {
    var Order = require("orders").models.Order;
    var Delivery = require("orders").models.Delivery;
    var now = new Date();
    var end_of_week =  new Date(now.getTime() + ( (6 - now.getDay()) * (1000 * 60 * 60 * 24)))
    end_of_week.setHours(23);
    end_of_week.setMinutes(59);
    end_of_week.setSeconds(59);
    Delivery.find({
        'timeframe.begin': { '$gte': now, '$lt': end_of_week }
    },
    function (err, deliveries) {
        if (err) callback(err);
        var processDeliveries = [];
        var planning = [];
        // Go through each order, group them by client and list corresponding shares.
        _.each(deliveries, function (delivery) {
            processDeliveries.push(function (done) { processDeliveryPlan(delivery, done) });
        });
        
        async.parallel(processDeliveries, function (err, results) {
            if (err) callback(err);
            _.each(results, function (result) {
                planning.push(result);
            });
            callback(null, _.toArray(planning));
        })
    });
};

var processDeliveryPlan = exports.processDeliveryPlan = function (delivery, callback) {
    var SKU = require("farms").models.SKU;  
    var Farm = require("farms").models.Farm;
    var Order = require("orders").models.Order;
    var Account = require("auth").models.Account;
  var now = new Date();  
  var skus={};
    // Populate the customer Data
  Account.populate(delivery, { path: 'info.customer', options: {lean:true} }, function (err, delivery) {    
    if (err) callback(err);
    Order.find({ _id : { "$in" : delivery.orders}}, function(err, orders){
      async.each(orders, function(order, orderProcessed){
        // Get the first payment to calculate subscription
        var firstPayment = _.chain(order.payments)
                            .sortBy(function (payment) { return payment.date })
                            .first()
                            .value();
        // Process the cartitems
        SKU.populate(order.cartitems, { path: 'sku' }, function (err, cartitems) {
          if (err) callback(err);
          async.each(cartitems, function (cartitem, cartitemProcessed) {
            // Get the share and subscription
            var share = cartitem.sku.shares.id(cartitem.share);
            var subscription = share.subscriptions.id(cartitem.subscription);
            // Check if the subcription is still active
            var active = (now.getTime() - firstPayment.date.getTime()) < subscription.timespan;
            if (active) {
              // Populate Farm Data
              Farm.populate(cartitem.sku, { path: 'farm', options:{lean:true} }, function (err, sku) {
                if (err) callback(err);
                // Add customer data
                if (skus[sku.farm._id] === undefined)
                  skus[sku.farm._id] = {
                    farm: sku.farm,
                    shares: []
                  };
                var existing = _.find(skus[sku.farm._id].shares, function(_share) {                      
                  return _.isEqual(sku._id, _share.sku._id) && _.isEqual(share._id, _share.share._id) && _.isEqual(subscription._id, _share.subscription._id);
                });
                if(existing == undefined){
                  var info = {
                    order: order._id,
                    sku: sku.toObject(),
                    share: share.toObject(),
                    subscription: subscription.toObject(),
                    quantity: cartitem.quantity
                  };
                  skus[sku.farm._id].shares.push(info);
                } else
                  existing.quantity += cartitem.quantity;
                
                cartitemProcessed();
              });                                    
            } else cartitemProcessed();
          }, function (err) {
            if (err) callback(err);
            else orderProcessed();
          })
        });
      }, function(err) {
        var plan = {
          delivery:delivery.toObject(),
          skus:_.toArray(skus)
        }        
        callback(null, plan)
      });
    });
  });
};

// Delivery schedule is targeted for autonomous couriers, needs refactor.
exports.getDeliverySchedule = function (courier, callback) {
    var Order = require("orders").models.Order;

    Order.find({
        'deliveries.tag': 'dropoff',
        'deliveries.status.current.name': 'scheduled',
        'deliveries.info.courier': courier._id
    },
    function (err, orders) {
        if (err) callback(err);

        var processOrders = [];
        var deliveries = {};
        // Go through each order, group them by client and list corresponding shares.
        _.each(orders, function (order) {
            processOrders.push(function (callback) { processOrderDeliverySchedule(order, callback) });
        });

        async.parallel(processOrders, function (err, results) {
            if (err) callback(err);
            _.each(results, function (delivery) {
                // Add customer data
                if (deliveries[delivery.customer._id] === undefined)
                    deliveries[delivery.customer._id] = {
                        customer: delivery.customer,
                        shares: []
                    };
                deliveries[delivery.customer._id].shares.push(delivery.shares);
            });
            callback(null, _.toArray(deliveries));
        })

    });
};

var processOrderDeliverySchedule = exports.processOrderDeliverySchedule = function (order, callback) {
    var SKU = require("farms").models.SKU;
    var Farm = require("farms").models.Farm;
    var Account = require("auth").models.Account;

    var deliveries = {};
    // Populate the customer Data
    Account.populate(order, { path: 'customer' }, function (err, order) {
        if (err) callback(err);
        // Get the next delivery planned for dropoff
        var nextDelivery = _.chain(order.deliveries)
                            .sortBy(function (delivery) { return delivery.timeframe.begin })
                            .find(function (delivery) { return delivery.tag == 'dropoff' && delivery.status == 'scheduled' && delivery.info.courier == courier._id })
                            .value();
        // Get the first payment to calculate subscription
        var firstPayment = _.chain(order.payments)
                            .sortBy(function (payment) { return payment.date })
                            .first()
                            .value();
        // Process the cartitems
        SKU.populate(order.cartitems, { path: 'sku' }, function (err, cartitems) {
            if (err) callback(err);
            async.each(cartitems, function (cartitem, callback) {
                // Get the share and subscription
                var share = cartitem.sku.shares.id(cartitem.share);
                var subscription = share.subscriptions.id(cartitem.subscription);
                // Check if the subcription is still active
                var active = (now.getTime() - firstPayment.date.getTime()) < subscription.timespan;
                if (active) {
                    // Populate Farm Data
                    Farm.populate(cartitem.sku, { path: 'farm' }, function (err, sku) {
                        if (err) callback(err);
                        // Add farm data
                        if (deliveries[order.customer._id] === undefined)
                            deliveries[order.customer._id] = {
                                customer: order.customer,
                                shares: []
                            };
                        var info = {
                            order: order._id,
                            farm: sku.farm,
                            share: share,
                            subscription: subscription,
                            quantity: cartitem.quantiy,
                            delivery: nextDelivery
                        };
                        deliveries[order.customer._id].orders.push(info);
                        callback()
                    });
                } else callback()
            }, function (err) {
                if (err) callback(err);
                else callback(null, _.toArray(deliveries)); // Transform the object to array
            });            
        });
    });
};

// Based on total orders for the week
exports.getWholesales = function (farm, callback) {
  var Order = require("orders").models.Order;
  var Delivery = require("orders").models.Delivery;
  var SKU = require("farms").models.SKU;
  var now = new Date();
  var end_of_week =  new Date(now.getTime() + ( (6 - now.getDay()) * (1000 * 60 * 60 * 24)))
  end_of_week.setHours(23);
  end_of_week.setMinutes(59);
  end_of_week.setSeconds(59);
  winston.info("eow: ",end_of_week.toLocaleString())
  Delivery.find({
    'timeframe.begin': { '$gte': now, '$lt': end_of_week }
  }, function (err, deliveries) {
    winston.info("Deliveries to process: ", deliveries.length);
    if (err) { callback(err); throw new Error(err);}
    var orderids = _.chain(deliveries).pluck("orders").union().flatten().value();
    winston.info("Orders: ", orderids);
    SKU.find({ farm: farm }, function(err, skus){
      if (err) { callback(err); throw new Error(err);}
      var skuids = _.pluck(skus, "_id");
      winston.info("SKUs: ", skuids);
      Order.find({ "_id":{"$in": orderids},"cartitems.sku":{"$in":skuids}}, function(err, orders){
        if (err) { callback(err); throw new Error(err);}
        winston.info("Orders to process:",orders.length);
        var processOrders = [];
        var wholesales = {};
        
        _.each(orders, function (order) {
          processOrders.push(function (done) { processOrderWholesale(order, done) });
        });

        async.parallel(processOrders, function (err, results) {
          if (err) callback(err);
          winston.info("Results: ", results.length)
          _.each(results, function (wholesale) {
            //Add sku
            wholesale.forEach(function(_sku){
              var sku = _.find(skus,function(sku){ return _.isEqual(sku._id,_sku._id) });
              if(sku){
                if (wholesales[sku._id] === undefined)
                  wholesales[sku._id] = {
                    sku: sku.toObject(),                  
                    amount: _sku.amount
                  };
                else
                  wholesales[sku._id].amount += _sku.amount
              }
            });
                      
          });
          
          
            // Transform the object to array
            wholesales = _.toArray(wholesales);
            // Process the batchs to round amounts
            _.each(wholesales, function (wholesale) {
              winston.info(wholesale.amount)
              // round the amount by batch size              
              var total = Math.ceil(wholesale.amount / wholesale.sku.batch_size) * wholesale.sku.batch_size
              wholesale.amount = total;              
            });
            callback(null, wholesales);
        });
      });
    });
  });
};
var processOrderWholesale = exports.processOrderWholesale = function (order, callback) {
  // Go through each order, group them by client and list corresponding shares.
  var SKU = require("farms").models.SKU;
  var Account = require("auth").models.Account;
  
  var now = new Date();
  var wholesales = {};
  // Get the first payment to calculate subscription
  var firstPayment = _.chain(order.payments)
  .sortBy(function (payment) { return payment.date })
  .first()
  .value();
  // Process the cartitems
  SKU.populate(order.cartitems, { path: 'sku' }, function (err, cartitems) {
    if (err) callback(err);
    _.each(cartitems, function (cartitem) {
      // Get the share and subscription
      var share = cartitem.sku.shares.id(cartitem.share);
      var subscription = share.subscriptions.id(cartitem.subscription);
      // Check if the subcription is still active
      var active = (now.getTime() - firstPayment.date.getTime()) < subscription.timespan;
      if (active) {    
        winston.info("Processing sku: ",cartitem.sku._id);
        if (wholesales[cartitem.sku._id] === undefined)
          wholesales[cartitem.sku._id] = {
            _id: cartitem.sku._id,                  
            amount: share.amount * cartitem.quantity
          };
        else
          wholesales[cartitem.sku._id].amount += share.amount;        
      } 
    });         
    callback(null, _.toArray(wholesales));
  });  
};