define(['knockout', 'jquery', 'knockout.mapping', 'skuDataVM', 'shareFormVM',  'knockout.validation'], function (ko, $, koMapping, skuData, shareForm) {
    return function skuFormViewModel(ui) {
        // get reference to this context.
        var self = this;
        // Data view model
        self.skuData = ko.observable(new skuData());
        // Keep track of the sku being edited
        self.editingSKU = null;
        
        // Initialize a new sku for creation
        self.createSKU = function () {
            self.editingSKU = null;
            self.skuData(new skuData());            
        }

        // Load an existing sku for edition
        self.editSKU = function (sku) {
            self.editingSKU = sku;
            self.skuData(new skuData(koMapping.toJS(sku)))
        }

        // Add current sku to the farm if valid.
        self.addSKU = function (farm) {
            if(self.skuData().isValid())
            {
              // Add to the farm's skus              
              if(self.editingSKU == null)  
                farm().skus.push(self.skuData());
              else{
                // Update the sku with the current data
                var rawData = koMapping.toJS(self.skuData());
                koMapping.fromJS(rawData, self.editingSKU);
                $.each(self.skuData().shares(), function(index, share){
                  self.editingSKU.shares()[index].uploads = share.uploads;
                });
              }
              
              self.hideModal();
            }
        }

        self.hideModal = function(){
          ui.skuForm.modal('hide')
        };
        self.shareForm = new shareForm(ui);
        self.createShare = function(){
          self.shareForm.createShare(); 
        }
    };
});