exports.discover = function (req, res) {

}

exports.view = function (req, res) {
    var fname = req.params.fname;
    if (!fname || fname === "" || fname === undefined) {
        res.redirect('/');
    }
    
    res.render("farms", { farm: fname });
}

// JSON Get farm data
exports.get = function (req, res) {
    var fid = req.query.id;
    if (!fid || fid === "" || fid === undefined) {
        res.json(500, { error: 'Invalid Farm ID' });
    }
    var models = require('farms').models;    
    
    models.Farm.findOne({
        slug: fid
    }, function (err, farm) {
        //winston.info("Retrieving farm:", farm);
        if (err) {
            winston.error("Error", err);
            res.json(500, { error: err });
        } else {
            models.SKU.find({ farm: farm._id }, null, { lean: true}, function (err, skus) {
                if (err) {
                    winston.error("Error", err);
                    res.json(500, { error: err });
                } else {
                  //winston.info("found SKUs:", skus.length);
                  skus.forEach(function(sku){
                    sku.shares.forEach(function(share){
                      share.photo = share.photo || CDN("/images/product-img-cs.jpg", { raw:true});
                    });
                  });
                    farm.skus = skus;
                    res.json(farm);
                }
            });
        }
    });
}

exports.getNearby = function (req, res) {
    var Farm = require('farms').models.Farm;
    var geoloc = require('geolocation');
    var callback = function (err, farms) {
        if (err) {
            winston.error("Something whappened:", err);
            res.json(500, { error: err });
        }
        var loaded_farms = [];
        var loadData = function (callback) {
            if (!farms || !farms.length) {
                callback();
                return;
            }
            var farm = farms.shift();
            winston.info("Loading farm " + farm.slug);

            //var which = Math.floor(Math.random() * farm.gallery.length);
            farm.featured = farm.gallery && farm.gallery[0] || "";
            
            farm.url = "/farms/view/" + farm.slug
            loaded_farms.push(farm);

            loadData(callback);

        }
        loadData(function () {
            //winston.info("Loaded Farms", loaded_farms)
            res.json(loaded_farms);
        });
    }

    if (req.geo) {
        winston.info("About to retrieve nearest farms...");
        geoloc.geoFilterFarms(req.geo, { disabled: false }, callback);
    } else {
        winston.info("Geodata not available");
        winston.info("About to retrieve farms...");
        Farm.find({
            disabled: false
        }).lean().sort('_id').exec(callback);
    }
};
