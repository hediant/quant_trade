var sinahq_api = require('../lib/sinahq_api');

exports.config = {
	"max_tasks" : 100
};

exports.crawl = function (tasks, cb){
	var symbols = [];
	tasks.forEach(function (task){
		symbols.push(task.params.code);
	});

	sinahq_api.getLivePrices(symbols, function (err, results){
		if (err){
			console.error(err.code);
		}
		else {
			cb && cb(null, results);
		}
	});
}