require(['knockout', 'jquery', 'simpleCart', 'cartPageVM', "googleAnalytics", "crazyEgg", 'bootstrap'], function (ko, $, simpleCart, cartPage,ga) {
    $(function () {
      // Configure Simplecart
      simpleCart({
          cartColumns: [
            { view: function(item,column){
                return '<img src="' + item.get('image') + '" class="img-rounded thumb"/><span class="text14 black bold">' +
                  item.get('title') + ' - ' + item.get('shareamount') + ' ' + item.get('shareunit') +
                  '</span>'
              },
              attr: 'description'
            },
            { attr: 'price', view: 'currency', className: 'text14 black bold' },
            { view: function(item,column){
               return "<input type='text' value='" + item.get(column.attr) + "' class='simpleCart_input input-mini text-center'/>";
              },
              attr: 'quantity' },
            { view: function(item,column){
              return "<select class='input-medium' data-bind=\"options: $root.subscriptionForShare('"+item.get("shareid")+"'),"
              + "optionsText: 'name', optionsValue: '_id', optionsAfterRender: function(option, item) { $root.selectSubscription(option, item._id == '"+item.get("subscriptionid")+"') },"
                  + "event: { change: function(data, event){ $root.setSubscription('"+item.id()+"', '"+item.get("shareid")+"', $(event.target)[0].selectedIndex); } }\" />"                 
              },
             attr: 'subscription' },
            { attr: 'total', view: 'currency', className: 'text14 black bold' },
            { view: 'remove', className: 'text14 black bold' }
          ]
      });      
      
      simpleCart.init();
      // Bind viewmodel
      var cartVM = new cartPage();
      ko.applyBindings(cartVM);
      
    });
});

