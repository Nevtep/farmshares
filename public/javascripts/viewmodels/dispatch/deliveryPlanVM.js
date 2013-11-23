define(['knockout', 'jquery'], function (ko, $) {
    return function deliveryPlanDispatchViewModel(ui) {
        var self = this;

        self.deliveries = ko.observableArray();

        self.load = function (accountId) {
            return $.getJSON("/order/dispatch/delivery/plan/" + accountId, function (deliveries) {
                self.deliveries(deliveries);
            });
        }

        self.load(ui.accountId);
    }
});