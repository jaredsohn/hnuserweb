
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
			data: results,
			raw: JSON.stringify(results)
		});
	});
}