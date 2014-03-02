/*
 * Transform Currency Snippet
 */

//if (share.currency) {
//    switch (share.currency) {
//        case "CLP":
//            // This amount can and should be parsed from this url
//            // http://si3.bcentral.cl/Indicadoressiete/secure/Serie.aspx?gcode=PRE_TCO&param=DfVYwfinI-35nMhh%245WP.mX0GNecc%23AZpFagPSew5414MkK_uC%24Hsm_6tkoWgJLzs_nLrbC.E7UWxRYaA8dyg1AD
//            // to be kept up to date
//            amount /= 474, 04;
//            amount = Number(amount).toString().split(".")[0];

//            break;
//    }
//}

var _ = require("underscore")
    , async = require("async");

exports.processCustomer = function (customerData, callback) {
    winston.info("Processing Customer", customerData);
  var Account = require("auth").models.Account;
  
  Account.findOne({ email: customerData.customer_email }, function (err, account) {
    if (err) throw new Error(err)
    else {
      // The user is always required to login or register so there are no new accounts
      // We update billing and shipping info
      account.billing_address = JSON.parse(customerData.customer_billingaddress);
      account.shipping_address = JSON.parse(customerData.customer_shippingaddress);
      account.save(function(err, savedAccount) {
        callback(savedAccount)
      });
    };
  });
}

exports.processOrder = function (orderData, callback) {
    winston.info("Processing Order", orderData);
  var Order = require("orders").models.Order
  var newOrder = new Order();
  newOrder.status = [{
      name: "processing",
      timestamp: new Date()
  }];
  newOrder.customer = orderData.customer._id;

  for (i = 1, t = orderData.itemCount; i <= t; i++) {
      var itemData = _.chain(orderData["item_options_" + i].split(", ")).map(function (item) { return item.split(": ") }).object().value();
    var cartitem = {
      sku: itemData.skuid,
      share: itemData.shareid,
      subscription: itemData.subscriptionid,
      quantity:orderData["item_quantity_" + i]
    }
    
    winston.info("About to push cartItem");
    newOrder.cartitems.push(cartitem);
  }

  winston.info("About to save order");
  newOrder.save(function(err, order){
      if (err){
          winston.error(err);
          throw new Error(err);
      } else 
          callback(order);
      
    });
}

exports.processStripePayment = function (paymentData, callback) {
    winston.info("Processing Payment with Stripe", paymentData);
    var stripe = require('stripe')(process.env.STRIPE_KEY);    

    stripe.charges.create({
        amount: paymentData.payment_total,
        currency: paymentData.currency,
        card: paymentData.payment_stripeToken
    }, function (err, charge) {
        if (err) {
            winston.error("Stripe error", err);
            throw new Error(err);
        };
        // Stripe takes cents as amount
        var payment = {
            currency_code: paymentData.currency,
            amount: paymentData.payment_total,
            provider: {
                name: "Stripe",
                data: [charge]
            },
            status: [{
              name: "charged",
              timestamp: new Date()
            }],
            date: new Date()
        };

        callback(payment);
    });
}

exports.processPuntoPagosPayment = function (paymentData, callback) {
    var pp = require('./puntopagos').payments;
    var trx_id = (new Date()).getTime();
  // Payment_total is expresed in cents
  var amount =   paymentData.payment_total;
  pp.create(trx_id, amount, paymentData.payment_method, function (data, url) {      
        var payment = {
            currency_code: paymentData.currency,
            amount: amount,
            provider: {
                name: "PuntoPagos",
                data: [data]
            },
            status: [{
              name: "pending",
              timestamp: new Date()
            }],
            date: new Date()
        };

        callback(payment, url);
    });
}

exports.processCashPayment = function(paymentData, callback) {
  var payment = {
    currency_code: paymentData.currency,
    amount: paymentData.payment_total,
    provider: {
      name: "Cash",
      data: []
    },
    status: [{
      name: "pending",
      timestamp: new Date()
    }],
    date: new Date()
  };
  
  callback(payment);
};

exports.processBitcoinPayment = function(paymentData, callback) {
  var payment = {
    currency_code: "btc",
    amount: paymentData.payment_total,
    provider: {
      name: "BTC",
      data: paymentData.btcData
    },
    status: [{
      name: "pending",
      timestamp: new Date()
    }],
    date: new Date()
  };
  
  callback(payment);
};

exports.createDeliveries = function (customerData, order, callback) {
    var SKU = require("farms").models.SKU;
    var Delivery = require("orders").models.Delivery;
  var Account = require("auth").models.Account;  
  Account.populate(order, { path: 'customer' }, function(err, order){
    if (err) callback(err);
    else {
      var deliveryCount = 0;
      // Get longest subscription
      SKU.populate(order.cartitems, { path: 'sku' }, function (err, cartitems) {
        if (err) callback(err);
        else {
          async.each(cartitems, function (cartitem, callback) {
            // Get the share and subscription
            var share = cartitem.sku.shares.id(cartitem.share);
            var subscription = share.subscriptions.id(cartitem.subscription);
            // Check if the subcription is still active
            if (deliveryCount < subscription.deliveries) deliveryCount = subscription.deliveries;
            callback();
          }, function (err) {
            if (err) callback(err);
            else {
                var deliveries = [];
                var from = new Date(parseInt(customerData.customer_delivery_from));
                var to = new Date(parseInt(customerData.customer_delivery_to));
                var count = 0;
                async.until(function() { return count == deliveryCount },
                          function(done){
                            Delivery.findOne({
                              tag: "dropoff",
                              "info.customer": order.customer._id,                              
                              'timeframe.begin' : from,
                              'timeframe.end' : to
                            },function(err,delivery){
                              if (err) done(err);
                              else {
                                delivery = delivery || new Delivery({
                                  status: [{ name:"planned", timestamp:new Date()}],
                                  tag: "dropoff",
                                  timeframe: {
                                      begin: new Date(from.getTime()),
                                      end: new Date(to.getTime())
                                  },
                                  info: {
                                      customer: order.customer
                                  }
                                });
                                deliveries.push(delivery);
                                from = new Date(from.getTime() + 60 * 60 * 24 * 14 * 1000);
                                to = new Date(to.getTime() + 60 * 60 * 24 * 14 * 1000);
                                // Ensure time even in daylight saving time
                                from.setHours(new Date(parseInt(customerData.customer_delivery_from)).getHours());
                                from.setMinutes(new Date(parseInt(customerData.customer_delivery_from)).getMinutes());
                                from.setSeconds(new Date(parseInt(customerData.customer_delivery_from)).getSeconds());
                                to.setHours(new Date(parseInt(customerData.customer_delivery_to)).getHours());
                                to.setMinutes(new Date(parseInt(customerData.customer_delivery_to)).getMinutes());
                                to.setSeconds(new Date(parseInt(customerData.customer_delivery_to)).getSeconds());
                                count++;
                                done();
                              };
                            });
                          }, function(err) {
                            callback(err, deliveries);
                          }
                     );                                
              };
          });
        };          
      });
    };
  });
};

exports.sendNotifications = function (order) {
  var Account = require("auth").models.Account,
      Delivery = require("orders").models.Delivery,
      mailing = require("mailing"),
      dispatch = require("./dispatch");
  var now = new Date();
  var close = new Date(now.getTime() - (1000*60*60*8));
  var weekend_start = close.getDay() < 5 ? new Date(close.getTime() + ( (5 - close.getDay()) * (1000 * 60 * 60 * 24))) : new Date(close.getTime() + ( (12 - close.getDay()) * (1000 * 60 * 60 * 24)));
  var weekend_end = close.getDay() < 5 ? new Date(close.getTime() + ( (8 - close.getDay()) * (1000 * 60 * 60 * 24))) : new Date(close.getTime() + ( (15 - close.getDay()) * (1000 * 60 * 60 * 24)));
  weekend_start.setHours(23);
  weekend_start.setMinutes(59);
  weekend_start.setSeconds(59);
  weekend_end.setHours(23);
  weekend_end.setMinutes(59);
  weekend_end.setSeconds(59);
  // Send the email to the customer
  Account.populate(order, { path: 'customer', options: { lean: true }, select:{name:1,shipping_address:1,email:1} }, function (err, order) {
    if(err) throw new Error(err);
    winston.info("Delivery filters:",{"orders":order._id, "timeframe.begin" : {"$gte":weekend_start,"$lte":weekend_end}});
    Delivery.findOne({"orders":order._id, "timeframe.begin" : {"$gte":weekend_start,"$lte":weekend_end}},"timeframe",{lean:true},function(err,delivery){
      if(err) throw new Error(err)      
      dispatch.getOrderSummary(order, function (err, summary) {
        if(err) throw new Error(err);
        var purchase_obj = {
          customer: order.customer,
          order: {
            id : order._id,
            placed : _.find(order.status,function(status){return status.name=="placed"}).timestamp.toLocaleDateString(),
            total:_.first(order.payments).amount,
            shipping:0,
            tax:0,
            grandTotal:_.first(order.payments).amount,
            currency:_.first(order.payments).currency_code.toUpperCase()
          },
          deliveryDate: delivery.timeframe,
          summary: summary
        };
        var purchaseMailOptions = {
          from: "Farm Shares Support <support@farmshares.com>", // sender address
          cco: ["support@farmshares.com"], // loopback address
          to: order.customer.email, // list of receivers
          subject: "Tu pedido de FarmShares.com" // Subject line
        };
        mailing.queueEmail(purchaseMailOptions, "purchase", purchase_obj);                        
        mixpanel.track("Sent order confirmation email", { customer: true, id: order.customer._id });
      });
    });
  });

    // TODO: Send wholesales in bulk. Move this where appropiate.
    // Lookup the farmer
    //AccountModel.findOne({ "_id": farm.farmer }, function (err, farmer) {
    //    if (err) {
    //        throw new Error(err);
    //    } else if (farmer) {
    //        winston.info("Found farmer", farmer.name.full);
    //        var sale_obj = {
    //            account: account,
    //            farmer: farmer,
    //            amount: amount / 100 * 0.9,
    //            share: share,
    //            timeframe: req.body.timeframe,
    //            next_friday: next_friday,
    //            delivery: req.body.deliveryaddress,
    //            billing: req.body.billingaddress || null,
    //            farm: farm
    //        };
    //        // setup e-mail data with unicode symbols
    //        var saleMailOptions = {
    //            from: "Farm Shares Support <support@farmshares.com>", // sender address
    //            cc: "support@farmshares.com", // loopback address
    //            to: farmer.email, // list of receivers
    //            subject: "You just got a sale!" // Subject line                  
    //        }
    //        mailer.sendTemplate(saleMailOptions, "sale", sale_obj);


    //    }
    //});
};
