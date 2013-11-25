define(['knockout', 'jquery'], function (ko, $) {
    return function deliveryPlanDispatchViewModel(ui) {
        var self = this;

        self.deliveries = ko.observableArray();

        self.load = function () {
            return $.getJSON("/order/dispatch/deliveries/", function (deliveries) {
                self.deliveries(deliveries);
            });
        }

        self.load();
    }
});