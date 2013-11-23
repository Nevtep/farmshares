// JSON Get account data
exports.get = function (req, res) {
	var aid = req.query.id;
	if (!aid || aid === "" || aid === undefined) {
		res.json(500, { error: 'Invalid Account ID' });
	}
	var AccountModel = require('auth').models.Account;

	//winston.info("Finding account with id:", aid);
	AccountModel.findById(
    aid
	, function (err, account) {
		//winston.info("Retrieving account:", account);
		if (err) {
			winston.error("Error", err);
			res.json(500, { error: err });
		} else {
			if (!account) winston.warn('Account not exists, id:', aid);
			res.json(account);
		}
	});
}

exports.getModel = function (req, res) {
	var account = new require('auth').models.Account();
	res.json(account);
}