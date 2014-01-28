/**
 The MIT License (MIT)

 Copyright (c) 2013 Ruben Kleiman

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// SERVER SIDE --------------------------------------------------------------------------------------------

/**
 * Index page for http routers.
 */
"use strict";

exports.use = function (app, cb) {

    /* Load routes */
    require('./users.js')(app);
    require('./submit.js')(app);

    var utils = app.get('utils'); /* App utilities */
    var util = require('util'); /* Nodejs utilities */

    // Call custom 404 error handler
    app.use(function (req, res, cb) {
        res.status(404);
        res.render('./404.hjs',
            {
                title: '404',
                error: 'File Not Found: ' + req.url
            }
        );
    });

    // Call custom 500 error handler
    app.use(function (error, req, res, cb) {
        res.status(500);
        res.render('./500.hjs',
            {
                title: '500',
                error: utils.sanitizeObject(util.inspect(error)) + '  Url: ' + req.url
            }
        );
    });

    if (cb) {
        cb();
    }
};
