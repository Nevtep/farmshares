require(['knockout', 'jquery', 'shareholdingsDispatchVM', 'bootstrap', 'knockout.lazy'], function (ko, $, shareholdingsDispatch) {
    $(function () {
        var ui = {
            accountId: $("#account-id").val()
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new shareholdingsDispatch(ui)
        });
    });
});