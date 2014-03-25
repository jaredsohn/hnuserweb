
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var connect = require("connect");
var slashes = require("connect-slashes");


var app = express();

// all environments
app.set('strict routing', true);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set("jsonp callback", true);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(slashes(true));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/user/:id/json/', user.get_json);
app.get('/user/:id/csv/', user.get_csv);
app.get('/user/:id/stats_csv/', user.get_stats_csv);
app.get('/user/:id/stats_json/', user.get_stats_json);
app.get('/user/:id/', user.get);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
