var winston = require('winston'),
    logger = new (winston.Logger)({
      transports: [
          new (require('winston-mail').Mail)({
          to      : process.env.LOGGER_EMAIL,
          username: process.env.LOGGER_EMAIL,
          password: process.env.LOGGER_PASS,
          host: process.env.LOGGER_HOST,
          ssl			: true
        })
      ]
    }),
    handler = require("./controllers/error");
  
exports = module.exports = function(err, req, res, next) {
  winston.error(err);
	handler.error(err, req, res, next, logger);
};