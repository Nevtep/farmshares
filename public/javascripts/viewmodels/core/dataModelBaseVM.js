// Base model viewmodel class
define(['knockout', 'mappedVM'], function(ko, base) {
  var dataModelBaseViewModel = function(readUrl) {
    var self = this;

      // Instance model
    var properties = {
        __rawModel: null,
        readUrl: readUrl
    }
// Data Functions
        // TODO: get the model only once taking into account jqXHR must be returned
        self.__getModel = function (viewModel) {
            return $.getJSON(viewModel.readUrl + "/model", function (data) {
                if (data) {
                    if (typeof data === String)
                        self.fromJSON.apply(viewModel, [data]);
                    else
                        self.fromJS.apply(viewModel, [data]);
                }
                console.log("model loaded")
            });
        }

        // Search functions
        self.find = function (filter, parameters) {
            return $.getJSON(this.readUrl + "/" + filter, parameters);
        }
        
        self.load = function(){
          // Get reference to the current context
          var viewModel = this;
          
          if (self.__rawModel != null) {
            // TODO: return jqXHR
              return self.fromJS.apply(viewModel, [self.__rawModel]);
            } else {
                return self.__getModel(viewModel);
            }
        }
    self.init.apply(self, [properties]);
  }

  dataModelBaseViewModel.prototype = new base();

  return dataModelBaseViewModel;
});
