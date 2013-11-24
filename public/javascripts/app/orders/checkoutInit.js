require(["jquery", "knockout", "checkoutPageVM", "stripe", "simpleCart", "googleAnalytics", "crazyEgg", "jquery.ellipsis"], function ($, ko, checkoutPage, Stripe, simpleCart, ga) {
  $(function () {
    // Configure Stripe
    Stripe.setPublishableKey('pk_live_zHUvBd7yf07wnfnU6oF6CU7H');
    //Stripe.setPublishableKey('pk_test_9DAbo6ovvgf44ZlRiADGc5Vm');

    // Configure Simplecart
    simpleCart({
        checkout: {
            type: "SendForm",
            url: "/checkout"
        },
        cartColumns: [
            { attr: "quantity", label: false },
            { attr: "title", label: false },
            { attr: "total", label: false, view: 'currency' },
        ]
    });
    
    simpleCart.init();
    // Bind viewmodel
    var checkoutVM = new checkoutPage();
    ko.applyBindings(checkoutVM);
    
    $(".item-title").ellipsis();
        
  });
});