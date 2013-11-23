require(['knockout', 'jquery', 'dashboardPageVM', 'customerInfoPageVM', 'bootstrap'], function (ko, $, dashboardPage, infoPage) {
    $(function () {
      var infoViewModel= new infoPage();
      
      var dashboardViewModel = new dashboardPage('/customer');
      ko.applyBindings(dashboardViewModel);
      
      dashboardViewModel.loadSection('info', infoViewModel)
    });
});