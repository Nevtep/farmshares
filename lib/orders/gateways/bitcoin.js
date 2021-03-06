var _ = require("underscore")
	, request = require("request")
	, mailing = require("mailing");

exports.gateway = function(context){
  var self = this;
  var paymentData = context.paymentData,
      order = context.order,
      customerData = context.customerData,
      customer = context.customer,
      res = context.res,
      checkout = context.checkout;
  
  self.process = function(){
    paymentData.btcdata={};
  	to_btc(paymentData.currency,paymentData.payment_total,function(btcamount){
  		paymentData.btcdata.total = btcamount * 100000000; /*Value in satoshi*/
	    checkout.processBitcoinPayment(paymentData, function (payment) {
	      // Push the payment to the order, create deliveries notify and succeed
	      order.payments.push(payment);
	      order.save(function(err,order){
	        if(err) throw new Error(err);
  	      var callback = process.env.HOST + "/payments/bitcoin/confirm/" + customer._id + "/" + order._id + "?secret=" + process.env.BTCSECRET + "&from=" + customerData.customer_delivery_from + "&to=" + customerData.customer_delivery_to;
  	      request("https://blockchain.info/api/receive?method=create&address="+process.env.BTCADDRESS+"&callback="+ encodeURIComponent(callback),function (error, response, body) {
  	        if (!error && response.statusCode == 200) {
  	          var blockchain = JSON.parse(body);
  	          var purchase_obj = {
  	            customer: customer,
  	            order: {
  	              id : order._id,
  	              grandTotal:btcamount,
  	              currency:"BTC"
  	            },
  	            btcaddress:blockchain.input_address
  	          };
  	          var purchaseMailOptions = {
  	            from: "Farm Shares Support <support@farmshares.com>", // sender address
  	            cco: ["support@farmshares.com","tomas@viralzr.com"], // loopback address
  	            to: customer.email, // list of receivers
  	            subject: "Realiza el pago de tu pedido de FarmShares.com" // Subject line
  	          };
  	          mailing.queueEmail(purchaseMailOptions, "btcpayment", purchase_obj);  
  	          res.render("thankyou");
  	        } else
  	          throw new Error(error || response.statusCode);
  	      });
	      });
	    });
    },paymentData.btcdata);
  };
};

var to_btc = exports.gateway.to_btc = function(currency, amount, callback, btcdata){
  	winston.info("Getting exchange rates");
    request("https://coinbase.com/api/v1/currencies/exchange_rates",function(error,response,body){
      if (!error && response.statusCode == 200) {
      	winston.info("got: ",body);
        var rates = JSON.parse(body);
        winston.info(currency.toLowerCase()+"_to_btc: ",rates[currency.toLowerCase()+"_to_btc"]);
        winston.info("amount: ",amount);
        var exchange = amount * rates[currency.toLowerCase()+"_to_btc"];
        if(btcdata)
        	btcdata.rate=rates[currency.toLowerCase()+"_to_btc"];
        callback(exchange.toFixed(8));
      } else
        throw new Error(error);
    });
  };