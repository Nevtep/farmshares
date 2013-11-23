// Base mapped viewmodel class
define(['knockout', 'knockout.mapping', 'baseVM'], function(ko, koMapping, base) {
  var mappedBaseViewModel = function() {
    var self = this;

    // Default Mapping options
    var defaults = {
        mapping: {}
    }

    // Data functions
    self.toJS = function() {
      return koMapping.toJS(this, this.mapping);
    }

    self.toJSON = function() {
        return koMapping.toJSON(this, this.mapping);
    }

    self.fromJS = function(data) {
        koMapping.fromJS(data, this.mapping, this);
    };
    self.fromJSON = function(data) {
        koMapping.fromJSON(data, this.mapping, this);
    };

    self.init.apply(self, [defaults]);
  }

  mappedBaseViewModel.prototype = new base();

  return mappedBaseViewModel;
});
