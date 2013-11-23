// Base viewmodel class
define([], function () {
    return function baseViewModel() {
        var self = this;

        self.init = function (options) {
            if (options) {
                for (key in options) {
                    if (typeof this[key] === 'function') {
                        this[key](options[key]);
                    } else {
                        this[key] = options[key];
                    }
                }
            }
        };
    };
});