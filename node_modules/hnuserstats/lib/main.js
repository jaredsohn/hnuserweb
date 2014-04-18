(function() {
	var fs = require('fs');

	if (process.argv.length < 3)
	{
		console.log("usage: hnuserstats username [csv] [json]");
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

	var hnuserdownload = require("hnuserdownload");
	var hnuserstats = require('./hnuserstats.js');
	var argv = require('minimist')(process.argv.slice(2));

	var author = argv._[0];

	console.log("Getting Hacker News data and statistics for user " + author + "...");

	hnuserstats.hnuserstats(author, function(err, results)
	{
		if (argv._.indexOf('csv') !== -1)
		{
			hnuserdownload.to_csv(author, results, write_data);
			hnuserstats.to_csv(author, results, write_data);
		}
		if (argv._.indexOf('json') !== -1)
		{
	    	write_data(author + ".json", JSON.stringify(results));
		}

		var num_requests = results.num_requests;

		console.log("");
		delete(results.hits);
		delete(results.num_requests);
		console.log(results);
		console.log("");
		console.log("This command made " + num_requests + " requests to Algolia's hnsearch API (and you are limited to 1000 per hour.)");
		console.log("");
	});
}).call(this)