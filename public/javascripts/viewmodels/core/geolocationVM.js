define(['knockout', 'baseVM', 'async!https://maps.google.com/maps/api/js?sensor=false'], function (ko, base) {
    var geolocationViewModel = function () {
        var self = this;

        // Instance Properties
        var properties = {
          locations: ko.observableArray(),
          codingAddress: {},
          mapOptions: {
            center: new google.maps.LatLng(-33.8688, 151.2195),
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          },
          map: null
        }
        
         // Geolocation Wrappers
        self.locationChanged = function (data, event) {
          self.codingAddress = data;
          var address = event.target.value;
          console.log("Geocoding address", address);
          // use geocoder from prototype
          self.geocoder.geocode({
            'address': address
          }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {                    
              self.locations(results);
              var list = $(event.target).siblings("#locations").children().first();
              list.css("display","block");
            } else {
              console.log('Geocode was not successful for the following reason: ' + status);
            }
          });
          return true;
        };

        // define geocoder at prototype
        self.geocoder = new google.maps.Geocoder()

        // set instance map
        self.setMapCanvas = function (canvasElement) {
            this.map = new google.maps.Map(canvasElement, this.mapOptions);

            // Determinar para que están estos.
            var infowindow = new google.maps.InfoWindow();
            var marker = new google.maps.Marker({
                map: this.map
            });
        }
        
        self.setLocation = function(locationObj, event){
          var location = self.codingAddress;
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
          $(event.target.parentElement.parentElement).css("display","none");
        };

        self.init.apply(self, [properties]);
    }

    geolocationViewModel.prototype = new base();

    return geolocationViewModel;
});
