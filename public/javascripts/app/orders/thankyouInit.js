require(["simpleCart", "googleAnalytics"], function (simpleCartm,ga) {
  $(function () {
    // Empty the cart
    simpleCart.empty();    
    simpleCart.init();    
  });
});