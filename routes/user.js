/*
 * GET user info.
 */

var memjs = require('memjs');
var memjs_client = memjs.Client.create();

var hnuserstats_wrapper = function(id, callback)
{
	memjs_client.get(id, function(err,val,key) {
		if ((err === null) && (val !== null))
		{
			console.log(id + " - found in cache!");
			callback(JSON.parse(val.toString()));
		} else
		{
			console.log(id + " - NOT found in cache");
			var hnuserstats = require('hnuserstats');
			hnuserstats.hnuserstats(id, function(err2, results) {
				if (!err)
				{ // TODO: assuming that err means that memcached isn't working at all

					// TODO: handle err here

					console.log("writing to cache '" + id + "'");
					memjs_client.set(id, JSON.stringify(results));
				}
				callback(err2, results);
			});
		}
	});
}


exports.get = function(req, res)
{
	var id = req.params.id;
	var results = {};
	results.author = id;
	
	res.render('user_get', {
		title: results.author,
		data: results
	});
}

exports.getdetails = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		results.hits = [];
		results.userinfo_about = results.userinfo_about.replace('\\n', '\n');
		results.userinfo_avg_rounded =  Math.round(results.userinfo_avg * 100) / 100;
		results.userinfo_days_ago = Math.floor((new Date().getTime() - new Date(results.userinfo_created_at_i * 1000).getTime()) / 1000 / 86400)
		results.comment_karma_percent = (results.comment_karma / (results.comment_karma + results.story_karma) * 100).toFixed() + "%";

		console.log(results);

		res.render('user_getdetails', {
			title: results.author,
			data: results
		});
	});
}


/*exports.linechart = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		results.comment_karma_percent = (results.comment_karma / (results.comment_karma + results.story_karma) * 100).toFixed() + "%";
		res.render('linechart', {
			data_stringified: JSON.stringify(results) //TODO: for now
		});
	});
}*/

exports.get_json = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		res.setHeader('Content-disposition', 'attachment; filename=' + id + ".json");
		res.setHeader('Content-type', 'application/json');
		res.jsonp(results);
	});
}

// Redundant if user gets full JSON.  (But for CSV, each provides unique content.)
exports.get_stats_json = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		delete results.hits; // Don't send all of that data as bandwidth

		res.setHeader('Content-disposition', 'attachment; filename=stats_' + id + ".json");
		res.setHeader('Content-type', 'application/json');
		res.jsonp(JSON.stringify(results));
	});
}

exports.get_csv = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		var hnuserdownload = require('hnuserdownload');
		hnuserdownload.to_csv(id, results, function(filename, contents)
		{
			res.setHeader('Content-type', 'text/csv');
			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			res.jsonp(contents);
		});
	});
}

exports.get_stats_csv = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		var hnuserstats = require('hnuserstats');
		hnuserstats.to_csv(id, results, function(filename, contents)
		{
			res.setHeader('Content-type', 'text/csv');
			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			res.jsonp(contents);
		});
	});
}
