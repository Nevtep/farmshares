define(["knockout", "simpleCart"], function(ko, simpleCart) {
  return function cartDataVM() {
    var self = this;       
    
    self.farms = ko.observableArray();
    
    self.writeCart = function() {      
      var farms = {};
      var farmsArray = [];
      simpleCart.each(function(item, index){
        if(farms[item.get("farm")] === undefined)
        {
          farms[item.get("farm")] = {
            name:item.get("farm"),
            items:[],
            content:simpleCart.$create("div"),
            total:0
          };
        }      
        // function (item, y, TR, TD, container)
        var itemRow = simpleCart.createCartRow(item,farms[item.get("farm")].items.length, "div", "div", farms[item.get("farm")].content);     
        
        farms[item.get("farm")].items.push(itemRow);
        farms[item.get("farm")].total += item.total();
      });

      for(var key in farms)
        if(hasOwnProperty.call(farms, key)){
          farms[key].total = simpleCart.toCurrency(farms[key].total);
          farmsArray.push(farms[key]);
        };
      
      self.farms(farmsArray);
    };
    
    self.writeCart();
    
    simpleCart.bind('update', self.writeCart);
  };
});