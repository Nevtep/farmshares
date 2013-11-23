// Dependencies
var request = require('request')
  , crypto  = require('crypto');

// Definitions
var module = {

  payments: {
    create: function (trx_id, amount, payment_type, cb) {
      if(!trx_id) {
        throw new Error("trx_id is required");
        return;
      }

      if(!amount) {
        throw new Error("amount is required");
        return;
      }
      if (amount != Math.round(amount)) winston.info("Rounded Amount ", amount)
      amount = Math.round(amount);
      if(typeof(payment_type) === "function") {
        cb = payment_type;
        payment_type = "sensible_default";
      }

      var data = {
        'trx_id': trx_id,
        'monto':  amount+".00",
        'medio_pago': payment_type
      };

      var today = new Date();
      var timestamp = today.toGMTString();

      var message = 'transaccion/crear' + "\n" + trx_id + "\n" + amount+".00" + "\n" + timestamp;

      var encoded_string = new Buffer(crypto.createHmac('sha1', process.env.PUNTOPAGOS_SECRET).update(message).digest(),'binary').toString('base64');
      var signature = "PP "+process.env.PUNTOPAGOS_KEY+":"+ encoded_string;

      var dump = {
        message: message,
        signature: signature,
        timestamp: timestamp,
        data: JSON.stringify(data)
      };
      winston.info("About to access PuntoPagos", dump);

      request.post({
        uri: process.env.PUNTOPAGOS_URL+"transaccion/crear",
        headers: {
          'User-Agent'     : "puntopagos.js",
          'Accept'         : 'application/json',
          'Accept-Charset' : 'utf-8',
          'Content-Type'   : 'application/json; charset=utf-8',
          'Fecha'          : timestamp,
          'Autorizacion'   : signature
          },
        body: JSON.stringify(data)
        }
        , function (error, response, data) {
          if (error) throw new Error(error);
          winston.info("Data as string", data);
          data = JSON.parse(data);
          winston.info("Data as object", data);
          if(data.respuesta === "00") {
            return cb(data, process.env.PUNTOPAGOS_URL+'transaccion/procesar/'+data.token);
          } else {
            return cb(data);
          }
        }
      );
    }
  }
};

// Exports
exports.payments = module.payments;