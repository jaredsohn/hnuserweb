var hnuserdownload = function()
{
	var request = require('request'); // change to browser-request if browserifying this

	// Because these variables are at the module level, do not call get_author_content more than once from within the same instance (not a problem for module users.)
	var _saved_results = {};
	var _callback = null;

	// Make a call to hnsearch for an author (possibly multiple calls if paging required); collect results.
	//
	// Caller is responsible for not hitting API limit of 1000 calls per hour.  _saved_results.num_requests indicates how many requests were made. (Sleep 3.6 seconds * _saved_results.num_requests if running this in some kind of loop.)
	var _get_author_content = function(author, end_timestamp_i)
	{
		var url = "https://hn.algolia.com/api/v1/search_by_date?tags=author_" + author + "&hitsPerPage=1000&numericFilters=created_at_i%3c" + end_timestamp_i;
		_saved_results.num_requests++;
		request(url, function(error, response, body)
		{
			if (!error && response.statusCode === 200) {
				var jsonified = JSON.parse(response.body);
				_save_hits(jsonified.hits);
	        	if (jsonified.nbHits > jsonified.hitsPerPage)
	        	{
	        		_get_author_content(author, jsonified.hits[jsonified.hits.length - 1].created_at_i);
				}
				else
				{
					_callback(null, _saved_results);
				}
			} else
			{
				_callback("hnuserdownload: Could not complete request. Error = " + error + ", statuscode = " + response.statusCode, {});
			}
		});
	}

	// Use Algolia's hnsearch API; pages through results based on timestamp
	this.get_author_content = function(author, callback)
	{
		_callback = callback;
		_saved_results = {};
		_saved_results.author = author;
		_saved_results.hits = [];
		_saved_results.num_requests = 0;

		_get_author_content(author, new Date().getTime());
	}

	var _save_hits = function(hits)
	{
		_saved_results.hits = _saved_results.hits.concat(hits);
	}		
};

// callback is of form function(err, results)
exports.hnuserdownload = function(author, callback)
{
	var _hnuserdownload = new hnuserdownload();
	_hnuserdownload.get_author_content(author, callback);
}

// the callback will be called and passed params filename, csvcontents	
exports.to_csv = function(author, data, callback)
{
	// Note: csv does not include computed stats
	var json2csv = require('json2csv');
	json2csv(
	    {   data: data.hits, 
	        fields: ['created_at', 'points', 'type', 'comment_text', 'story_title', 'url', 'title', 'story_url', 'story_text', 'num_comments', 'created_at_i'],
	        fieldNames: ['created_at', 'points', 'type', 'comment_text', 'story_title', 'url', 'title', 'story_url', 'story_text', 'num_comments', 'created_at_i']
	    },
	    function(err, csv) {  
	        if (err)
	        	console.log(err);
	        else
	        {
	        	callback(author + ".csv", csv);
			}
	    }
	);
}
