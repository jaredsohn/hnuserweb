(function() {
	var fs = require('fs');

	if (process.argv.length < 3)
	{
		console.log("usage: hnuserdownload username [csv] [json]");
		return;
	}

	var write_data = function(filename, contents)
	{
		fs.writeFile(filename, contents, function(err) {
			if(err) {
			    console.log(err);
			} else {
			    console.log("Data written to " + filename + ".");
			}
		});
	}

	var hnuserdownload = require('./hnuserdownload.js');
	var argv = require('minimist')(process.argv.slice(2));

	var author = argv._[0];

	console.log("Getting Hacker News data for user " + author + "...");

	hnuserdownload.hnuserdownload(author, function(err, results)
	{
		if (err)
		{
			console.log("Error: " + err);
		} else
		{
			if (argv._.indexOf('csv') !== -1)
			{
				hnuserdownload.to_csv(author, results, write_data);
			}
			if (argv._.indexOf('json') !== -1)
			{
		    	write_data(author + ".json", JSON.stringify(results));
			}
			console.log("");
			console.log("Stories/comments found: " + results.hits.length);
			console.log("# requests (limit 1000 per hour): " + results.num_requests);
		}
		console.log("");
	});
}).call(this)