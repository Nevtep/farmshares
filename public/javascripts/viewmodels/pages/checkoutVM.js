define(["jquery", "knockout", "geolocationVM", "authenticationVM", "cartDataVM", "knockout.lazy", "bootstrap"], function ($, ko, geolocationVM, auth, cartData) {
    var checkoutPageVM = function () {
      var self = this;
      
      self.cart = new cartData();
      
      self.account = auth.account;
      self.accountReady = ko.computed(function () {
        return auth.loggedIn && auth.account.ready()
      });      
      self.copyAddress = ko.observable(false);
      self.notCopyAddress = ko.computed(function(){
        return !self.copyAddress();
      });
      self.addressValid = ko.computed(function () {
        return self.accountReady() && auth.account.isValid() && auth.account.billing_address.isValid() && (self.copyAddress() || auth.account.shipping_address.isValid());
      });
      self.confirmedAddress = ko.observable(false);
      self.accountReady.subscribe(function(confirm) {        
        self.confirmedAddress(self.addressValid());
      });
      
      self.editingAddress = ko.computed(function () {
        return auth.loggedIn && !self.confirmedAddress();
      });
      
      self.placingOrder = ko.computed(function () {
        return auth.loggedIn && !self.editingAddress();
      });
      
      self.confirmAddresses = function (data, evt) {
        if (self.addressValid()) {
          if (self.copyAddress())
            auth.account.shipping_address.fromJS(auth.account.billing_address.toJS());
          
          self.confirmedAddress(true);
        } else {
          self.confirmedAddress(false);
        };
      };
      
      self.editAddress = function (data, evt) {
        self.confirmedAddress(false);
      };
      
      self.deliveryDay = ko.observable(7);
      self.deliveryTimeframe = ko.observable(12);
      self.timeframeStart  = ko.computed(function () {
        var now = new Date();
        var close = new Date(now.getTime() - (1000*60*60*8));
        var next = close.getDay() < 5 ? new Date(close.getTime() + ( (parseInt(self.deliveryDay()) - close.getDay()) * (1000 * 60 * 60 * 24))) : new Date(close.getTime() + ( (parseInt(self.deliveryDay()) + 7 - close.getDay()) * (1000 * 60 * 60 * 24)));
        next.setHours(self.deliveryTimeframe(),0,0,0);
        return next;
      })
      self.nextDelivery = ko.computed(function () {
        return self.timeframeStart().toLocaleDateString();
      })
      
      self.paymentMean = ko.observable("credit");
      self.payByCredit = ko.computed(function() {
        return self.paymentMean() == "credit";
      });
      self.paymentMethod = ko.observable("3");
      self.cardbrand = ko.observable();
      self.cardnumber = ko.observable();
      self.cardExpirationMonth = ko.observable();
      self.cardExpirationYear = ko.observable();
      self.cvc = ko.observable();
      
      // CHECKOUT
      self.checkout = function (data, evt) {
        var timeFrame = new Date(self.timeframeStart().getTime());
        timeFrame.setHours(timeFrame.getHours() + 2);
        if(self.paymentMean() == "credit") {
          if (self.account.billing_address.country.name().toLowerCase() == "chile") {
            simpleCart.bind('beforeCheckout', function (data) {
              data.customer_email = self.account.email();
              data.customer_delivery_from = self.timeframeStart().getTime();
              data.customer_delivery_to = timeFrame.getTime();
              data.customer_billingaddress = self.account.billing_address.toJSON();
              data.customer_shippingaddress = self.account.shipping_address.toJSON();
              data.payment_provider = "PuntoPagos";
              data.currency = "clp";
              data.payment_method = self.paymentMethod();
              data.payment_total = simpleCart.total();
            });
            
            simpleCart.checkout();
          } else {
            Stripe.card.createToken({
              number: self.cardnumber(),
              cvc: self.cvc(),
              exp_month: self.cardExpirationMonth(),
              exp_year: self.cardExpirationYear()
            }, function (status, response) {
              if (response.error) throw response.error;
              
              
              simpleCart.bind('beforeCheckout', function (data) {
                data.customer_email = self.account.email();
                data.customer_delivery_from = self.timeframeStart().getTime();
                data.customer_delivery_to = timeFrame.getTime();
                data.customer_billingaddress = self.account.billing_address.toJSON();
                data.customer_shippingaddress = self.account.shipping_address.toJSON();
                data.payment_provider = "Stripe";
                data.currency = "usd";
                data.payment_stripeToken = response.id;
                data.payment_total = simpleCart.total();
              });
              
              simpleCart.checkout();
            });
          };
        } else {
          simpleCart.bind('beforeCheckout', function (data) {
              data.customer_email = self.account.email();
              data.customer_delivery_from = self.timeframeStart().getTime();
              data.customer_delivery_to = timeFrame.getTime();
              data.customer_billingaddress = self.account.billing_address.toJSON();
              data.customer_shippingaddress = self.account.shipping_address.toJSON();
              data.payment_provider = "Cash";
              data.currency = self.account.billing_address.country.name().toLowerCase() == "chile" ? "clp" : "usd";
              data.payment_total = simpleCart.total();
            });
            
            simpleCart.checkout();
        };
      };
    };

    checkoutPageVM.prototype = new geolocationVM();

    return checkoutPageVM;
});
