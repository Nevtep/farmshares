define(['knockout', 'jquery'], function (ko, $) {
    return function deliveryScheduleDispatchViewModel(ui) {
        var self = this;

        self.deliveries = ko.observableArray();

        self.load = function (accountId) {
            return $.getJSON("/order/dispatch/delivery/schedule/" + accountId, function (deliveries) {
                self.deliveries(deliveries);
            });
        }

        self.load(ui.accountId);
    }
});