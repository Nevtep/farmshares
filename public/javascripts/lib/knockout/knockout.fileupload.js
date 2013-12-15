define(['knockout', 'jquery', 'jquery.fileupload', 'jquery.fileupload-process', 'jquery.fileupload-image'], function (ko, $) {
    ko.bindingHandlers.fileUploader = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // This will be called when the binding is first applied to an element
            // Set up any initial state, event handlers, etc. here
            var options = ko.utils.unwrapObservable(valueAccessor());
            $(element).fileupload(options);
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // This will be called once when the binding is first applied to an element,
            // and again whenever the associated observable changes value.
            // Update the DOM element based on the supplied values here.
        }
    };
})