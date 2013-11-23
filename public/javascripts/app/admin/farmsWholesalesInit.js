require(['knockout', 'jquery', 'wholesalesDispatchVM', 'bootstrap', 'knockout.lazy'], function (ko, $, wholesalesDispatch) {
    $(function () {
        var ui = {
            farmId: $("#farm-id").val()
        };

        // Initialize Knockout
        ko.applyBindings({
            dispatch: new wholesalesDispatch(ui)
        });
    });
});