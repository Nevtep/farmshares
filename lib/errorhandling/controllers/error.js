var sendMail = function(error, logger) {
	msg = 'Error:' + error.message + '\r\n' + error.stack;
	logger.log('[' + process.env.NODE_ENV + '] error', msg);
};

exports = exports.error = function(err, req, res, next, logger) {
	winston.error('Global Error Handling: ' + err.message + '\r\n' + err.stack);

	if(res) {
		var viewPath = '../lib/errorhandling/views/error.jade';
		res.render(viewPath, {error: err});	
	} 
	sendMail(err, logger);
};