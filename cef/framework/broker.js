var EventEmitter = require('events').EventEmitter;
var Cache = require("./cache");

/*
	[meta] - object
	{
		<"class_name_1"> : [Function],
		<"class_name_2"> : [Function],
		...
	},
	[options] - object
	{
		"capacity" : number, default to 100000
	}
*/
function Broker (meta, options){
	EventEmitter.call(this);

	var me = this;
	var options_ = {};
	options_.capacity = options && options.capacity || 100000;

	var cache_ = new Cache(options_.capacity);
	var handler_classes_ = {};

	var initMetaInfo = function (){
		if (meta){
			for (var class_name in meta){
				me.addHandler(class_name, meta[class_name]);
			}
		}
	}

	var closeHandleEvent = function (topic, handler){
		// 
		// 注意：
		// 调用处理器的关闭函数，如果处理器中包含有持久化状态的需要。
		// 
		handler.inst && handler.inst.emit('close');
		cache_.remove(topic);		
	}

	var initHandler = function (topic, class_name){
		var handler_class = handler_classes_[class_name];
		if (!handler_class)
			return null;

		var handler = {
			'class':class_name,
			'inst': new handler_class(topic, me)
		};

		cache_.put(topic, handler);
		return handler;	
	}	

	this.handleEvent = function (topic, fields, class_name){
		var handler = cache_.get(topic);
		if (handler){
			if (handler.class == class_name){
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

			// else handler.class != class_name
			// reload it
			// but firstly, we should close it for avoiding memory leaks!
			closeHandleEvent(topic, handler);	

		}

		initHandler(topic, class_name);
	}

	this.sendEvent = function (topic, fields, class_name){
		setImmediate(function (){
			me.handleEvent(topic, fields, class_name);
		});
	}

	this.addHandler = function (class_name, handler_class){
		handler_classes_[class_name] = handler_class;
	}

	this.removeHandler = function (class_name){
		var handler_class = handler_classes_[class_name];
		if (handler_class){
			var topics = cache_.keys();
			topics.forEach(function (topic){
				var handler = cache_[topic];
				if (handler.class == class_name){
					closeHandleEvent(topic, handler);
				}
			})
		}

		delete handler_classes_[class_name];
	}

	this.getHandler = function (topic){
		return cache_.get(topic);
	}

	this.ack = function (topic, results){
		me.emit("ack", topic, results);
	}

	//
	// Do initializtions
	//
	initMetaInfo();
}

require('util').inherits(Broker, EventEmitter);
module.exports = Broker;
Broker.prototype.constructor = Broker;