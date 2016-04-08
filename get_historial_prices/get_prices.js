var Q = require('q');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var Set = require('set');
var sortBy = require('sort-array');
var config = require('./config');
var stockcode = require('./stockcode');
var yahoo_api = require('../lib/yahoo_finance_api');
var holidays = require('../lib/holidays');

function TaskMgr(){
	var tasks_ = [];

	this.add = function (task){
		task.retry = 0;

		// write to file
		var file = path.join(config.historial_prices_path, config.tasks, task.code);
		fs.writeFileSync(file, JSON.stringify(task));

		// set index
		tasks_.push(task);
	}

	this.close = function (task){
		// remove from file
		var file = path.join(config.historial_prices_path, config.tasks, task.code);
		fs.unlinkSync(file);
	}

	this.ignore = function (task){
		// delete the task
		this.close(task);

		// add to ignore list
		var file = path.join(config.historial_prices_path, config.ignore, task.code);
		fs.writeFileSync(file, "");
	}

	this.all = function (){
		return tasks_;
	}

	this.next = function (){
		return tasks_.shift();
	}

	this.putback = function (task){
		task.retry ++;
		tasks_.push(task);
	}

	this.count = function (){
		return tasks_.length;
	}

	this.getRedoList = function (){
		var task_path = path.join(config.historial_prices_path, config.tasks);
		var task_files = fs.readdirSync(task_path);
		if (task_files.length){
			task_files.forEach(function (file){
				var task_file = path.join(config.historial_prices_path, config.tasks, file);
				tasks_.push(JSON.parse(fs.readFileSync(task_file)));
			});

			return tasks_;
		}		
	}

	this.init = function (){
		this.getRedoList();
	}

	this.init();
}

//
// task manager instance
//
var taskMgr = new TaskMgr();

// create tasks
function createTasks (){
	return Q.promise(function (resolve, reject, notify){
		// if we have un-finished tasks, redo
		try {
			if (taskMgr.count()){
				resolve();
				return;
			}

			// if un-finished tasks is empty, and last update time < current time
			// create tasks no in ignore list
			var last_time_file = path.join(config.historial_prices_path, config.last_update);
			var last_update_time = fs.readFileSync(last_time_file).toString();
			var current = moment().format("YYYY-MM-DD");
			if (last_update_time >= current){
				// no task added, all tasks finished
				resolve();				
				return;	
			}

			// avoid ignored stocks
			var allstocks = JSON.parse(fs.readFileSync(config.stockcodes));

			var ignore_path = path.join(config.historial_prices_path, config.ignore);
			var ignore_codes = new Set(fs.readdirSync(ignore_path));

			var valid_stocks = [];
			allstocks.forEach(function (stock){
				if (!ignore_codes.contains(stock.code)){
					valid_stocks.push(stock.code);
				}
			});

			// add to task
			if (!valid_stocks.length){ 
				// no task added, all tasks finished
				resolve();
				return;
			}

			valid_stocks.forEach(function (stock_code){
				var task = {
					"code" : stock_code,
					"start" : last_update_time,
					"end" : current
				};
				taskMgr.add(task);
			});

			resolve();
		}
		catch (err){
			reject(err);
		}
	});	
}

// do each task
function doTasks (){
	return Q.promise(function (resolve, reject, notify){
		var total = taskMgr.count();
		if (!total){
			resolve();
			return;
		}

		// progress
		var i = 0, parallel = 0;
		var run = function (){
			while(parallel <= config.max_parallel_tasks && taskMgr.count()){
				(function (task){
					//console.log(task)
					parallel++;
					doTask(task, function (err){
						parallel--;

						if (err){
							if (err.code == "ER_SYMBOL_NOT_EXISTS"){
								taskMgr.ignore(task);
								i++;
								console.log("Ingore %s's prices. progress: %s/%s", task.code, i, total);
							}
							else{
								taskMgr.putback(task);
								console.error("Get %s's prices failure, add to retry list.", task.code);
								console.error(err.message);
								// console.error(err.stack);
							}
						}
						else{
							taskMgr.close(task);
							i++;
							console.log("Get %s's prices finished. progress: %s/%s", task.code, i, total);
						}

						if (taskMgr.count()){
							setImmediate(run);
						}

						if (i == total)
							resolve();
					});									
				})(taskMgr.next());
								
			}
		}

		run();
	});
}

function doTask (task, cb){
	getPricesFromYahoo(task)
	.then(getPricesBeforeLastUpdate)
	.then(mergePrices)
	.then(function(){
		cb();
	})
	.catch(function (err){
		cb(err);
	});
}

function setFinishedTime (){
	return Q.promise(function (resolve, reject, notify){
		var current = moment().format("YYYY-MM-DD");
		try {
			var last_time_file = path.join(config.historial_prices_path, config.last_update);
			fs.writeFileSync(last_time_file, current);
			resolve();
		}
		catch (err){
			reject(err);
		}
	});
}

// get price from yahoo finance
function getPricesFromYahoo (task){
	return Q.promise(function (resolve, reject, notify){
		var symbol = stockcode.toYahooSymbol(task.code);
		yahoo_api.get_historial_prices(symbol, task.start, task.end, function (err, prices){
			try {
				if (err)
					return reject(err);

				// return prices
				task.new_prices = prices;
				resolve(task);
			}
			catch(err){
				reject(err);
			}
		});
	});
}

// get prices from disk
function getPricesBeforeLastUpdate (task){
	return Q.promise(function (resolve, reject, notify){
		try{
			var file = path.join(config.historial_prices_path, config.day, task.code);
			if (!fs.existsSync(file)){
				task.old_prices = [];
				resolve(task);
				return;
			}

			var readstream = fs.createReadStream(file);
		
			yahoo_api.csvToRows(readstream, function (rows){
				task.old_prices = rows;
				resolve(task);
			});
		}
		catch (err){
			reject(err);
		}
	});
}

// merge prices
function mergePrices (task){
	return Q.promise(function (resolve, reject, notify){
		try{
			var prices = sortBy(task.old_prices.concat(task.new_prices), "Date");

			// remove duplicate
			for (var i=0; i<prices.length-1; i++){
				if (prices[i].Date == prices[i+1].Date) prices.splice(i, 1);
			}

			// exclude holidays
			for (var i=0; i<prices.length; i++){	
				if (holidays[prices[i].Date]) {
					prices.splice(i--, 1);
				}
			}

			// write to disk
			var file = path.join(config.historial_prices_path, config.day, task.code);
			var writestream = fs.createWriteStream(file);

			yahoo_api.rowsToCsvStream(prices, writestream);
			resolve();

		}
		catch (err){
			reject(err);
		}
	});	
}

/*
	main call
*/
(function main (){
	//
	// set proxy if enabled
	// socks v5 only
	//
	if (config.proxy && config.proxy.enabled){
		yahoo_api.setProxy(config.proxy.enabled, config.proxy.sock5);
	}

	//
	// do collection tasks
	//
	Q.fcall(createTasks)
	.then(doTasks)
	.then(setFinishedTime)
	.then(function (){
		console.log("------------------------------------------------");
		console.log("All tasks finished!");
	}).catch(function (err){
		console.error(err);
		console.error(err.stack);
	});	
})();

