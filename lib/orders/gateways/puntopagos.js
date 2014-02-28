exports.gateway = function(context){
  var self = this;
  var paymentData = context.paymentData,
      order = context.order,
      customerData = context.customerData,
      customer = context.customer,
      res = context.res,
      req = context.req,
      checkout = context.checkout;
  
  self.process = function(){
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
  }
}