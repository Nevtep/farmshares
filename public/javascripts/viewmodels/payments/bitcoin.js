define(["simpleCart"],function(simpleCart){
  return function bitcoinPayment(){
    var self = this;
    
    self.btc_total = 0;
    self.process = function(checkout){
      simpleCart.bind('beforeCheckout', function (data) {
        data.customer_email = checkout.account.email();
        data.customer_delivery_from = checkout.timeframeStart().getTime();
        data.customer_delivery_to = checkout.timeframeEnd().getTime();
        data.customer_billingaddress = checkout.account.billing_address.toJSON();
        data.customer_shippingaddress = checkout.account.shipping_address.toJSON();
        data.payment_provider = "Bitcoin";
        data.currency = BTC;
        data.payment_total = self.btc_total;
      });
      
      simpleCart.checkout();
    }
  }
});