// Share view model
define(['knockout', 'modelVM', 'subscriptionDataVM'], function(ko, modelVM, subscriptionData) {
  var shareDataViewModel = function(data, sku) {
    var self = this;
    
    // parent sku
    self.sku = sku;
    
    // Lazy loading flag
    self.ready = ko.observable(false);
     
    // configure the model after being mapped
    self.configure = function () {
        // Validations
        self.name.extend({ required: { params: true, message: "Enter a display name" } });        
        self.currency.extend({required:{ params: true, message:"Select a currency"}});
        self.price.extend({
            required: {
                params: true,
                message: "Enter a price"
            }
        });
        self.amount.extend({
            required: {
                params: true,
                message: "Enter an amount"
            }
        });

        self.errors = ko.validation.group({
            ShareName:self.name,
            ShareCurrency:self.currency,
            SharePrice: self.price,
            ShareAmount: self.amount            
        })

        self.isValid = ko.computed(function () {
            return self.errors().length === 0;
        })
        
        self.selectedSubscription = ko.observable(self.subscriptions()[0]);

        // Computed observable to keep prince in cents
        self.netPrice = ko.computed({
            read: function () {
                return self.price() / 100
            }, write: function (value) {
                self.price(value * 100)
            }
        });

        self.share = ko.computed(function () {
          if (self.sku != undefined)
            return self.name() + " " + self.amount() +  " " + self.sku.unit();
          else
            return self.name();
        });

        self.cost = ko.computed(function () {
            return "{0} {1}".replace("{0}", self.currency()).replace("{1}", self.netPrice())
        });

        // TODO: refactor share photos
//        self.photo = self.gallery()[0];

        self.ready(true);
    };    

    // Extended properties for bases
    var extend = {
        // Data mapping configuration for CRUD
        mapping: {
            'subscriptions': {
                create: function (options) {
                    if (options.data)
                        return new subscriptionData(options.data);
                    else
                        return ko.observableArray([]);
                }
            }
          }
    };

    self.init.apply(self, [extend]);
    // Map data to model, shares have no CRUD operations.
    if(data) {
      self.fromJS.apply(self, [data]);
      self.configure();
    } else {
      self.load.apply(self).done(function(res) {
        self.configure();
      });
    }
    // File uploading interface
    self.uploads = new ko.observableArray();
  };

  shareDataViewModel.prototype = new modelVM("/shares/get");

  return shareDataViewModel;
});
