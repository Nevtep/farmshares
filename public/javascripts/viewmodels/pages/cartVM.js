define(["jquery", "knockout", "cartDataVM", "simpleCart", "knockout.lazy", "bootstrap"], function ($, ko, cartData, simpleCart) {
    return function cartPageVM() {
      var self = this;
      
      self.cart = new cartData();
      self.subscriptionSource = {};
      
      self.subscriptionForShare = function(shareid){
        if(!hasOwnProperty.call(self.subscriptionSource, shareid)){
          self.subscriptionSource[shareid] = ko.observableArray();
          $.getJSON('/subscriptions/get/shareid', {
                shareid: shareid
            }, function (data) {
                self.subscriptionSource[shareid](data);
            });
        };
        return self.subscriptionSource[shareid];
      };
      
      self.bindSubscriptions = function(element, index, data){
        $(element[3].children).each(function(index,row){
          ko.applyBindings(self,row);
        });
      };
      
      self.setSubscription = function(itemid, shareid, subscriptionindex) {
        var item = simpleCart.find(itemid);
        var subscription = self.subscriptionSource[shareid]()[subscriptionindex];
        var unitPrice = (item.get('shareprice') / 100) * item.quantity();
        var total = unitPrice * subscription.deliveries;
        var discount = Math.round(subscription.discount * total / 100);
        item.price(total - discount);
        item.set('subscriptionid', subscription._id);
        item.set('subscriptionname', subscription.name);
        item.set('subscriptiondeliveries', subscription.deliveries);
        item.set('subscriptiondiscount', subscription.discount);
        simpleCart.update();
      };
      
      self.selectSubscription = function(option, selected){
        if(selected)
          $(option).attr("selected",true);
        else
          $(option).removeAttr("selected");
      };          
    };
});