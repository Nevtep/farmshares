define(['knockout', 'jquery'], function (ko, $) {
    return function orderDispatchViewModel(ui) {
        var self = this;

        self.orders = ko.observableArray();

        self.load = function (filters) {
            return $.post("/order/dispatch/orders/",{filters: filters},function (orders) {
                self.orders(orders);
            }, 'json');
        };

        self.load(ui.filters);
    };
});