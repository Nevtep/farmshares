Welcome to FarmShares!
======================

Some things to know about the project.

Development Workflow
--------------------
All requirements are tracked with issues. When a new issue is created is labeled as "Backlog" and assigned to a developer.
The assigned developer should give a time estimate on the issue, when the time estimate is confirmed the issue is put under the "Ready" label.
When an issue is ready, a feature branch should be created from staging branch to isolate commits for the feature, and the issue set to "Working" label.
After development is finished, the issue is labeled "Done" and a pull request to merge the feature branch into staging should be created. 
After merge staging is deployed for testing, corrections should be done in an atomic way directly on staging branch. When the feature has been tested at staging, the issue is closed.
