require(['knockout', 'jquery', 'deliveryScheduleDispatchVM', 'jquery-ui', 'knockout.jqueryui', 'knockout.lazy'], function (ko, $, deliveryScheduleDispatch) {
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