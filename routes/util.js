// from http://stackoverflow.com/questions/19734219/ajax-with-node-js-jade
app.get('/ajax', function(req, res) {
    fs.readFile(req.query.file, 'utf8', function (err, data) {
        if (err) throw err;     
        var fn = jade.compile(data);
        var html = fn({});
        res.send(html);
    });
});