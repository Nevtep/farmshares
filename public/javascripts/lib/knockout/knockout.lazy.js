define(['knockout'], function (ko) {
	// Waint until the value get's updated to load descendant bindings
	ko.bindingHandlers.when = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// This will be called when the binding is first applied to an element
			// Set up any initial state, event handlers, etc. here			
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			// This will be called once when the binding is first applied to an element,
			// and again whenever the associated observable changes value.
			// Update the DOM element based on the supplied values here.
			var value = valueAccessor();
			if(value())
				ko.applyBindingsToDescendants(bindingContext, element);
		}
	};
	ko.virtualElements.allowedBindings.when = true;
})