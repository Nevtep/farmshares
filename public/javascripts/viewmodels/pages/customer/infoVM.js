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