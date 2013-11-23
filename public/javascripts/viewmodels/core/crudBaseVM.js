// Base CRUD viewmodel class
define(['knockout', 'knockout.mapping', 'jquery', 'modelVM'], function (ko, koMapping, $, base) {
    var crudBaseViewModel = function (crudUrls) {
        var self = this;
        
        self.__getData = function (viewModel) {
            return $.getJSON(self.readUrl, {
                id: viewModel._id
            }, function (data) {
                if (data) {
                    if (typeof data === String)
                        self.fromJSON.apply(viewModel, [data]);
                    else
                        self.fromJS.apply(viewModel, [data]);
                }
                console.log("data loaded")
            });
        }
        
        // CRUD functions
        self.read = function (_id) {
            if (!self.readUrl)
                throw {
                    message: "readUrl not configured"
                };
            // get reference to viewModel context
            var viewModel = this;
            if (_id != null) {
                viewModel._id = _id;
                return self.__getData(viewModel);
            } else {
              // Load the model raw data
              return self.load.apply(viewModel);
            }
        }

        self.create = function () {
            if (!this.createUrl)
                throw {
                    message: "createUrl not configured"
                };
            return $.post(this.createUrl, self.toJS.apply(this), function (res) {
                console.log("create successfully");
            }, 'json');
        }

        self.update = function () {
            if (!this.updateUrl)
                throw {
                    message: "updateUrl not configured"
                };
            return $.post(this.updateUrl, self.toJS.apply(this), function (res) {
                console.log("update successfully");
            }, 'json');
        }

        self.destroy = function () {
            if (!this.destroyUrl)
                throw {
                    message: "destroyUrl not configured"
                };
            return $.post(this.destroyUrl, self.toJS.apply(this), function (res) {
                console.log("destroy successfully");
            }, 'json');
        }

        self.init.apply(self, arguments);
    }

    crudBaseViewModel.prototype = new base();

    return crudBaseViewModel;
});
