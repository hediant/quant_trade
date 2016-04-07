var request = require('request');
var qs = require('querystring');
var fs = require('fs');
var config = require('./config.json');

//
// apistore.baidu.com apikey
//
var apikey = "e4a0cd53b8e64965506b2f3cd3e09c97";	// l0pnet
var apiurl = "http://apis.baidu.com/tehir/stockassistant/stocklist?";

/*
	cb - function (err, rows, total)
	rows - object,数据集合
	[{
		"code":"000557",--代码
		"name":"*ST广夏",--名称
		"industry":"红黄药酒",--所属行业
		"area":"宁夏",--地区
		"pe":32757.73,--市盈率
		"outstanding":66800.49,--流通股本
		"totals":68613.39,--总股本(万)
		"totalassets":27413.40,--总资产(万)
		"liquidassets":24440.85,--流动资产
		"fixedassets":1843.70,--固定资产
		"reserved":101737.15,--公积金
		"reservedpershare":1.48,--每股公积金
		"eps":0,--每股收益
		"bvps":0.21,--每股净资
		"pb":27.85,--市净率
		"timetomarket":"1994-06-17 00:00:00"--上市日期
	}
	...
	]
*/
var getOnePage = function (page, rows, cb){
	var options = {
		"url" : apiurl + qs.stringify({
			"page" : page,
			"rows" : rows
		}),
		"headers" : {
			"apikey" : apikey
		}
	};

	request(options, function (err, response, body){
		if (err)
			return cb && cb(err);

		var info = JSON.parse(body);
		cb && cb(null, info.rows, info.total);
	});
}

var getStockList = function (){
	var page = 1, rows_per_page = 20;
	var stocks = [];

	var handle_results = function (err, rows, total){
		if (err){
			console.error('Get stock list failure at page:%s, error:%s.', page, err);
			return;
		}

		stocks = stocks.concat(rows);
		console.log("page:%s, %s/%s.", page, page*rows_per_page, total);

		if (rows_per_page * (page++) < total){
			getOnePage(page, rows_per_page, handle_results);
		}
		else{
			console.log("Write to file: %s", config.output);
			saveStockList(stocks);
			console.log("Finished.");
		}		
	}

	getOnePage(page, rows_per_page, handle_results);
}

var saveStockList = function (stocks){
	fs.writeFileSync(config.output, JSON.stringify(stocks));
}

getStockList();

