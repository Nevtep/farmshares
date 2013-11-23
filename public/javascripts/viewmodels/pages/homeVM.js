define(['knockout', 'jquery', 'mainPageVM', 'farmDataVM', 'skuDataVM', 'jquery.xml2json'], function (ko, $, mainPage, farmData, skuData) {
    var homePageVM = function () {
        var self = this;
        var farm = new farmData();
        var sku = new skuData();

        // Lazy flag
        self.ready = ko.observable(false);

        // Farm Carousel
        self.farms = ko.observableArray();        
        farm.find("nearby").success(function (data) {            
            self.farms(data);
            self.ready(true);
        });

        // Products filter by category
        self._skus = {};
        self.skus = ko.observableArray();
        self.category = ko.observable();
        self.category.subscribe(function (category) {
          if (!self._skus[category])
            sku.find("category", { category: category }).success(function (data) {
              console.log(data);
              self._skus[category] = data;
              self.skus(self._skus[category]);
            });
          else
            self.skus(self._skus[category]);
        });
        
        // Set default
        self.category("all");

        self.noProducts = ko.computed(function () {
          return self.skus().length == 0;
        });

      // News feed
        self.news = ko.observableArray();
        $.get('http://blog.farmshares.com/rss', function(xml){ 
          self.news($.xml2json(xml).item);
        });
    };

    homePageVM.prototype = new mainPage();
    
    return homePageVM;
});
