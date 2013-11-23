require(['knockout', 'jquery', 'farmFormVM', 'skuFormVM', 'bootstrap', 'knockout.preview', 'knockout.fileupload', 'knockout.lazy'], function (ko, $, farmFormVM, skuFormVM) {
  $(function() {
    var ui = {
      action : "create",               
      skuForm : $("#sku-form"),
      subscriptionForm : $("#subscription-form"),
      shareForm : $("#share-form"),      
      progressDialog : $("#progress-dialog"),
      map : document.getElementById("map_canvas")
    };

    // Initialize Knockout
    ko.applyBindings({                
        farmForm : new farmFormVM(ui),
        skuForm : new skuFormVM(ui)
      });
    });
});
