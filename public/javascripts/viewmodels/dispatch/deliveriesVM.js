define(['knockout', 'jquery'], function (ko, $) {
    return function deliveryPlanDispatchViewModel(ui) {
        var self = this;

        self.deliveries = ko.observableArray();

        self.load = function (filters) {
            return $.post("/order/dispatch/deliveries/", filters,function (deliveries) {
                self.deliveries(deliveries);
            }, 'json');
        }

        self.load(ui.filters);
    }
});