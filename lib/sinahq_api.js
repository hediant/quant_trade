var request = require('request');
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
	symbols - array of string
		sina pattern is : sh600548 (sh) sz000682 (sz)

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
exports.getLivePrices = function (symbols, cb){
	var rqst = {
		"url" : "http://hq.sinajs.cn/rn=u8&list=" + symbols.join(',')
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

		cb && cb(null, parseResults(symbols, body));
	});
}

/*
	returns string
	var hq_str_sh601929="吉视传媒,4.590,4.550,4.660,4.670,4.580,4.660,4.670,21800376,100667967.000,23400,4.660,478100,4.650,271021,4.640,115778,4.630,160900,4.620,285450,4.670,470700,4.680,255800,4.690,406400,4.700,52500,4.710,2016-03-30,14:19:44,00";

	列     内容          说明
	0     吉视传媒    name
	1      4.590        开盘
	2     4.550         昨日收盘
	3     4.660        当前？
	4     4.670        当日最高
	5     4.580         当日最低
	6     4.660        买一价（元）？
	7     4.670        卖一价（元）?
	8    21800376  成交（手）
	9     100667967.000     成交（元）
	10    23400     买1（股）
	11     4.660       买1价（元）
	12     478100     买2（股）
	13     4.650        买2价（元）
	14     271021     买3（股）
	15     4.640       买3价（元）
	16     115778     买4（股）
	17     4.630      买4价（元）
	18     160900     买5（股）
	19     4.620         买5价（元）
	20     285450     卖1（股）
	21     4.670          卖1价（元）
	22     470700     卖2（股）
	23     4.680          卖2价（元）
	24     255800     卖3（股）
	25     4.690           卖3价（元）
	26     406400     卖4（股）
	27     4.700           卖4价（元）
	28     52500          卖5（股）
	29     4.710           卖5价（元）
	30     2016-03-30     日期
	31     14:19:44              当前盘口时间 （秒）
	32     00                    每10毫秒？
*/
function parseResults (symbols, body){
	var rows = [];

	// parse body
	eval (body);

	symbols.forEach(function (symbol){
		rows.push(toPankouObj(symbol, eval("hq_str_" + symbol)));
	});

	return rows;
}

function toPankouObj (symbol, pankou_string){
	try {
		var cols = pankou_string.split(',');
		if (!cols || cols.length < 33)
			return null;

		return {
			"code" : symbol,				// stock code sh601929 etc.
			"name" : cols[0],				// name, eg. 吉视传媒
			"open" : Number(cols[1]),		// 开盘, eg. 4.590
			"close" : Number(cols[2]),		// 昨日收盘, eg. 4.550
			"current" : Number(cols[3]),	// 当前, eg. 4.660
			"high" : Number(cols[4]),		// 当日最高
			"low" : Number(cols[5]),		// 当日最低

			"competitive_price" : Number(cols[6]),	//买一报价
			"auction_price" : Number(cols[7]),		//卖一报价

			"total"	: Number(cols[8]),		// 成交（手）
			"turnover" : Number(cols[9]),	// 成交额，以元为单位

			"buy1" : Number(cols[10]),			// 买1（股）
			"buy1_price" : Number(cols[11]),		// 买1价（元）
			"buy2" : Number(cols[12]),			// 买2（股）
			"buy2_price" : Number(cols[13]),		// 买2价（元）
			"buy3" : Number(cols[14]),			// 买3（股）
			"buy3_price" : Number(cols[15]),		// 买3价（元）
			"buy4" : Number(cols[16]),			// 买4（股）
			"buy4_price" : Number(cols[17]),		// 买4价（元）
			"buy5" : Number(cols[18]),			// 买5（股）
			"buy5_price" : Number(cols[19]),		// 买5价（元）

			"sell1" : Number(cols[20]),			// 卖1（股）
			"sell1_price" : Number(cols[21]), 	// 卖1价（元）
			"sell2" : Number(cols[22]),			// 卖2（股）
			"sell2_price" : Number(cols[23]), 	// 卖2价（元）
			"sell3" : Number(cols[24]),			// 卖3（股）
			"sell3_price" : Number(cols[25]), 	// 卖3价（元）
			"sell4" : Number(cols[26]),			// 卖4（股）
			"sell4_price" : Number(cols[27]), 	// 卖4价（元）
			"sell5" : Number(cols[28]),			// 卖5（股）
			"sell5_price" : Number(cols[29]), 	// 卖5价（元）

			"date" : cols[30],			// 日期, eg. "2016-03-30"
			"time" : cols[31],			// 当前盘口时间, eg. "14:19:44"

			//分时K线图
			"minurl": "http://image.sinajs.cn/newchart/min/n/" + symbol + ".gif", 
			//日K线图
			"dayurl": "http://image.sinajs.cn/newchart/daily/n/" + symbol + ".gif", 
			//周K线图
			"weekurl": "http://image.sinajs.cn/newchart/weekly/n/" + symbol + ".gif", 
			//月K线图
			"monthurl": "http://image.sinajs.cn/newchart/monthly/n/" + symbol + ".gif" 			
		} 
	} catch (err){
		return null;
	}
}

// for test 1
//
/*
var symbols = ['sh600548', 'sh600183', 'sz000682'];

var start = Date.now();
exports.getLivePrices(symbols, function (err, rows){
	var end = Date.now();
	if (err){
		console.error(err);
		return;
	}

	//console.log(rows);
	console.log("get %s stock's live prices, %sms.", symbols.length, (end - start))
});
*/

