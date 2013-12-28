define(['knockout', 'geolocationVM', 'farmDataVM', 'statusDataVM', 'knockout.validation'], function (ko, geolocationVM, farmData, statusData) {
    var farmFormViewModel = function(ui) {
      // get reference to this context.
        var self = this;

        // Allow for parameterless constructor
        ui = ui || {};
        // TODO: Validate UI options
          
        // Configure data
        var farm;
        if (ui.action == "edit")
            farm = new farmData(ui._id);
        else
            farm = new farmData();

        // Data View Model
        self.farmData = ko.observable(farm);
        
        // Configure the form.
        

        // Saving status info
        self.saveStatus = new statusData();
        self.saving = ko.computed(function () {
            return !(self.saveStatus.totalTasks() == self.saveStatus.completedTasks());
        });
      self.saving.subscribe(function(saving){
        ui.progressDialog.modal(saving ? 'show' : 'hide');
      });
        // Initialize geolocation if given a map
        if(ui.map) {
            self.setMapCanvas.apply(self, [ui.map]);            
            self.codingAddress = self.farmData().location;
          }

        // CRUD Wrappers
        self.createFarm = function () {             
          var farm = self.farmData();
          if (farm.isValid() && farm.farmer.isValid() && farm.location.isValid()) {
              // Initialize saveStatus
              self.saveStatus.reset();              
              // Add create task
              self.saveStatus.totalTasks(1);
              farm.create().done(function (res) {
                  // redirect on success
                  self.saveStatus.status.subscribe(function (status) {
                      if(status == "success") {
                          var redirect = window.location.origin + "/farms/view/" + res.farm.slug;
                          window.location.replace(redirect)
                      }
                  });
                  // Upload tasks
                  var tasks = farm.uploads().length;
                  $.each(farm.skus(), function (index, item) {
                    $.each(item.shares(), function (index, item) {
                      tasks += item.uploads().length;
                    })
                  });
                  self.saveStatus.totalTasks(tasks + 1);
                  self.saveStatus.doneTasks(1);
                  // Upload Gallery and Logo
                  for (var p = 0, q = farm.uploads().length; p < q; p++) {
                      farm.uploads()[p].formData = { 'farm-slug': res.farm.slug };
                      farm.uploads()[p].submit().done(function (res) {
                          var data = res.d;
                          self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                      }).fail(function (jqXHR, textStatus, errorThrown) {
                          self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                          // TODO: handle errors
                      });
                  };                  
                if(farm.logoUpload()[0]){
                  farm.logoUpload()[0].formData = { 'farm-slug': res.farm.slug };
                  farm.logoUpload()[0].submit().done(function (res) {
                    var data = res.d;
                    self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                  }).fail(function (jqXHR, textStatus, errorThrown) {
                    self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                    // TODO: handle errors
                  });
                }

                  // Upload shares gallery
                  $.each(farm.skus(), function(index, sku){
                  var shares = sku.shares();
                  for (var i = 0, j = shares.length; i < j; i++) {
                      var share = shares[i];
                      for (var p = 0, q = share.uploads().length; p < q; p++) {
                          share.uploads()[p].formData = { 'farm-slug': res.farm.slug, 'share-id': share._id(), 'sku-id': sku._id() };
                          share.uploads()[p].submit().done(function (res) {
                              var data = res.d;
                              self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                          }).fail(function (jqXHR, textStatus, errorThrown) {
                              self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                              // TODO: handle errors
                          });
                      };
                  };
                  });
              }).fail(function (jqXHR, textStatus, errorThrown) {
                  self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                  // TODO: handle errors
              });              
          } else {
              // TODO: Show errors              
          }
        };

        self.updateFarm = function () {
            var farm = self.farmData();
            if (farm.isValid() && farm.farmer.isValid() && farm.location.isValid()) {
                // Initialize saveStatus
                self.saveStatus.reset();
                // Add update task
                self.saveStatus.totalTasks(1);
                farm.update().done(function (res) {
                    // Redirect on success
                    self.saveStatus.status.subscribe(function (status) {
                        if (status == "success") {
                            var redirect = window.location.origin + "/farms/view/" + res.farm.slug;
                            window.location.replace(redirect)
                        }
                    });
                    // Upload tasks
                    var tasks = farm.uploads().length;
                    $.each(farm.skus(), function (index, item) {
                      $.each(item.shares(), function (index, item) {
                        tasks += item.uploads().length;
                      })
                    });
                    self.saveStatus.totalTasks(tasks + 1);
                    self.saveStatus.doneTasks(1);
                    // Upload Gallery and Logo
                    for (var p = 0, q = farm.uploads().length; p < q; p++) {
                        farm.uploads()[p].formData = { 'farm-slug': res.farm.slug };
                        farm.uploads()[p].submit().done(function (res) {
                            var data = res.d;
                            self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                        }).fail(function (jqXHR, textStatus, errorThrown) {
                            self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                            // TODO: handle errors
                        });
                    };                    
                    if(farm.logoUpload()[0]){
                      farm.logoUpload()[0].formData = { 'farm-slug': res.farm.slug };
                      farm.logoUpload()[0].submit().done(function (res) {
                        var data = res.d;
                        self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                      }).fail(function (jqXHR, textStatus, errorThrown) {
                        self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                        // TODO: handle errors
                      });
                    }
                  
                    // Upload shares gallery
                    $.each(farm.skus(), function(index, sku){
                      var shares = sku.shares();
                      for (var i = 0, j = shares.length; i < j; i++) {
                          var share = shares[i];
                          for (var p = 0, q = share.uploads().length; p < q; p++) {
                              share.uploads()[p].formData = { 'farm-slug': res.farm.slug, 'share-id': share._id(), 'sku-id': sku._id() };
                              share.uploads()[p].submit().done(function (res) {
                                  var data = res.d;
                                  self.saveStatus.doneTasks(self.saveStatus.doneTasks() + 1);
                              }).fail(function (jqXHR, textStatus, errorThrown) {
                                  self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                                  // TODO: handle errors
                              });
                          };
                      };
                      });
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    self.saveStatus.failedTasks(self.saveStatus.failedTasks() + 1);
                    // TODO: handle errors
                });
                } else {
                // TODO: Show errors              
                }
        };
        
        // Image gallery callbacks for Jquery Fileupload plugin
        self.addImageToFarm = function (e, data) {
            self.farmData().uploads.push(data);
        }  
        
        self.addLogoToFarm= function (e, data) {
          self.farmData().logoUpload.removeAll()
          self.farmData().logoUpload.push(data);
        }  
    };
    
    // Inherit geolocation functionality.
    farmFormViewModel.prototype = new geolocationVM();
    
    return farmFormViewModel;
});