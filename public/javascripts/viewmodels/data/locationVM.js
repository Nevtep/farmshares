define(['knockout', 'mappedVM', 'knockout.validation'], function (ko, mappedVM) {
    var locationDataViewModel = function (data) {
        // get reference to this context.
        var self = this;
        // TODO: Initialize empty data if none provided.

        // Map data to model, location has no CRUD operations
        self.fromJS.apply(self, [data]);
        // Validations
        self.str.extend({ required: { params: true, message: "Enter an Address"} });        
        self.country.name.extend({ required: { params: true, message: "Enter a Country"} });
        self.state.name.extend({ required: { params: true, message: "Enter a State"} });
        self.city.name.extend({ required: { params: true, message: "Enter a City"} });
        self.city.zip.extend({ required: { params: true, message: "Enter a ZipCode"} });
        self.telephone.country_code.extend({ required: { params: true, message: "The Country Code"} });
        self.telephone.local_code.extend({ required: { params: true, message: "Enter a Local Code"} });
        self.telephone.number.extend({ required: { params: true, message: "Enter a Number"} });

        self.errors = ko.validation.group({
            LocationString: self.str,
            LocationCountry: self.country.name,
            LocationState: self.state.name,
            LocationCity: self.city.name,
            LocationZip: self.city.zip,
            TelephoneCountry: self.telephone.country_code,          
            TelephoneLocal: self.telephone.local_code,
            TelephoneNumber: self.telephone.number
        });

        self.isValid = ko.computed(function () {
            return self.errors().length === 0;
        });

        self.phone = ko.computed(function () {
            return "(+" + self.telephone.country_code() + ") " + self.telephone.local_code() + " - " + self.telephone.number();
        });
        self.address.toString = function () {
            return self.address.street.main.name() + " " + self.address.street.main.number();
        };
    };

    locationDataViewModel.prototype = new mappedVM();

    return locationDataViewModel;
});
