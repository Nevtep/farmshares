require(["knockout","jquery", "homePageVM", "googleAnalytics", "crazyEgg", "bootstrap"], function(ko, $, homePage, ga) {
    $(function () {
        var homeViewModel = new homePage();
        ko.applyBindings(homeViewModel);

        homeViewModel.ready.subscribe(function (ready) {
          if (ready){
                $("#farmCarousel").carousel();
            $("#farmCarousel").carousel('next');
          }
        });
    });
});
