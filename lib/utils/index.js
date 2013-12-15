var fs = require('fs'), path = require('path'), zlib = require('zlib');

var slugify = exports.slugify = function(value) {
	if(!value) return "";
	return value.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};
// Mainfunction to recieve and process the file upload data asynchronously
var uploadImage = exports.uploadImage = function(path, filename, type, S3, callback) {
	/*
	 * S3 GZip upload
	 */

	var expires = new Date(new Date().getTime() + (31556926 * 1000)).toUTCString();
	var headers = {
		'Set-Cookie' : '',
		'response-content-type' : type,
		'Content-Type' : type,
		'response-cache-control' : 'maxage=31556926',
		'Cache-Control' : 'maxage=31556926',
		'response-expires' : expires,
		'Expires' : expires,
		'response-content-encoding' : 'gzip',
		'Content-Encoding' : 'gzip'
	};
	fs.readFile(path, function(err, data) {
		zlib.gzip(data, function(err, buffer) {
		    S3.putBuffer(buffer, encodeURIComponent(filename), headers, function (err, response) {
				if(err)
					winston.error(err);
				if(response.statusCode !== 200)
					winston.error('unsuccessful upload of image "' + filename + '" to S3');
				else {
					winston.info('successfully uploaded image "' + filename + '" to S3');
					if(callback)
						callback(filename);
				}
				// Hack to preserve original timestamp for view helper
				// fs.utimesSync(image, new Date(timestamp), new Date(timestamp));
			});
		});
	});
};
// Moves a file asynchronously over partition borders
var moveFile = exports.moveFile = function(source, dest, callback) {
	/*var is = fs.createReadStream(source)

	 is.on('error', function (err) {
	 console.log('moveFile() - Could not open readstream.', err);
	 callback('Sorry, could not open readstream.')
	 });
	 is.on('end', function () {
	 fs.unlinkSync(source);
	 callback("Finished moving file: " + dest);
	 });
	 var os = fs.createWriteStream(dest);
	 os.on('error', function (err) {
	 console.log('moveFile() - Could not open writestream.', err);
	 callback('Sorry, could not open writestream.');
	 });

	 is.pipe(os);*/
	fs.exists(dest, function(exists) {
		/*if(!exists)
			fs.mkdirSync(dest);
*/
		copy(source, dest, function(err) {
			winston.info(err);
			fs.unlinkSync(source);
			callback("Finished moving file: " + dest) 
		})
	});
};

exports.processImageUrl = function(imageUrl, filename, s3, callback) {
var http = require('http');
var https = require('https');
var gm = require('gm');
var client = http;
if (imageUrl.substr(0, 5) == 'https') { client = https; }
winston.info("Getting:", imageUrl)
client.get(imageUrl, function(res) {
    if (res.statusCode != 200) {
        return callback(new Error('HTTP Response code ' + res.statusCode));
    }
    winston.info("Response:", res.statusCode )
    gm(res)
        .resize(255)
        .stream('jpg', function(err, stdout, stderr) {
            if (!err) {
                winston.info("Downloading...")
                var bufs = [];
                stdout.on('data', function(d){ bufs.push(d); });
                stdout.on('end', function(){
                  var buf = Buffer.concat(bufs);
                    var headers = {
                        'Content-Length': buf.length
                        , 'Content-Type': 'Image/jpeg'
                    };
                    winston.info("Uploading:", filename)
                    s3.putBuffer(buf,  filename, headers, function(err, res) {
                        if(err) {
                            return callback(err);
                        } else {
                            return callback(null, res.client._httpMessage.url);
                        }
                    });
                });
            } else {
                callback(err);
            }
        });
    }).on('error', function(err) {
        callback(err);
    });
};

/* PRIVATE */

var createStream = function(type, path, erred, opened) {
	var StreamType = (type === 'read') ? 'createReadStream' : 'createWriteStream';

	if( typeof (opened) !== 'function') {
		opened = erred;
	};

	var stream = fs[StreamType](path);

	stream.on('error', erred.bind(stream));
	stream.on('open', opened.bind(stream, null, stream));

	return stream;
};
var createReadStream = createStream.bind(this, 'read');
var createWriteStream = createStream.bind(this, 'write');

var copy = function(from, to, cb) {
	createReadStream(from, cb, function(err, fromStream) {
		createWriteStream(to, cb, function(err, toStream) {
			fromStream.pipe(toStream);
			fromStream.on('end', cb);
		});
	});
};
