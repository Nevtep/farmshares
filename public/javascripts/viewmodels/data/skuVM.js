// Share view model
define(['knockout', 'modelVM', 'shareDataVM'], function(ko, modelVM, shareData) {
  var skuDataViewModel = function(data) {
    var self = this;

    // Lazy loading flag
    self.ready = ko.observable(false);

    // configure the model after being mapped
    self.configure = function () {

        self.name.extend({ required: { params: true, message: "Enter a display name" } });
        self.title.extend({ required: { params: true, message: "Enter a Title" } });
        self.description.extend({ required: { params: true, message: "Enter a description" } });
        self.batch_size.extend({ required: { params: true, message: "Enter a bulk amount" } });
        self.unit.extend({required: { params: true, message:"Enter a unit"}});

        self.errors = ko.validation.group({
            SKUTypeName: self.name,
            SKUTypeTitle: self.title,
            SKUTypeDescription: self.description,
            SKUTypeBulkamount: self.batch_size,
            SKUTypeUnit: self.unit
        });

        self.isValid = ko.computed(function () {
            return self.errors().length === 0;
        });        

        self.selectedShare = ko.observable(self.shares()[0]);
        

        self.discount = ko.computed(function(){
            if(!self.selectedShare()) return 0;
            // Get the total net price over the amount of deliveries
            var share = self.selectedShare();
            if(share === undefined) return 0;
            var subscription = share.selectedSubscription();
            if(subscription === undefined) return 0;
            var cost = share.netPrice() * subscription.deliveries();
          
            // return the discount
            return Math.round(cost * subscription.discount() / 100);
        });

        self.discountDisplay = ko.computed(function () {
            if (!self.selectedShare()) return "";
            // Get the total net price over the amount of deliveries
            var share = self.selectedShare();
            if (share === undefined) return self.discount();

            // return the discount
            return share.currency().toString() + " " + self.discount().toString();
        });

        self.total = ko.computed(function(){
          // Get the total net price over the amount of deliveries
          var share = self.selectedShare();
          if(share === undefined) return 0;
          var subscription = share.selectedSubscription();
          if(subscription === undefined) return 0;
          var cost = share.netPrice() * subscription.deliveries();
          
          // substract the discount
          cost -= Math.round(cost * subscription.discount() / 100);
          return cost;
        });

        self.totalDisplay = ko.computed(function () {
            if (!self.selectedShare()) return "";
            // Get the total net price over the amount of deliveries
            var share = self.selectedShare();
            if (share === undefined) return self.total();

            // return the discount
            return share.currency().toString() + " " + self.total().toString();
        });

        self.hasSavings = ko.computed(function () {
            return self.discount() > 0;
        });

        self.today = (new Date()).toLocaleDateString();
        self.deadline = ko.computed(function () {
            var now = new Date();
            var share = self.selectedShare();
            if(share === undefined) return now.toLocaleDateString();
            var subscription = share.selectedSubscription();
            if(subscription === undefined) return now.toLocaleDateString();
            return (new Date(now.getTime() + subscription.timespan())).toLocaleDateString();
        });
        
      self.deliveries= ko.computed(function(){
        var share = self.selectedShare();
            if(share === undefined) return 0;
            var subscription = share.selectedSubscription();
            if(subscription === undefined) return 0;
            return subscription.deliveries();
      });
        self.ready(true);
    };   
    
    // Extended properties for bases
    var extend = {
        // Data mapping configuration for CRUD
        mapping: {
            'shares': {
                create: function (options) {
                    if (options.data)
                        return new shareData(options.data, self);
                    else
                        return ko.observableArray([]);
                }
            }
        }
    };

    self.init.apply(self, [extend]);

    // Map data to model, skus have no CRUD operations.
    if(data) {
      self.fromJS.apply(self, [data]);
      self.configure();
    } else {
      self.load.apply(self).done(function(res) {
        self.configure();
      });
    }
  };

  skuDataViewModel.prototype = new modelVM("/skus/get");

  return skuDataViewModel;
});
