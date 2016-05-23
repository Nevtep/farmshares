require(['knockout', 'jquery', 'dispatchOrdersVM', 'bootstrap', 'knockout.lazy'], function (ko, $, dispatchOrders) {
    $(function () {
    	var now = new Date();
        var ui = {    
          filters: {}
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new dispatchOrders(ui)
        });
    });
});