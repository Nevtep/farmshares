require(['knockout', 'jquery', 'deliveryPlanDispatchVM', 'jquery-ui', 'knockout.jqueryui', 'knockout.lazy'], function (ko, $, deliveryPlanDispatch) {
    $(function () {
        var ui = {
            accountId: $("#account-id").val()
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new deliveryPlanDispatch(ui)
        });
    });
});