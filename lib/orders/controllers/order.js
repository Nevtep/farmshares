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

var notifyAndRender = function (order, customer, res) {
    checkout.sendNotifications(order)
    res.render("thankyou");
}

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
                    if(paymentData.payment_provider == "PuntoPagos")
                      cost= cost/100;
                    var discount = cost * subscription.discount / 100;
                    if(paymentData.payment_provider == "PuntoPagos")
                      discount = Math.round(discount)
                    amountDue += cost - discount;
                });

                paymentData.payment_total = amountDue
                winston.info("Payment Total: ", paymentData.payment_total)
                if (paymentData.payment_provider == "Stripe")
                    checkout.processStripePayment(paymentData, function (payment) {
                        // Push the payment to the order, create deliveries notify and succeed
                        order.payments.push(payment);
                        winston.info("About to create Deliveries");
                        checkout.createDeliveries(customerData, order, function (err, deliveries) {
                            if (err) throw new Error(err)
                            winston.info("About to push deliveries and save order");
                            var saveOrder = _.after(deliveries.length, function(err) {
                              order.status.push({ name: "placed", timestamp: new Date() });
                              order.save(function (err, order) {
                                  winston.info("About to render checkout");
                                  if (err) throw new Error(err)
                                  else notifyAndRender(order, customer, res)
                              });
                            });
                            _.each(deliveries, function(delivery) {
                              delivery.orders.push(order);
                              delivery.save(saveOrder);
                            }); 
                        });
                    });
                else if (paymentData.payment_provider == "PuntoPagos")
                    checkout.processPuntoPagosPayment(paymentData, function (payment, url) {
                        order.payments.push(payment);
                        order.save(function (err) {
                            if (err) throw new Error(err)
                            else {
                                req.session.order = order._id;
                                req.session.customerData = customerData;
                                req.session.customer = customer;
                                req.session.save();

                                res.redirect(url)
                            };
                        });
                    });                
            });
        });
    });
};

exports.puntopagos = {};

exports.puntopagos.notify_post = function (req, res) {
    // TODO: check when this get's invoked and it's use

    // Example of Body from PuntoPagos
    // { codigo_autorizacion: '281172',
    //   error: null,
    //   fecha_aprobacion: '2013-02-15T20:38:50',
    //   medio_pago: '3',
    //   medio_pago_descripcion: 'WebPay Transbank',
    //   monto: 600000,
    //   num_cuotas: 0,
    //   numero_operacion: '0963465050',
    //   numero_tarjeta: '6623',
    //   primer_vencimiento: null,
    //   respuesta: '00',
    //   tipo_cuotas: 'Sin Cuotas',
    //   tipo_pago: null,
    //   token: 'MIA64OSEA3DI076D',
    //   trx_id: '1360963315917',
    //   valor_cuota: 0
    // }   

    if (req.body.error) {
        winston.error("Notify post error:", req.body);
        res.end("There has been an error: " + req.body.error);
    }
    res.end("Everythin's ok.");
}

exports.puntopagos.success = function (req, res) {
    if (!req.session.order) {
        res.redirect('/cart');
    };
  var Order = require("orders").models.Order;
  Order.findById(req.session.order, function(err,order){
    if (err) throw new Error(err)
    order.payments[0].status.push({ name: "charged", timestamp: new Date()});
    order.payments[0].provider.data.push(req.body);
    checkout.createDeliveries(req.session.customerData, order, function (err, deliveries) {
      if (err) throw new Error(err)
      winston.info("About to push deliveries and save order");
      var saveOrder = _.after(deliveries.length, function(err) {
        order.status.push({ name: "placed", timestamp: new Date() });
        order.save(function (err, order) {
          winston.info("About to render checkout");
          if (err) throw new Error(err)
          else notifyAndRender(order, req.session.customer, res)
            });
      });
      _.each(deliveries, function(delivery) {
        delivery.orders.push(order);
        delivery.save(saveOrder);
      }); 
    });
  });
}

exports.puntopagos.failure = function (req, res) {
    if (!req.session.order) {
        res.redirect('/cart');
    };
    var Order = require("orders").models.Order;
  Order.findById(req.session.order, function(err,order){
    order.payments[0].status.push({ name: "rejected", timestamp: new Date()});
    order.payments[0].provider.data.push(req.body);
    order.status.push({ name: "canceled", timestamp: new Date() });
    order.save(function (err) {
        if (err) throw new Error(err)
        else res.render("error", { error: req.body.error });
    });
  });
}

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
}

exports.shareholdings = function (req, res) {
    var customerId = req.params.customer_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById( customerId, function (err, account) {
        dispatch.getShareholdings(account, function (err, shareholdings) {
            res.json(shareholdings);
        });
    });
}

exports.deliveryPlan = function (req, res) {
    var courierId = req.params.courier_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById(courierId, function (err, account) {
        dispatch.getDeliveryPlan(account, function (err, deliveries) {
            res.json(deliveries);
        });
    });
}

exports.deliverySchedule = function (req, res) {
    var courierId = req.params.courier_id;

    var Account = require("auth").models.Account;
    var dispatch = require("./dispatch");
    Account.findById(courierId, function (err, account) {
        dispatch.getDeliverySchedule(account, function (err, deliveries) {
            res.json(deliveries);
        });
    });
}

exports.dispatchDeliveries = function(req, res) {
  var filters = req.body.filters || {};
  var dispatch = require("./dispatch");
  dispatch.getDeliveries(filters,function(dispatchDeliveries){
    res.json(dispatchDeliveries);
  });
}
