# hnuserdownload

Downloads Hacker News comments/submissions for a user.  Can be used as a module or from the commandline.

## How to use

Install

```bash
$ npm install hnuserdownload
```

Include the module and run

```javascript
var hnuserdownload = require('hnuserdownload');
    
hnuser(id, function(err, results) {
  if (err) console.log(err);
  console.log(csv);
});
```

## Features

* Pages through results to get all comments and stories created by a user.
* Optionally stores data as JSON and CSV

## Limitations

* Algolia (the source of the data) sets a limit of 1000 requests per hour.  If making heavy use of the API, make sure that you look at the num_requests output to limit usage so that you do not get banned.

## Use as a module

### Example

```javascript
var hnuserdownload = require('hnuserdownload');
hnuserdownload.hnuserdownload("pg", function(err, results)
{
	console.log(results);
});
```

There is also a method available to assist creating a CSV file.

## Command Line Interface

`hnuserdownload` can also be called from the command line

```bash
Usage: hnuserdownload username [json] [csv]
```


The username is required. Include json and/or csv to create output files.  The files will be named automatically based on the username.
      

## Other ways to use it

hnuserstats (in progress) makes use of this library and includes statistics.  That library will have a web frontend at [http://hnuser.herokuapp.com/] and Chrome extension frontend at [http://github.com/jaredsohn/hnkarmabreakdown].


## About

Written by [Jared Sohn](mailto: jared.sohn@gmail.com).
