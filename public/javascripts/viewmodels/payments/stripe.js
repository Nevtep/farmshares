define(["stripe","simpleCart"],function(Stripe,simpleCart){
  return function stripePayment(){
    var self = this;
    
    self.process = function(checkout){
      Stripe.card.createToken({
        number: checkout.cardnumber(),
        cvc: checkout.cvc(),
        exp_month: checkout.cardExpirationMonth(),
        exp_year: checkout.cardExpirationYear()
      }, function (status, response) {
        if (response.error) throw response.error;
        
        
        simpleCart.bind('beforeCheckout', function (data) {
          data.customer_email = checkout.account.email();
          data.customer_delivery_from = checkout.timeframeStart().getTime();
          data.customer_delivery_to = checkout.timeframeEnd().getTime();
          data.customer_billingaddress = checkout.account.billing_address.toJSON();
          data.customer_shippingaddress = checkout.account.shipping_address.toJSON();
          data.payment_provider = "Stripe";
          data.currency = "usd";
          data.payment_stripeToken = response.id;
          data.payment_total = simpleCart.total();
        });
        
        simpleCart.checkout();
      });
    }
  }
});