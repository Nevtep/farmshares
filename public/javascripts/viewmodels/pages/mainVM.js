define(["jquery", "knockout", "simpleCart"], function ($, ko, simpleCart) {
    return function mainPageViewModel() {        
        // TODO: implement a generic way for pages to define currency
        /*self.setCurrency = function (currency) {
        simpleCart.currency(currency);
        }*/

        // Init Simplecart
        simpleCart({
            checkout: {
                type: "SendForm",
                url: "/checkout"
            }
        });
        // OnDOMReady
        $(function () {
            simpleCart.init();
        });
    }
});