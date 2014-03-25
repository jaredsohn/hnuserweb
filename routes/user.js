
/*
 * GET user info.
 */

exports.get = function(req, res)
{
	var id = req.params.id;
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		results.comment_karma_percent = (results.comment_karma / (results.comment_karma + results.story_karma) * 100).toFixed() + "%";
		res.render('user_get', {
			title: results.author,
			data: results			
		});
	});
}

exports.get_json = function(req, res)
{
	var id = req.params.id;
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
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
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
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
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		hnuser.hnuser_data_to_csv(id, results, function(filename, contents)
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
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		hnuser.hnuser_stats_to_csv(id, results, function(filename, contents)
		{
			res.setHeader('Content-type', 'text/csv');
			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			res.jsonp(contents);
		});
	});
}
