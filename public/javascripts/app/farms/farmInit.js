require(['knockout', 'jquery', 'farmPageVM', "googleAnalytics", "crazyEgg" /*, 'async!http://dtym7iokkjlif.cloudfront.net/assets/pub/shareaholic.js'*/], function (ko, $, farmPage, ga) {
    $(function () {        
        // Configure Shareaholics
        //var apikey = '8e5098ef93ddb6044114f08a95245dd5';
        //try { Shareaholic.init(apikey); } catch (e) { }
        
      var ui = {
        fname : $("#farm-name").val(),
        addmessage: $("#addmessage")
      }
        this.vm = new farmPage(ui);
        ko.applyBindings(
             this.vm
        );
    });
});