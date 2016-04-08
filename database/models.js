var Orm = require("../../simpleorm").Orm;

module.exports = {
	"stock_pools" : {
		"orm" : new Orm("t_stock_pool", {
			"__id__" : { "alias":"id", "readonly":true, "auto":true },
			"code" : { "alias":"code", "readonly":true },
			"name" : { "alias":"name" },
			"start_date" : { "alias":"start_date"},
			"end_date" : { "alias":"end_date"},
			"label" : { "alias":"label" },
			"reason" : { "alias":"reason" },
			"enabled" : { "alias":"enabled" },
			"level" :{"alias":"level"},
			"create_time" : { "alias":"create_time", "readonly":true, "auto":true }
		}),
		"primary_key" : "id"
	}
}