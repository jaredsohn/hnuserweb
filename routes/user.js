/*
 * GET user info.
 */

var memjs = require('memjs');
var memjs_client = memjs.Client.create();


// We discard hits here (and force json/csv downloaders to recalculate) if it is especially large (due to downloading a prolific user).
// This is done since 1) it helps us prevent our cache from filling up for just a few users, 2) we currently cannot cache large entries 
// anyway via heroku memcachier, 3) I suspect popular user profiles will be visited more by people are just curious about it instead of
// by the users themselves.
var hnuserstats_wrapper = function(id, callback)
{
	memjs_client.get(id, function(err,val,key) {
		if ((err === null) && (val !== null))
		{
			console.log(id + " - found in cache!");
			callback(null, JSON.parse(val.toString()));
		} else
		{
			console.log(id + " - NOT found in cache");
			var hnuserstats = require('hnuserstats');
			hnuserstats.hnuserstats(id, function(err2, results) {
				if (!err)
				{
					var temp_hits = [];
					if (results.hits.length > 100)
					{
						console.log("Lots of data...only storing stats in cache")
						temp_hits = results.hits;
						results.hits = []; // don't cache bigger objects
					}

					console.log("writing to cache '" + id + "'");
					memjs_client.set(id, JSON.stringify(results));

					if (temp_hits.length > 0)
						results.hits = temp_hits; // restore it

				} else
					console.log(err);

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
		if (err)
		{
			console.log("Error: " + err);
			return;
		}
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

exports.get_json = function(req, res)
{
	var id = req.params.id;
	hnuserstats_wrapper(id, function(err, results)
	{
		cb = function(results)
		{
			res.setHeader('Content-disposition', 'attachment; filename=' + id + ".json");
			res.setHeader('Content-type', 'application/json');
			res.jsonp(results);			
		}

		if ((results.hits.length === 0) && ((results.story_count !== 0) || (results.comment_count !== 0)))
		{
			var hnuserstats = require('hnuserstats');
			hnuserstats.hnuserstats(id, function(err2, results) {
				if (!err)
				{
					cb(results);
				} else
					console.log(err);
			});
		} else
		{
			cb(results);
		}
	});
}

// Redundant if user gets full JSON.  (But for CSV, each provides unique content.  Also, for heavy users, only stats are cached.)
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
		cb = function(results)
		{
			var hnuserdownload = require('hnuserdownload');
			hnuserdownload.to_csv(id, results, function(filename, contents)
			{
				res.setHeader('Content-type', 'text/csv');
				res.setHeader('Content-disposition', 'attachment; filename=' + filename);
				res.jsonp(contents);
			});
		}
		if ((results.hits.length === 0) && ((results.story_count !== 0) || (results.comment_count !== 0)))
		{
			var hnuserstats = require('hnuserstats');
			hnuserstats.hnuserstats(id, function(err2, results) {
				if (!err)
				{
					cb(results);
				} else
					console.log(err);
			});
		}
		cb(results);
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
