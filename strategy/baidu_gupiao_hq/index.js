var LivePrices = require("../../get_live_prices");
var Model = require("../../../simpleorm").Model;
var DbHelper = require("../../../simpleorm").DbHelper;
var models = require("../../database/models");
var Q = require("q");
var global = require("../../global");
var Moment = require("moment");
var EventEmitter = require("events").EventEmitter;
var Config = require("./config");

// init db connection
var dbhelper = new DbHelper(global.DbConnection);

// selected stock pool
var stock_pools = {};

// event
var theEvent = new EventEmitter();
theEvent.on("new_stock", function (stock){
	console.log("[%s] Add Watching Stock:%s.", Moment().format("YYYY-MM-DD HH:mm:ss"), stock.code);
	var task = LivePrices.addStock(stock.code);
	task.on("data", function (data){
		//console.log(data)
	})
});
theEvent.on("del_stock", function (stock){
	console.log("[%s] Remove Watching Stock:%s.", Moment().format("YYYY-MM-DD HH:mm:ss"), stock.code);
	LivePrices.removeStock(stock.code);
})

function selectFromPool (cb){
	dbhelper.getConnection (function (err, connection){
		var mdl = new Model(connection, models.stock_pools.orm, models.stock_pools.primary_key);
		var finder = mdl.Finder();
		finder.addConditions({
			"and":[
				{">=" : {"start_date" : Moment().format("YYYY-MM-DD")}},
				{"<=" : {"end_date" : Moment().format("YYYY-MM-DD")}}
			]
		});
		finder.find({"limit":1000, "sorts" : ["level"]}, function (err, results){
			cb && cb(err, results);
		})
	})
}

function updateStockPool (stocks){
	var new_stocks = {};
	stocks.forEach(function (stock){
		new_stocks[stock.code] = stock;
	});

	// delete expired
	for (var symbol in stock_pools){
		if (!new_stocks.hasOwnProperty(symbol)){
			theEvent.emit("del_stock", stock_pools[symbol]);
			delete stock_pools[symbol];			
		}
	}

	// add new
	for (var symbol in new_stocks){
		if (!stock_pools.hasOwnProperty(symbol)){
			theEvent.emit("new_stock", new_stocks[symbol]);
			stock_pools[symbol] = new_stocks[symbol];
		}
	}
}

function updateCycle (){
	selectFromPool(function (err, results){
		if (err){
			console.error("[%s] update stock pool error: %s.", Moment().format("YYYY-MM-DD HH:mm:ss"), err);
			return;
		}
		updateStockPool(results);
	});
}

// update cycle
setInterval(updateCycle, 5000);