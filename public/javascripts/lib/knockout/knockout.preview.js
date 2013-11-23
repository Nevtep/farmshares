define(['knockout'], function (ko) {
	// Waint until the value get's updated to load descendant bindings
	ko.bindingHandlers.preview = {
     makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here
            
          var afterAdd = function(element, index, data){                                    
            var file= data.files[0];
            var ctx = $(element).find("#preview")[0].getContext('2d');
            var img = new Image;
            img.src = URL.createObjectURL(file);
            img.onload = function() {
              ctx.drawImage(img, 0,0);
            }            
          }
            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
              return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance, 'afterAdd' : afterAdd };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'] || afterAdd,
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['preview'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['preview'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
    }
	};
})