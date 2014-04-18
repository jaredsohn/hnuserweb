var hnuserstats = require("../lib/hnuserstats.js");
hnuserstats.hnuserstats("jaredsohn", function(err, results)
{
	// TODO: rewrite this
	if ((results.comment_count > 0) && (results.userinfo.id != null))
		console.log("passed");
});
