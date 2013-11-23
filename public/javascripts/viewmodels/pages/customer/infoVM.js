define(['knockout', 'authenticationVM', 'geolocationVM'], function (ko, auth, geolocationVM) {
    var customerInfoPageVM = function() {
      var self= this;
      
      self.customer = auth.account;
      
      self.ready = ko.computed(function(){
        return self.customer.ready()
      });
      self.copyAddress = ko.observable(false);
      self.notCopyAddress = ko.computed(function(){
        return !self.copyAddress();
      });
      
      self.customer.ready.subscribe(function(ready){
        if(ready)
          self.copyAddress(self.customer.billing_address.str() == self.customer.shipping_address.str());
      });
      // Geocoding
      self.geocode.subscribe(function (locationObj) {
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
      // Geolocation Wrappers
      self.codingAddress = null;
      self.locationChanged = function (data, event) {
        self.codingAddress = data;
        self.codeAddress.apply(self, [data.str()])
        return true;
      };
      
      self.updateInfo = function(data,evt){
        if (self.copyAddress())
          auth.account.shipping_address.fromJS(auth.account.billing_address.toJS());
        
        $.post("/customer/update", self.customer.toJS(),function(response) {
          $("#success").fadeIn().delay(10000).fadeOut(5000);
        },'json')
      };
    };
  
  customerInfoPageVM.prototype = new geolocationVM();
  
  return customerInfoPageVM;
});