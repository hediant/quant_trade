var collector = require("../../collector");
var Task = collector.Task;
var Scheduler = collector.Scheduler;
var Adapters = collector.Adapters;
var sinahq_adapter = require("./adapter");
Adapters.add("sinahq_adapter", sinahq_adapter);

var scheduler = new Scheduler();
scheduler.run();

var repeat = require("./repeat.json");
var exclude_dates = require("../lib/holidays");

var cur_task_id = 0;
var crawl_interval = 1 * 1000; 	// 1 seconds

var tasks = {};

/*
	symbol - sina code symbol, e.g. sh600188, sz000123
*/
exports.addStock = function (symbol){
	var task = tasks[symbol];
	if (task){
		return task;
	}

	task = new Task({
		"id" : cur_task_id ++,
		"adapter" : sinahq_adapter,
		"repeat" : repeat,
		"exclude_dates" : exclude_dates,
		"interval" : crawl_interval,
		"params" : {
			"code" : symbol
		}
	});

	scheduler.addTask(task);
	tasks[symbol] = task;

	return task;
}

/*
	symbol - sina code symbol, e.g. sh600188, sz000123
*/
exports.removeStock = function (symbol){
	var task = tasks[symbol];
	if (task){
		scheduler.removeTask(task);
		delete tasks[symbol];
	}
}

/*
	symbol - sina code symbol, e.g. sh600188, sz000123
*/
exports.getTask = function (symbol){
	return tasks[symbol];
}