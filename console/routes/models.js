var global = require("../../global");
var Model = require("../../../simpleorm").Model;
var models = require("../../database/models");

var escape_array = require('../utils/escape_array')
	, prepare_options = require('../utils/prepare_options')
	, prepare_fields = require('../utils/prepare_fields')
	, prepare_conds = require('../utils/prepare_conds');

module.exports = function (router){
	var base_ = "/stock/";

	var response = function (res, err, results){
		res.json({
			"err" : err,
			"results" : results
		});
	}

	for (var name in models){
		var route_path = base_ + name;
		var mdl = new Model(global.DbConnection, models[name].orm, models[name].primary_key);

		var get_path = route_path + "/:id";
		router.get(get_path, function (req, res, next){
			mdl.get(req.params["id"], function (err, results){
				response(res, err, results);
			});
		});

		var post_path = route_path;
		router.post(post_path, function (req, res, next){
			mdl.create(req.body, function (err, results){
				response(res, err, results);
			});
		});

		var put_path = route_path + "/:id";
		router.put(get_path, function (req, res, next){
			mdl.set(req.params["id"], req.body, function (err, results){
				response(res, err, results);
			});
		});	

		var del_path = route_path + "/:id";
		router.delete(del_path, function (req, res, next){
			mdl.drop(req.params["id"], function (err, results){
				response(res, err, results);
			});
		});

		router.get(route_path, function (req, res, next){
			var options = prepare_options(req.query);
			var finder = mdl.Finder();
			finder.addConditions(finder.parseQuery(req.query));
			finder.find(options, function (err, results){
				response(res, err, results);
			});					
		})
	}

}