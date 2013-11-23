define(['knockout'], function(ko){
    ko.unapplyBindings = function ($node, remove){
		// unbind events
	    $node.find("*").each(function () {
	        $(this).unbind();
	    });
	
	    // Remove KO subscriptions and references
	    if (remove) {
	        ko.removeNode($node[0]);
	    } else {
	        ko.cleanNode($node[0]);
	    }
	}
})
