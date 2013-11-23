require(['knockout', 'jquery', 'deliveryScheduleDispatchVM', 'bootstrap', 'knockout.lazy'], function (ko, $, deliveryScheduleDispatch) {
    $(function () {
        var ui = {
            accountId: $("#account-id").val()
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new deliveryScheduleDispatch(ui)
        });
    });
});