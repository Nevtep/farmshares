define(['knockout', 'jquery', 'knockout.mapping', 'shareDataVM', 'subscriptionFormVM', 'knockout.validation'], function (ko, $, koMapping, shareData, subscriptionForm) {
    return function shareFormViewModel(ui) {
        // get reference to this context.
        var self = this;
        // Data view model
        self.shareData = ko.observable(new shareData());
        // Keep track of the share being edited
        self.editingShare = null;
        
        // Initialize a new share for creation
        self.createShare = function () {
            self.editingShare = null;
            self.shareData(new shareData());            
        }

        // Load an existing share for edition
        self.editShare = function (share) {
            self.editingShare = share;
            self.shareData(new shareData(koMapping.toJS(share)))
        }

        // Add current share to the sku if valid.
        self.addShare = function (sku) {
            if(self.shareData().isValid())
            {
              // Add to the SKU's shares              
              if(self.editingShare == null)  
                sku().shares.push(self.shareData());
              else{
                // Update the share with the current data
                var rawData = koMapping.toJS(self.shareData());                
                koMapping.fromJS(rawData, self.editingShare);
                self.editingShare.uploads = self.shareData().uploads;
              }
              
              self.hideModal();
            } 
        }
        
        self.hideModal = function(){
          ui.shareForm.modal('hide')
        }
        
        // Image gallery callbacks for Jquery Fileupload plugin
        self.addImageToEditingShare = function (e, data) {
          self.shareData().uploads.removeAll();
          self.shareData().uploads.push(data);
        }
        
        self.subscriptionForm = new subscriptionForm(ui);
        self.createSubscription = function(){
           self.subscriptionForm.createSubscription(); 
        }
    };
});