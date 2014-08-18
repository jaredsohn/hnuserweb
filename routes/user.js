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
					results.line_chart_data = get_line_chart_data(results.hits);
					console.log(results.line_chart_data);
					var temp_hits = [];
					if (results.hits.length > 100)
					{
						console.log("Lots of data...only storing stats in cache")
						temp_hits = results.hits;
						results.hits = []; // don't cache bigger objects
					}

					console.log("writing to cache '" + id + "'");
					memjs_client.set(id, JSON.stringify(results), function() {}, 60 * 60 * 4);

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
		title: results.author + " - hnuser",
		author: results.author,
		data: results
	});
}


//http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
	var dd  = this.getDate().toString();

	return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};

get_line_chart_data = function(hits)
{
	var results_by_day = {};
	fields = ["comment_karma", "comment_count", "story_karma", "story_count"];

	for (i = 0; i < hits.length; i++)
	{
		var hit = {};
		for (j = 0; j < fields.length; j++)
			hit[fields[j]] = 0;

		// Interpret hits to get relevant data
		var tag_found = false;
		for (j = 0; j < hits[i]._tags.length; j++)
		{
			if (hits[i]._tags[j] === "comment")
			{				
				hit["comment_count"] = 1;
				hit["comment_karma"] = hits[i].points - 1;
				tag_found = true;
				break;
			} else if (hits[i]._tags[j] === "story")
			{
				hit["story_count"] = 1;
				hit["story_karma"] = hits[i].points - 1;
				tag_found = true;
				break;
			}
		}

		// store data with other data from same day
		var datetime = new Date(hits[i].created_at_i * 1000);
		var datestr = datetime.yyyymmdd();

		if (typeof(results_by_day[datestr]) === "undefined")
		{
			var obj = {};
			for (j = 0; j < fields.length; j++)
				obj[fields[j]] = hit[fields[j]];
			obj["created_at_i"] = hits[i].created_at_i;
			results_by_day[datestr] = obj;
		} else
		{
			var obj = results_by_day[datestr];
			for (j = 0; j < fields.length; j++)
				obj[fields[j]] += hit[fields[j]];
			obj["created_at_i"] = hits[i].created_at_i;

			results_by_day[datestr] = obj;
		}
	}

	// create sorted array. keep running tally.
	var totals = {};
	for (j = 0; j < fields.length; j++)
		totals[fields[j]] = 0;

	daily_results = Object.keys(results_by_day).sort();

	var results = [];
	for (i = 0; i < daily_results.length; i++)
	{
		var obj = {};
		var day_obj = results_by_day[daily_results[i]];	
		for (j = 0; j < fields.length; j++)
		{
			totals[fields[j]] += day_obj[fields[j]];
			obj[fields[j]] = day_obj[fields[j]];

			obj[("total_" + fields[j])] = totals[fields[j]]; 
		}		
		obj["created_at_i"] = day_obj["created_at_i"];
		results.push(obj);
	}

	return results;
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
		if (typeof(results.userinfo_about) !== 'undefined')
		{
			results.userinfo_about = results.userinfo_about.replace(/\\n/g, '\n');
			results.userinfo_avg_rounded =  Math.round(results.userinfo_avg * 100) / 100;
			results.userinfo_days_ago = Math.floor((new Date().getTime() - new Date(results.userinfo_created_at_i * 1000).getTime()) / 1000 / 86400)
		} else
		{
			results.userinfo_about = "";
			results.userinfo_avg_rounded = "";
			results.userinfo_days_ago = "";
		}
		results.comment_karma_percent = (results.comment_karma / (results.comment_karma + results.story_karma) * 100).toFixed() + "%";


		//console.log(results);

		res.render('user_getdetails', {
			title: results.author + " - hnuser",
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
