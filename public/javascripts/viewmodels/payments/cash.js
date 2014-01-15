define(["simpleCart"],function(simpleCart){
  return function cashPayment(){
    var self = this;
    
    self.process = function(checkout){
      simpleCart.bind('beforeCheckout', function (data) {
        data.customer_email = checkout.account.email();
        data.customer_delivery_from = checkout.timeframeStart().getTime();
        data.customer_delivery_to = checkout.timeframeEnd().getTime();
        data.customer_billingaddress = checkout.account.billing_address.toJSON();
        data.customer_shippingaddress = checkout.account.shipping_address.toJSON();
        data.payment_provider = "Cash";
        data.currency = checkout.account.billing_address.country.name().toLowerCase() == "chile" ? "clp" : "usd";
        data.payment_total = simpleCart.total();
      });
      
      simpleCart.checkout();
    }
  }
});