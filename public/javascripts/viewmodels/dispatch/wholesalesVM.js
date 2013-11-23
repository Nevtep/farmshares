define(['knockout', 'jquery'], function (ko, $) {
    return function wholesalesDispatchViewModel(ui) {
        var self = this;

        self.wholesales = ko.observableArray();

        self.load = function (farmId) {
            return $.getJSON("/order/dispatch/wholesales/" + farmId, function (wholesales) {
                self.wholesales(wholesales);
            });
        }

        self.load(ui.farmId);
    }
});
