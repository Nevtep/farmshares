define(['knockout', 'jquery', 'knockout.mapping', 'subscriptionDataVM', 'knockout.validation'], function (ko, $, koMapping, subscriptionData) {
    return function subscriptionFormViewModel(ui) {
        // get reference to this context.
        var self = this;
        // Data view model
        self.subscriptionData = ko.observable(new subscriptionData());
        // Keep track of the subscription being edited
        self.editingSubscription = null;
        
        // Initialize a new subscription for creation
        self.createSubscription = function () {
            self.editingSubscription = null;
            self.subscriptionData(new subscriptionData());            
        }

        // Load an existing subscription for edition
        self.editSubscription = function (subscription) {
            self.editingSubscription = subscription;
            self.subscriptionData(new subscriptionData(koMapping.toJS(subscription)))
        }

        // Add current subscription to the sku if valid.
        self.addSubscription = function (sku) {
            if(self.subscriptionData().isValid())
            {
              // Add to the sku's subscriptions              
              if(self.editingSubscription == null)  
                sku().subscriptions.push(self.subscriptionData());
              else{
                // Update the subscription with the current data
                var rawData = koMapping.toJS(self.subscriptionData());
                koMapping.fromJS(rawData, self.editingSubscription);
              }
              
              self.hideModal();
            } 
        }
        
        self.hideModal = function(){
          ui.subscriptionForm.modal('hide')
        }
    };
});