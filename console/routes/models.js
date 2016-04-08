var global = require("../../global");
var SimpleOrm = require("../../../simpleorm");
var Model = SimpleOrm.Model;
var DbHelper = SimpleOrm.DbHelper;
var models = require("../../database/models");
var Q = require("q");

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

		var get_path = route_path + "/:id";
		router.get(get_path, function (req, res, next){
			var dbhelper = new DbHelper(global.DbConnection);
			dbhelper.getConnection(function (err, connection){
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				mdl.get(req.params["id"], function (err, results){
					response(res, err, results);
				});							
			});
		});

		var post_path = route_path;
		router.post(post_path, function (req, res, next){
			var dbhelper = new DbHelper(global.DbConnection);
			dbhelper.getConnection(function (err, connection){
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				mdl.create(req.body, function (err, results){
					response(res, err, results);
				});							
			});			
		});

		var put_path = route_path + "/:id";
		router.put(get_path, function (req, res, next){
			var dbhelper = new DbHelper(global.DbConnection);
			dbhelper.getConnection(function (err, connection){
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				mdl.set(req.params["id"], req.body, function (err, results){
					response(res, err, results);
				});						
			});	
		});	

		var del_path = route_path + "/:id";
		router.delete(del_path, function (req, res, next){
			var dbhelper = new DbHelper(global.DbConnection);
			/*
			dbhelper.getConnection(function (err, connection){
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				mdl.drop(req.params["id"], function (err, results){
					response(res, err, results);
				});					
			});
			*/
			dbhelper.execTransactionSeries(function (connection, commit, rollback){
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				mdl.setTransactionFlag();

				Q.fcall(function (){
					return Q.Promise(function (resolve, reject, notify){
						mdl.get(req.params["id"], function (err, results){
							if (err)
								reject(err);
							else
								resolve();
						})
					})
				}).then(function (){
					return Q.Promise(function (resolve, reject, notify){
						mdl.drop(req.params["id"], function (err, results){
							if (err)
								reject(err);
							else {
								commit(function (err){
									if (err)
										reject(err.code);
									else{
										response(res, null, results);
										resolve();
									}
								});
							}
						})
					})
				}).catch(function (err){
					rollback();
					response(res, err);
				})
			})		
		});

		router.get(route_path, function (req, res, next){
			var dbhelper = new DbHelper(global.DbConnection);
			dbhelper.getConnection(function (err, connection){
				var options = prepare_options(req.query);
				var mdl = new Model(connection,	models[name].orm, models[name].primary_key);
				var finder = mdl.Finder();

				finder.addConditions(finder.parseQuery(req.query));
				finder.find(options, function (err, results){
					response(res, err, results);
				});					
			});					
		})
	}

}