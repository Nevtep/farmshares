define(['knockout', 'baseVM', 'async!https://maps.google.com/maps/api/js?sensor=false'], function (ko, base) {
    var geolocationViewModel = function () {
        var self = this;

        // Instance Properties
        var properties = {
            geocode: ko.observable(),
            mapOptions: {
                center: new google.maps.LatLng(-33.8688, 151.2195),
                zoom: 13,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            },
            map: null
        }

        // define geocoder at prototype
        self.geocoder = new google.maps.Geocoder()

        self.codeAddress = function (address) {
            console.log("Geocoding address", address);
            // get viewModel context
            var viewModel = this;
            // use geocoder from prototype
            self.geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (viewModel.map != null) {
                        viewModel.map.setCenter(results[0].geometry.location);
                        var marker = new google.maps.Marker({
                            map: viewModel.map,
                            position: results[0].geometry.location
                        });
                    }
                    viewModel.geocode(results[0]);
                } else {
                    console.log('Geocode was not successful for the following reason: ' + status);
                }
            });
        }

        // set instance map
        self.setMapCanvas = function (canvasElement) {
            this.map = new google.maps.Map(canvasElement, this.mapOptions);

            // Determinar para que están estos.
            var infowindow = new google.maps.InfoWindow();
            var marker = new google.maps.Marker({
                map: this.map
            });
        }

        self.init.apply(self, [properties]);
    }

    geolocationViewModel.prototype = new base();

    return geolocationViewModel;
});
