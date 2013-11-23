require(['knockout', 'jquery', 'wholesalesDispatchVM', 'jquery-ui', 'knockout.jqueryui', 'knockout.lazy'], function (ko, $, wholesalesDispatch) {
    $(function () {
        var ui = {
            accountId: $("#account-id").val(),
            farmId: $("#farm-id").val()
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new wholesalesDispatch(ui)
        });
    });
});