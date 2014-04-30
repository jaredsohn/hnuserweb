// TODO: check over code re: closures soon

var hnuserstats = function()
{
	this.get_data_and_stats = function(author, callback)
	{
		var async = require('async');

		var saved_results = {};
		saved_results.num_requests = 0;

		async.parallel({
			download: function(callback)
			{
				var hnuserdownload = require('hnuserdownload');
				hnuserdownload.hnuserdownload(author, function(err, results)
				{
					if (!err)
					{
						saved_results.author = author;
						saved_results.hits = results.hits;
						saved_results.num_requests += results.num_requests;
					}

					callback();
				});
			},
			userinfo: function(callback)
			{
				_get_hnsearch_user_stats(author, function(err, results)
				{
					for (var key in results) {
						saved_results['userinfo_' + key] = results[key];
					}
					saved_results.num_requests += 1;
					callback();
				});
			}
		}, function(err, results)
		{
			if (typeof(err) === 'undefined') // TODO: investigate this
				err = null;
			_get_stats(saved_results);
			callback(err, saved_results);
		});
	}

	// TO_DO: move into own npm module?
	this.get_hnsearch_user_stats = function(author, callback)
	{
		_get_hnsearch_user_stats(author, callback);
	}
	var _get_hnsearch_user_stats = function(author, callback)
	{
		var request = require('request'); // change to browser-request if browserifying this
		var url = "http://hn.algolia.com/api/v1/users/" + author;

		request(url, function(error, response, body)
		{
			if (!error && response.statusCode === 200) {
				var jsonified = JSON.parse(response.body);
				callback(null, jsonified);
			} else
			{
				callback("hnuserstats: Could not complete request. Error = " + error + ", statuscode = " + response.statusCode, {});
			}
		});
	}

	// this runs synchronously, updates data object to include statistics
	// TODO: add histograms?
	var _get_stats = function(data)
	{
		var found_hit_type = false;
		var results = data.hits;
		data.story_karma = 0;
		data.story_count = 0;
		data.comment_karma = 0;
		data.comment_count = 0;
		data.comment_toplevel_count = 0;
		data.comment_toplevel_karma = 0;

		data.lastyear_story_karma = 0;
		data.lastyear_story_count = 0;
		data.lastyear_comment_karma = 0;
		data.lastyear_comment_count = 0;
		data.lastyear_comment_toplevel_count = 0;
		data.lastyear_comment_toplevel_karma = 0;

		var d = new Date();
		var year_ago_created_at_i = d.setFullYear(d.getFullYear() - 1) / 1000;

		for (i = 0; i < results.length; i++)
		{
			for (j = 0; j < results[i]._tags.length; j++)
			{
				var ly = (results[i].created_at_i > year_ago_created_at_i); // is data from last year?

				if (results[i]._tags[j] === "story")
				{
					results[i].type = "story";
					data.story_karma += results[i].points - 1;
					data.story_count++;
					if (ly)
					{
						data.lastyear_story_karma += results[i].points - 1;
						data.lastyear_story_count++;
					}
					found_hit_type = true;					
					break;
				} else if (results[i]._tags[j] === "comment")
				{
					results[i].type = "comment";
					data.comment_karma += results[i].points - 1;
					data.comment_count++;
					if (ly)
					{
						data.lastyear_comment_karma += results[i].points - 1;
						data.lastyear_comment_count++;
					}
					found_hit_type = true;
					if ((results[i].parent_id) === (results[i].story_id))
					{
						data.comment_toplevel_count++;
						data.comment_toplevel_karma += results[i].points - 1;
						if (ly)
						{
							data.lastyear_comment_toplevel_count++;
							data.lastyear_comment_toplevel_karma += results[i].points - 1;
						}
					}
					break;
				}
			}
			if (!found_hit_type)
			{
				console.log("unexpected hit type");
				console.log(results[i]);			
				continue;	
			}
		}
		data.unknown_karma = data.userinfo_karma - data.comment_karma - data.story_karma;
	}
};

// callback is of form function(err, results)
exports.hnuserstats = function(author, callback)
{
	var _hnuserstats = new hnuserstats();
	_hnuserstats.get_data_and_stats(author, callback);
}

exports.get_hnsearch_user_stats = function(author, callback)
{
	var _hnuserstats = new hnuserstats();
	_hnuserstats.get_hnsearch_user_stats(author, callback);	
}

// the callback will be called and passed params filename, csvcontents	
exports.to_csv = function(author, data, callback)
{
	var csv_data = {};

	var field_names = ['userinfo_username']; // force it to be first
	for (var key in data) {
		if ((key !== 'userinfo_username') && (key !== 'hits') && (key !== 'num_requests'))
		{
			field_names.push(key);
		}
	}
	field_names.push('num_requests'); // make it the last field

	var json2csv = require('json2csv');
	json2csv(
	    {   data: [data], 
	    	fields: field_names,
	    	fieldNames: field_names
	    },
	    function(err, csv) {
	        if (err)
	        	console.log(err);
	        else
	        {
	        	callback(author + "_stats.csv", csv);
			}
	    }
	);
}