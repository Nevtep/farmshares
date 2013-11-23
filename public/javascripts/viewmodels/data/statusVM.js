define(['knockout'], function (ko) {
    return function statusDataViewModel() {
        var self = this;

        self.doneTasks = ko.observable(0);
        self.failedTasks = ko.observable(0);
        self.completedTasks = ko.computed(function () {
            return self.doneTasks() + self.failedTasks();
        });
        self.totalTasks = ko.observable(0);
        self.percent = ko.computed(function () {
            return self.completedTasks() * 100 / self.totalTasks();
        });

        self.reset = function () {
            self.totalTasks(0);
            self.doneTasks(0);
            self.failedTasks(0);
        }

        self.status = ko.computed(function () {
            if (self.doneTasks() == self.totalTasks())
                return "success";
            else if (self.completedTasks() == self.totalTasks() && self.failedTasks() > 0)
                return "fail";
            else
                return "processing";
        });
    }
});