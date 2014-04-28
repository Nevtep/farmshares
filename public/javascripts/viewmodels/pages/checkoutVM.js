define(["jquery", "knockout", "geolocationVM", "authenticationVM", "cartDataVM", "puntopagosPayment", "stripePayment", "cashPayment", "bitcoinPayment", "simpleCart", "knockout.lazy", "bootstrap"], function ($, ko, geolocationVM, auth, cartData, puntopagosPayment, stripePayment, cashPayment, bitcoinPayment, simpleCart) {
    var checkoutPageVM = function () {
      var self = this;
      var country = $("#coutry_code").val();
      self.cart = new cartData();
      
      if (country=="cl"){
      	simpleCart.currency({
      		code:"CLP",
      		symbol:"CLP",
      		name:"Chilean Peso"
      	});
      } else if (country=="ar"){
      	simpleCart.currency({
      		code:"CLP",
      		symbol:"CLP",
      		name:"Chilean Peso"
      	});
      	/*simpleCart.currency({
      		code:"ARS",
      		symbol:"$",
      		name:"Argentine Peso"
      	});*/
      } else
        simpleCart.currency("USD");
        
      self.account = auth.account;
      self.accountReady = ko.computed(function () {
        return auth.loggedIn && auth.account.ready();
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
      self.timeframeEnd = ko.computed(function(){
        var timeFrame = new Date(self.timeframeStart().getTime());
        timeFrame.setHours(timeFrame.getHours() + 2);
        return timeFrame;
      })
      self.nextDelivery = ko.computed(function () {
        return self.timeframeStart().toLocaleDateString();
      })
      
      self.paymentMean = ko.observable("credit");
      self.payByCredit = ko.computed(function() {
        return self.paymentMean() == "credit";
      });
      self.payByBitcoin = ko.computed(function() {
        return self.paymentMean() == "bitcoin";
      });
      
      self.cashTotal = ko.computed(function() {
        return !self.payByBitcoin();
      });
      self.paymentMethod = ko.observable("3");
      self.btcamount = ko.observable("Calculating...");
      self.payByBitcoin.subscribe(function(updateAmount){
        if(updateAmount){
          var bitcoin = new bitcoinPayment();
          
          bitcoin.updateAmount(self.btcamount);
        }
      })
      
      self.cardbrand = ko.observable();
      self.cardnumber = ko.observable();
      self.cardExpirationMonth = ko.observable();
      self.cardExpirationYear = ko.observable();
      self.cvc = ko.observable();
      
      // CHECKOUT
      self.checkout = function (data, evt) {
        var payment;
        if(self.paymentMean() == "credit") {
          if (country == "cl") {
            payment = new puntopagosPayment();
          } else {
            payment = new stripePayment();
          };
        } else if (self.paymentMean() == "bitcoin") {
            payment = new bitcoinPayment();
            payment.btc_total = self.btcamount();
        } else {
          payment = new cashPayment();
        };
        payment.process(self);
      };
    };

    checkoutPageVM.prototype = new geolocationVM();

    return checkoutPageVM;
});
