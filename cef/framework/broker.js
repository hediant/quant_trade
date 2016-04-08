var EventEmitter = require('events').EventEmitter;
var Cache = require("./cache");

function Broker (handler_class, options){
	EventEmitter.call(this);

	var me = this;
	var options_ = {};
	options_.capacity = options && options.capacity || 100000;

	var cache_ = new Cache(options_.capacity);

	this.handleEvent = function (topic, fields){
		var handler = cache_[topic];
		if (handler){
			// 
			// 采用事件驱动方式的好处是给调用者更大的选择
			// 如：可以对一个事件做多个处理（采用handler继承的方式）
			// 但这样更容易犯错
			// 而采用直接函数调用的方式能够确保同一个事件只会在一个EventHandler中处理
			// 好坏优劣待定。
			//
			// 这里默认采用的是后者
			//
			if (handler.inst && handler.inst.handleEvent_)
				handler.inst.handleEvent_(topic, fields);

			// we need break the function
			return;
		}

		me.initHandler(topic);
	}

	this.sendEvent = function (topic, fields){
		me.emit("message", topic, fields);
	}

	this.closeHandler = function (topic, handler){
		// 
		// 注意：
		// 调用处理器的关闭函数，如果处理器中包含有持久化状态的需要。
		// 
		handler.inst && handler.inst.emit('close');
		cache_.remove(topic);		
	}

	this.getHandler = function (topic){
		return cache_.get(topic);
	}

	this.initHandler = function (topic){
		var handler = {
			'class':handler_class,
			'inst': new handler_class(topic, me)
		};

		this.cache_.put(topic, handler);
		return handler;		
	}
}

require('util').inherits(Broker, EventEmitter);
module.exports = Broker;
Broker.prototype.constructor = Broker;