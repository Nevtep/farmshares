var _ = require("underscore");

exports.gateway = function(context){
  var self = this;
  var paymentData = context.paymentData,
      order = context.order,
      customerData = context.customerData,
      customer = context.customer,
      res = context.res,
      checkout = context.checkout;
  
  self.process = function(){
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
            else {
              checkout.sendNotifications(order)
              res.render("thankyou");
            }
          });
        });
        _.each(deliveries, function(delivery) {
          delivery.orders.push(order);
          delivery.save(saveOrder);
        }); 
      });
    });
  }
}