define(['knockout', 'mainPageVM', 'knockout.lazy'], function (ko, mainPage) {
    var dashboardPageVM = function (baseUrl) {
      var self = this;
      
      self.sections = {};
      
      self.loadSection = function(section, vm) {
        if(!self.sections.hasOwnProperty(section)) {
          $.get(baseUrl + '/section/' + section, function(sectionHTML) {
            $('#dashboard').html(sectionHTML);
            ko.applyBindings(vm, document.getElementById("dashboard"));
            self.sections[section] = sectionHTML;
          });
        } else {
          $('#dashboard').html(self.sections[section]);
          ko.applyBindings(vm, document.getElementById("dashboard"));
        }
      };
    };

    dashboardPageVM.prototype = new mainPage();

    return dashboardPageVM;
});