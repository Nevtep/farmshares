define(['knockout', 'mainPageVM', 'farmDataVM', 'simpleCart', 'knockout.lazy', 'bootstrap'], function (ko, mainPage, farmData, simpleCart) {
    var farmPageVM = function (ui) {
        var self = this;
      
        self.farm = new farmData(ui.fname);
        self.selectedImage = ko.observable();
        self.showingImage = ko.observable();
        self.showingVideo = ko.computed(function () {
            return !self.showingImage();
        });

        self.showVideo = function () {
            self.showingImage(false);
        };
        self.showImage = function (image) {
            self.selectedImage(image);
            self.showingImage(true);
        };

        self.farm.ready.subscribe(function (newValue) {
            if(!self.farm.hasVideo)
                self.showImage(self.farm.thumbnails()[0])
            /*if (self.farm.location.country.name().toLowerCase() == "chile")
                self.setCurrency({
                    code: "CLP",
                    name: "Pesos Chilenos",
                    symbol: "CLP ",
                    delimiter: ".",
                    decimal: ",",
                    after: false,
                    accuracy: 2
                });*/
        });
      
      self.showAddItemMessage = function(data, evt){
        $(evt.currentTarget).parents("li").children(".alert").fadeIn()
        setTimeout(function(){$(evt.currentTarget).parents("li").children(".alert").fadeOut()},1000);
      }
      
      simpleCart.bind('afterAdd', function(item){
         $(".simpleCart_quantity").animate({"font-weight":"bolder","font-size":"18px"},500)
         $(".simpleCart_quantity").animate({"font-weight":"normal","font-size":"12px"},1000)
         var add = $("<div>").css({"position":"absolute","left":"35px","top":"10px"}).addClass("bold").addClass("blue").text("+1");
         $(".simpleCart_quantity").parents("li").append(add);
        add.animate({"top":"-15px","opacity":"0"},1000);
       });
    };

    farmPageVM.prototype = new mainPage();

    return farmPageVM;
});