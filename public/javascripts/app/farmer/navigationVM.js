define(['knockout', 'accountDataVM'], function (ko, accountData) {
    return function navigationViewModel(ui) {
        var self = this;

        self.account = new accountData(ui.accountId);
        self.selectedFarm = ko.observable();
        
        
    };
});