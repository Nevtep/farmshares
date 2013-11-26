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
      
      self.deliveryDay = ko.observable(6);
      self.deliveryTimeframe = ko.observable(12);
      self.timeframeStart  = ko.computed(function () {
        var next = new Date();
        next.setDate(next.getDate() + (parseInt(self.deliveryDay()) + (7 - next.getDay())) % 7);
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
      
      // Geocoding
      self.geocode.subscribe(function (locationObj) {
        var location = self.codingAddress;
        // Format the field
        location.str(locationObj.formatted_address);
        // Add LONG/LAT since Mongo uses that format
        location.geometry()[0] = locationObj.geometry.location.lng();
        location.geometry()[1] = locationObj.geometry.location.lat();
        // Complete remaining info
        var address = locationObj.address_components;
        for (var i = address.length - 1; i >= 0; i--) {
          var which;
          switch (address[i].types[0]) {
            case 'administrative_area_level_1':
              which = "region";
              break;
              
            case 'administrative_area_level_2':
              which = "state";
              break;
              
            case 'locality':
              which = "city";
              break;
              
            case 'route':
              which = "address"
              break;
              
            default:
              which = address[i].types[0];
              break;
          }
          
          if (which === "address") {
            location.address.street.main.name(address[i].long_name);
          } else if (which === "street_number") {
            location.address.street.main.number(address[i].long_name);
          } else {
            if (!location[which]) location[which] = {
              name: ko.observable(),
              shortname: ko.observable()
            };
            location[which].name(address[i].long_name);
            location[which].shortname(address[i].short_name);
          }
        };
      })
      // Geolocation Wrappers
      self.codingAddress = null;
      self.locationChanged = function (data, event) {
        self.codingAddress = data;
        self.codeAddress.apply(self, [data.str()])
        return true;
      };
      
      // CHECKOUT
      self.checkout = function (data, evt) {
        var timeFrame = new Date(self.timeframeStart().getTime());
        timeFrame.setHours(timeFrame.getHours() + 2);
        if(self.paymentMean == "credit") {
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
