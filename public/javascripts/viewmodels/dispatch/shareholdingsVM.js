define(['knockout', 'jquery'], function (ko, $) {
    return function shareholdingsDispatchViewModel(ui) {
        var self = this;

        self.shareholdings = ko.observableArray();
        
        self.load = function (accountId) {
            return $.getJSON("/order/dispatch/shareholdings/" + accountId, function (shareholdings) {
                self.shareholdings(shareholdings);
            });
        }

        self.load(ui.accountId);
    }
});