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
 * Session cookies.
 */

"use strict";

var config;

/**
 * Configures session cookie management
 * @param app The application
 * @param cb An optional callback function(err) which is called either with an error or without.
 */
exports.use = function(app, cb) {

    config = app.get('config');

    var url = app.get('db').makeDbUrl(config.db, config.db.sessionDb);

    var MongoStore = app.get('mongoStore');
    var store = new MongoStore({url: url});
    if (!store) {
        var err = new Error('Session store not created for url=' + url);
        if (cb) {cb(err); } // callback with error
        throw {msg: err}; // throw here if no callback
    }
    app.use(app.get('express').session({store: store, key: config.rest.session.key, secret: config.rest.session.secret, cookie: {maxAge: config.rest.session.maxAge}}));

    if (config.rest.session.verbose) {
        console.info('Configured Session: db=' + config.db.sessionDb + " key=" + config.rest.session.key + " secret=" + config.rest.session.secret + " maxAge=" + config.rest.session.maxAge);
    }
    if (cb) {cb(); } // callback without error
};

/**
 * Default handler for basic session state.
 * Handles view count, etc.
 * @param req   The http request
 * @param res   The http response
 * @param next  Optional next closure for handling http transaction
 */
exports.handle = function(req, res, next) {
    var sess = req.session;
    if (!sess) {
        throw {msg: 'Invalid session'};
    } else {
        if (sess.views) {
            sess.views += 1;
        } else {
            sess.views = 1;
        }
        var last = (sess.lastAccess === undefined) ? null : new Date(JSON.parse(sess.lastAccess));
        if (config.rest.session.verbose) {
            console.info('Session ' + sess.id + ' lastAccess: ' + last + ' expires: ' + sess.cookie._expires + ' maxAge: ' + (sess.cookie.originalMaxAge / (1000 * 60)) + ' minutes' + ' views=' + sess.views);
        }
    }
    if (next) {
        next();
    }
};