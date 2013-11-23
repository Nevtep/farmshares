// Main viewmodel class
define(['knockout', 'crudBaseVM', 'accountDataVM', 'skuDataVM', 'locationDataVM', 'knockout.validation'], function(ko, crudBaseVM, farmerData, skuData, locationData) {
  var farmDataViewModel = function(_id) {
    // get reference to this context.
    var self = this;

    // Lazy loading flag
    self.ready = ko.observable(false);        
    
    // Extended properties for bases
    var extend = {
        // Data mapping configuration for CRUD
        mapping: {
            'include': ['farmer'],
            'skus': {
                create: function (options) {
                    if (options.data)
                        return new skuData(options.data);
                    else
                        return ko.observableArray([]);
                }
            },
            'farmer': {
                create: function (options) {
                    // Initialize Account Model
                    return new farmerData(options.data);
                }
            },
            'location': {
                create: function (options) {
                    return new locationData(options.data);
                }
            }
        }
    };

    self.init.apply(self, [extend]);

    // Map data using mapping plugin get the raw model for null IDs
    self.read.apply(self, [_id]).done(function(res) {
      // Validations
      self.name.extend({
        required : {
          params : true,
          message : "Enter a farm name"
        }
      });

      self.errors = ko.validation.group({
        FarmName : self.name
      })

      self.isValid = ko.computed(function() {
        return self.errors().length === 0;
      })

      self.hasVideo = self.video() != null && self.video() != "";
      self.videoUrl = "https://www.youtube.com/embed/" + self.video() + "?origin=https://www.farmshares.com/farms/" + self.slug();
      self.videoThumbnail = "http://img.youtube.com/vi/" + self.video() + "/hqdefault.jpg";
      var thumbnailsLength = self.hasVideo ? 10 : 12;
      self.thumbnails = self.gallery().length > thumbnailsLength ? ko.observableArray(self.gallery.slice(0, thumbnailsLength)) : self.gallery;
      
      self.ready(true)
    });
    // File uploading interface
    self.uploads = ko.observableArray();
    self.logoUpload = ko.observableArray();
    self.farmer = new farmerData()
  };
  // Inherit and initialize CRUD
  farmDataViewModel.prototype = new crudBaseVM({
    createUrl : "/admin/farms/create",
    readUrl : "/farms/get",
    updateUrl: "/admin/farms/update",
    destroyUrl : "/admin/farms/delete"
  });

  return farmDataViewModel;
});
