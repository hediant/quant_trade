var cef = require('../');
var Broker = cef.Broker;
var BaseHandler = cef.BaseHandler;
var STW = cef.SlidingTimeWindow;
var SCW = cef.SlidingCountWindow;

function ExampleHandler (topic, broker){
	BaseHandler.call(this, topic, broker);

	// TODO
	// Add your own initialize functions here
	this.on('message', this.handleEvent);

	// Close when handler destroy
	this.on('close', function(){
		// TODO
	});	

	// 创建滑动时间窗口
	this.stw_ = new STW(topic, 5*1000);
	this.scw_ = new SCW(topic, 5);	
}
require('util').inherits(ExampleHandler, BaseHandler);
ExampleHandler.prototype.constructor = ExampleHandler;

// -- TODO --
/******************************************************************
 *     Add your own prototype members here.                       *
 *                                                                *
 ******************************************************************/

ExampleHandler.prototype.handleEvent = function(topic, fields) {
	// TODO
	// Add your own functions here
	var time = new Date();

	console.log('----------------- Demo/ExampleHandler -------------------');
	console.log("[%s]", time.toUTCString());
	console.log('Topic:', topic);
	console.log('Fields:', JSON.stringify(fields));

	// 滑动时间窗口
	console.log('SlidingTimeWindow');
	console.dir(this.stw_.getSeries());

	console.log('SlidingCountWindow');
	console.dir(this.scw_.getSeries());

	var avg = function (series){
		var sum = 0;
		var count = series.length;

		series.forEach(function (item){
			sum += item.v;
		});

		return count ? sum / count : NaN;
	};

	var avg_tag0 = avg(this.stw_.getSeries("tag0") || []);
	var avg_tag1 = avg(this.scw_.getSeries("tag1") || []);
	var avg_tag2 = avg(this.scw_.getSeries("tag2") || []);

	// Send ACK back
	this.broker.ack(topic, {
		"tag0" : avg_tag0,
		"tag1" : avg_tag1,
		"tag2" : avg_tag2
	})

	//
	// 发射事件DEMO
	// 需要特别注意如下的写法，否则将会陷入无尽的循环中
	//
	if (topic != 'calc_sum') {	debugger	
		this.broker.sendEvent('calc_sum', 
			{
				'Time window average of tag0: ': avg_tag0,
				'Count window average of tag1: ': avg_tag1
			},
			"ShowDemo"
		);
	}

	//
	// NOTE:
	// 不要忘记实现滑动
	//
	this.stw_.slide(topic, fields, time.valueOf());
	this.scw_.slide(topic, fields);

};

function ShowDemoHandler (topic, broker){
	BaseHandler.call(this. topic, broker);
	this.on("message", function (topic, fields){
		// TODO
		// Add your own functions here
		console.log("#############################");
		console.log("Show Me!");
		console.dir(fields);
		console.log("=============================")		
	})
}
require('util').inherits(ShowDemoHandler, BaseHandler);

var doTest = function (){
	var broker = new Broker({
		"Demo" : ExampleHandler,
		"ShowDemo" : ShowDemoHandler
	});

	broker.on("ack", function (topic, results){
		console.log("+++++++++++++++++");
		console.log("TOPIC:");
		console.log(topic);
		console.log("ACK:");
		console.dir(results);
		console.log("------------------");
	});

	setInterval(function (){
		var data = {
			"tag0" : Math.round(Math.random()*1000),
			"tag1" : Math.round(Math.random()*100),
			"tag2" : Math.round(Math.random()*10)
		};

		broker.handleEvent("topic1", data, "Demo");

	}, 1000);
}

doTest();