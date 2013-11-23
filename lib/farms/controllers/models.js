exports.farm =  function (req, res) {
    var farm = new require('farms').models.Farm();
    res.json(farm);
}

exports.skutype = function (req, res) {
    var skutype = new require('farms').models.SKUType();
    res.json(skutype);
}

exports.share = function (req, res) {
  var share = new require('farms').models.Share({
      subscriptions :[ {
        name: "Once",
        deliveries: 1,
        discount:0,
    timespan:86400000
      },{
        name: "Monthly",
        deliveries: 2,
        discount:1,
    timespan:2592000000
      },
      {
        name: "3 Months",
        deliveries: 6,
        discount:3,
    timespan:7776000000
      },
      {
        name: "6 Months",
        deliveries: 12,
        discount:6,
    timespan:15552000000
      },
      {
        name: "12 Months",
        deliveries: 24,
        discount:12,
    timespan:31104000000
      }
      ]
  });
    res.json(share);
}
exports.subscription = function (req, res) {
    var subscription = new require('farms').models.Subscription();
    res.json(subscription);
}

exports.sku = function (req, res) {
    var sku = new require('farms').models.SKU();
    res.json(sku);
}

