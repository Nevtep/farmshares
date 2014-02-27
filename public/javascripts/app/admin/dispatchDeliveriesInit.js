require(['knockout', 'jquery', 'dispatchDeliveriesVM', 'bootstrap', 'knockout.lazy'], function (ko, $, dispatchDeliveries) {
    $(function () {
    	var now = new Date();
        var ui = {    
          filters: {}
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new dispatchDeliveries(ui)
        });
    });
});