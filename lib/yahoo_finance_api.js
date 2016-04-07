var request = require('request');
var qs = require('querystring');
var csv2obj = require('./csv2obj');
var socks = require('socksv5');

var proxy_config_ = {
	proxyHost: 'localhost',
	proxyPort: 1080,
	auths: [ socks.auth.None() ]	
};

var enable_proxy_ = false;

/*
	enable - true || false (default)
	options - object
		{
			proxyHost: 'localhost',
			proxyPort: 1080,
			auths: [ socks.auth.None() ]
		}
*/
exports.setProxy = function (enable, options){
	enable_proxy_ = enable;
	if (options){
		proxy_config_.proxyHost = options.proxyHost || "localhost";
		proxy_config_.proxyPort = options.proxyPort || 1080;
	}	
}

/*
	symbol - string
		yahoo pattern is : 600548.ss (sh) 000682.sz (sz)

    Get historical prices for the given ticker symbol.
    Date format is 'YYYY-MM-DD'

    Returns a nested dictionary (dict of dicts).
    outer dict keys are dates ('YYYY-MM-DD')

    cb - function (err, hist_prices)
    	hist_prices - [{
    		"Date" : string,
			"Close" : number,
			"High" : number,
			"Low" : number,
			"Open" : number,
			"Volume" : number
    		},
    		...
    	]
*/
exports.get_historial_prices = function (symbol, start, end, cb){
	var url = "http://ichart.yahoo.com/table.csv?";
	var params = qs.stringify({
		"s" : symbol,
		"a" : start.substr(5,2) - 1,
		"b" : start.substr(8,2),
		"c" : start.substr(0,4),
		"d" : end.substr(5,2) - 1,
		"e" : end.substr(8,2),
		"f" : end.substr(0,4),
		"g" : "d",
		"ignore" : ".csv"
	});

	var rqst = {
		url : url + params
	};

	if (enable_proxy_){
		rqst["agent"] = new socks.HttpAgent(proxy_config_) 
	}

	request(rqst, function (err, response, body){
		if (err)
			return cb && cb({
				"code" : "ER_CONNECT_FAIL",
				"message" : err
			});

		if (response.statusCode != 200)
			return cb && cb({
				"code" : "ER_SYMBOL_NOT_EXISTS"
			});

		csv2obj.csvToRows(body, function (rows){
			cb && cb(null, rows);
		});
	});
}

exports.csvToRows = csv2obj.csvToRows;
exports.rowsToCsvStream = csv2obj.rowsToCsvStream;

/*
// for test 1
exports.get_historial_prices('600548.ss','2016-03-25','2016-03-28', function (err, rows){
	if (err){
		console.error(err);
		return;
	}

	console.log(rows)

	var fs = require('fs');
	var file_path = "test.csv";
	var writeable = fs.createWriteStream(file_path);
	writeable.on('end', function (){
		console.log("Write to :%s finished!", file_path);
	});

	csv2obj.rowsToCsvStream(rows, writeable);

})
*/

/*
// for test 2
var fs = require('fs');
var file_path = "test.csv";
var readable = fs.createReadStream(file_path);
csv2obj.csvToRows(readable, function (rows){
	console.log(rows)
})
*/
