
/*
 * GET user info.
 */

exports.get = function(req, res)
{
	var id = req.params.id;
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		res.render('user_get', {
			title: 'user info',
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
		res.render('user_get_blob', {
			blob: JSON.stringify(results)
		});
	});
}

exports.get_csv = function(req, res)
{
	var id = req.params.id;
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		res.render('user_get_blob', {
			blob: JSON.stringify(results) // TODO: convert to csv
		});
	});
}

exports.get_stats_csv = function(req, res)
{
	var id = req.params.id;
	var hnuser = require('hnuser');
	hnuser.hnuser(id, function(results)
	{
		res.render('user_get_blob', {
			blob: JSON.stringify(results) // TODO: convert to csv and just the stats portion
		});
	});
}
