'use strict';

module.exports = function (options) {

    var proxy = require('./proxy'),
        utils = require('./utils'),
        debug = require('debug')('groundhog:recorder'),
        fs = require('fs'),
        _ = require('underscore');

    var counts = {};

    return function (req, res) {

        req.headers.host = options.hostname;

        proxy(req, function (err, response) {
            var body = '';
            if (err) {
                error();
            } else {
                res.statusCode = response.statusCode;
                _.each(response.headers, function (val, name) {
                    res.setHeader(name, val);
                });
                response.on('data', function (chunk) {
                    body += chunk;
                    res.write(chunk);
                });
                response.on('end', function () {
                    saveResponse(utils.key(req), response, body, function () {
                        if (err) {
                            error();
                        } else {
                            res.end();
                        }
                    });
                });
            }
        });

        function error() {
            res.statusCode = 500;
            res.end();
        }

        function saveResponse(file, response, body, callback) {
            if (counts[file] === undefined) {
                counts[file] = 0;
            }
            var count = counts[file],
                filename = file + '__'  + count;

            var content = {
                status: response.statusCode,
                headers: response.headers,
                body: body
            };
            debug('Writing file: ', filename);
            fs.writeFile(options.dir + '/' + filename + '.json', JSON.stringify(content, null, '\t'), function (err) {
                if (err) {
                    debug('Failed to write: ', options.dir + '/' + filename + '.json');
                    callback(err);
                } else {
                    counts[file]++;
                    callback();
                }
            });

        }

    };

};