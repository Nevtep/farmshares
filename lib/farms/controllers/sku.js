exports.getByCategory = function (req, res) {
    var category = req.query.category;
  var geoloc = require('geolocation');
    if (!category || category === "" || category === undefined) {
        res.json(500, { error: 'Invalid SKU type' });
    };
    var SKU = require('farms').models.SKU;
    var Farm = require('farms').models.Farm;
    var callback = function (err, skus) {
        if (err) {
            winston.error("Something whappened:", err);
            res.json(500, { error: err });
        }
        Farm.populate(skus, { path: "farm", options: { lean: true } }, function (err, skus) {
          if (err) {
            winston.error("Something whappened:", err);
            res.json(500, { error: err });
        }
            var loaded_skus = [];
            var loadData = function (callback) {
                if (!skus || !skus.length) {
                    callback();
                    return;
                }
                var sku = skus.shift();
                winston.info("Loading sku " + sku.name);
                                
                var whichShare = Math.floor(Math.random() * sku.shares.length);
                var share = sku.shares[whichShare];
              sku.photo = share.photo || CDN("/images/product-img-cs.jpg", { raw:true});

                sku.farm.url = "/farms/view/" + sku.farm.slug;

                loaded_skus.push(sku);

                loadData(callback);

            }
            loadData(function () {
              //winston.info("Loaded SKUs", loaded_skus)
                res.json(loaded_skus);
            });
        });
    };
  
  var filters = {}
  if(category != "all")
    filters["type"] = category;
  if (req.geo) {
        winston.info("About to retrieve nearest skus...");
        geoloc.geoFilterSKUs(req.geo, filters, callback);
    } else {
        winston.info("Geodata not available");
        winston.info("About to retrieve skus...");
        filters["farm.disabled"] = false      
        SKU.find(filters).lean().exec(callback);
    }
};

exports.getSubscriptionsByShare = function(req, res){
  var shareid = req.query.shareid;
  var ObjectId = require('mongoose').Types.ObjectId;
  if (!shareid || shareid === "" || shareid === undefined) {
    res.json(500, { error: 'Invalid ShareId' });
  };
  var SKU = require('farms').models.SKU;
  SKU.findOne({ "shares._id" : ObjectId.fromString(shareid) }, function (err, sku) {
    if(err){
      res.json(500, { error: err });
    } else {
      var share = sku.shares.id(shareid);
      res.json(share.subscriptions);
    };
  });
};