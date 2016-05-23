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
    , checkout = require("./checkout");

exports.renderCheckout = function (req, res) {
  req.session.nextUrl = "/checkout";
  req.session.save();
  winston.info("Checkout for country:", req.geo.country.toLowerCase())
  res.render("checkout", {country:req.geo.country.toLowerCase()});
};

exports.checkout = function (req, res) {
    var SKU = require("farms").models.SKU;
    // parse req.body data
    // Order properties prefix with item_
    var orderProperties = _.chain(req.body)
                           .keys()
                           .filter(function (key) { return key.indexOf("item_") == 0 })
                           .union(["itemCount"]) // SimpleCartjs itemCount
                           .value();
    var orderData = _.pick(req.body, orderProperties);
    // Customer properties prefix with customer_
    var customerProperties = _.chain(req.body)
                              .keys()
                              .filter(function (key) { return key.indexOf("customer_") == 0 })
                              .value();
    var customerData = _.pick(req.body, customerProperties);
    // Payment properties prefix with payment_
    var paymentProperties = _.chain(req.body)
                             .keys()
                             .filter(function (key) { return key.indexOf("payment_") == 0 })
                             .union(["currency", "shipping", "tax", "taxRate"]) // SimpleCartjs defaults
                             .value();
    var paymentData = _.pick(req.body, paymentProperties);
    checkout.processCustomer(customerData, function (customer) {
      // Add the customer Model
      orderData.customer = customer;
      checkout.processOrder(orderData, function (order) {
        var amountDue = 0;
        // Check the order total matched the data from the client.
        SKU.populate(order.cartitems, { path: 'sku' }, function (err, cartitems) {
          if (err) throw new Error(err);
          _.each(cartitems, function (cartitem) {
            // Get the share and subscription
            var share = cartitem.sku.shares.id(cartitem.share);
            var subscription = share.subscriptions.id(cartitem.subscription);
            var unitCost = share.price * subscription.deliveries;
            var cost = unitCost * cartitem.quantity;
            if(paymentData.currency != "usd")
              cost= cost/100;
            var discount = cost * subscription.discount / 100;
            if(paymentData.currency == "clp")
              discount = Math.round(discount)
              amountDue += cost - discount;
          });
          
          paymentData.payment_total = amountDue
          winston.info("Payment Total: ", paymentData.payment_total)
          var gatewayType = require("./gateways").createGateway(paymentData.payment_provider),
              gateway = new gatewayType({
                paymentData : paymentData,
                order : order,
                customerData : customerData,
                customer : customer,
                res : res,
                req : req,
                checkout : checkout
              });          
          
          // Process the payment and create deliveries
          gateway.process();
          
        });
      });
    });
};


// Handlers
exports.wholesales = function (req, res) {
    var farmId = req.params.farm_id;

    var Farm = require("farms").models.Farm;
    var dispatch = require("./dispatch");
    Farm.findById( farmId, function (err, farm) {
        dispatch.getWholesales(farm, function (err, wholesales) {
            res.json(wholesales);
        });
    });
};

exports.shareholdings = function (req, res) {
    var customerId = req.params.customer_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById( customerId, function (err, account) {
        dispatch.getShareholdings(account, function (err, shareholdings) {
            res.json(shareholdings);
        });
    });
};

exports.deliveryPlan = function (req, res) {
    var courierId = req.params.courier_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById(courierId, function (err, account) {
        dispatch.getDeliveryPlan(account, function (err, deliveries) {
            res.json(deliveries);
        });
    });
},

exports.deliverySchedule = function (req, res) {
    var courierId = req.params.courier_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById(courierId, function (err, account) {
        dispatch.getDeliverySchedule(account, function (err, deliveries) {
            res.json(deliveries);
        });
    });
};

exports.dispatchDeliveries = function(req, res) {
  var filters = req.body.filters || {};
  winston.info("Filters:", filters)
  var dispatch = require("./dispatch");
  dispatch.getDeliveries(filters,function(dispatchDeliveries){
    res.json(dispatchDeliveries);
  });
};

exports.dispatchOrders = function(req, res) {
  var filters = req.body.filters || {};
  winston.info("Filters:", filters)
  var dispatch = require("./dispatch");
  dispatch.getOrders(filters,function(dispatchOrders){
    res.json(dispatchOrders);
  });
};
