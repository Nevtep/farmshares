require(['knockout', 'jquery', 'dispatchDeliveriesVM', 'bootstrap', 'knockout.lazy'], function (ko, $, dispatchDeliveries) {
    $(function () {
        var ui = {            
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new dispatchDeliveries(ui)
        });
    });
});