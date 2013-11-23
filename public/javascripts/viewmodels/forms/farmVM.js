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
            // subcribe to geocode to update location
            self.geocode.subscribe(function(locationObj){
              var location = self.farmData().location;
              // Format the field
              location.str(locationObj.formatted_address);
              // Add LONG/LAT since Mongo uses that format
              location.geometry()[0] = locationObj.geometry.location.lng();
              location.geometry()[1] = locationObj.geometry.location.lat();
              // Complete remaining info
              var address = locationObj.address_components;
              for (var i = address.length - 1; i >= 0; i--) {
                var which;
                switch (address[i].types[0]) {
                    case 'administrative_area_level_1':
                        which = "region";
                        break;

                    case 'administrative_area_level_2':
                        which = "state";
                        break;

                    case 'locality':
                        which = "city";
                        break;

                    case 'route':
                        which = "address"
                        break;

                    default: 
                        which = address[i].types[0];
                        break;
                }

                if (which === "address") {
                    location.address.street.main.name(address[i].long_name);
                } else if (which === "street_number") {
                    location.address.street.main.number(address[i].long_name);
                } else {
                    if (!location[which]) location[which] = {
                      name: ko.observable(),
                      shortname: ko.observable()
                    };
                    location[which].name(address[i].long_name);
                    location[which].shortname(address[i].short_name);                    
                }
            };
            })
          }

        // Geolocation Wrappers
        self.locationChanged = function (data, event) {
            self.codeAddress.apply(self, [data.location.str()])
            return true;
        };

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