// Share view model
define(['knockout', 'modelVM'], function(ko, modelVM) {
  var subscriptionDataViewModel = function(data) {
    var self = this;

    // Lazy loading flag
    self.ready = ko.observable(false);

    // configure the model after being mapped
    self.configure = function () {
        // Validations
        self.name.extend({required:{ params: true, message:"Enter a display name"}});
        self.deliveries.extend({
            required: {
                params: true,
                message: "Enter the amount of deliveries"
            }
        });

        self.errors = ko.validation.group({
            SubscriptionName: self.name,
            SubscriptionDeliveries: self.deliveries
        });

        self.isValid = ko.computed(function () {
            return self.errors().length === 0;
        });        

        self.ready(true);
    };    

    // Map data to model, subscriptions have no CRUD operations.
    if(data) {
      self.fromJS.apply(self, [data]);
      self.configure();
    } else {
      self.load.apply(self).done(function(res) {
        self.configure();
      });
    }
  };

  subscriptionDataViewModel.prototype = new modelVM("/subscriptions/get");

  return subscriptionDataViewModel;
});
