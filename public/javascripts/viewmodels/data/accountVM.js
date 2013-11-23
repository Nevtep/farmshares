// Main viewmodel class
define(['knockout', 'crudBaseVM', 'locationDataVM','knockout.validation'], function(ko, crudBaseVM, locationData) {
  var accountDataViewModel = function(_id) {
    // get reference to this context.
    var self = this;
    // Lazy loading flag
    self.ready = ko.observable(false);    
    
    // Extended properties for bases
    var extend = {
        // Data mapping configuration for CRUD
        mapping: {            
            'billing_address': {
                create: function (options) {
                    return new locationData(options.data);
                }
            },
            'shipping_address': {
                create: function (options) {
                    return new locationData(options.data);
                }
            }
        }
    };

    self.init.apply(self, [extend]);
    // Map data using mapping plugin get the raw model for null IDs
    self.read.apply(self, [_id]).done(function (res) {
        // Computed Observables
        self.fullname = ko.computed({
            read: function () {
                return self.name.first() + " " + (self.name.middle() ? self.name.middle() + " " : "") + self.name.last();
            },
            write: function (name) {
              // handle the case of setting to null
              if (name === "") {
                self.name.first("");
                self.name.last("");
                self.name.middle("");
                return;
              }
              // get the full name from a string and split it
              // this should support also having Last name, first name Initial(.)
              // in the case the order was reversed and the separator was a comma
              // but for the majority of the cases this will do just fine
              var split = name.split(" ");
              // first one should always be the first name
              self.name.first(split[0]);
              // if there is more than just two elements
              if (split.length > 2) {
                // then the second element is the middle name
                self.name.middle(split[1].split(".")[0]) //get rid of the dot if it is there
                // and the last one is the last name
                self.name.last(split[2]);
              } else {
                // else, the last one is the last name
                self.name.last(split[1]);
              }
            }
        });
        
        // Validations
        self.fullname.extend({required:{ params: true, message:"Enter the user's name"}});
        self.email.extend({required:{ params: true, message:"Enter the user's email"}, email: {params: true, message: "The email is invalid."}});
    
        self.errors = ko.validation.group({
            AccountName: self.fullname,
            AccountEmail: self.email
        })
    
        self.isValid = ko.computed(function(){
            return self.errors().length === 0;
        })
        
        self.ready(true);
    });    
  };
  // Inherit and initialize CRUD
  accountDataViewModel.prototype = new crudBaseVM({
    createUrl : "/admin/users/create",
    readUrl : "/users/get",
    updateUrl : "/admin/users/update",
    destroyUrl : "/admin/users/delete"
  });  
  
  return accountDataViewModel;
});
