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


/**
 * Created by Ruben Kleiman (rk@post.harvard.edu) on 11/11/13.
 * web app entry point.
 */
"use strict";

var express = require('express'),
    namespace = require('express-namespace'),
    http = require('http'),
//    socketio = require('socket.io'),
    path = require('path'),
//    fs = require('fs'),
    format = require('util').format,
    mongodb = require('mongodb'),
    mongoStore = require('connect-mongodb'),
    hogan = require('hjs'),

    db = require('./lib/db'),
    routes = require('./lib/routes'),
    session = require('./lib/session'),

    app = express(),
    httpServer = http.createServer(app),
    env = app.get('env'),

    config = require('./config/server-config.js')(env);

console.info('Environment: %s\nLocation: %s\nConfiguration:\n',
    env, __dirname, JSON.stringify(config, null, 2));

// Express Configuration
app.configure(env, function () {
    if ('production' === env) {
        app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico')));
        app.use(express.static(path.join(__dirname, 'public')));
        return;
    }
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
//    app.use(express.logger('dev'));
//    app.use(express.bodyParser());
//    app.use(express.methodOverride());
    app.set('config', config);
    app.set('express', express);
    app.set('hogan', hogan);
    app.set('mongodb', mongodb);
    app.set('mongoStore', mongoStore);
    app.set('db', db);
    app.set('routes', routes);
    app.set('session', session);
    app.set('views', path.join(__dirname, 'lib/views'));
    app.set('view engine', 'hjs');
    app.use(express.favicon(__dirname + '/app/images/favicon.ico'));
    app.use(express.cookieParser());
    session.use(app);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'app')));
    db.use(app, function (err) {
        if (err) {
            throw ('Error DB creation: ' + err);
        } else {
            routes.use(app, function (err) {
                if (err) {
                    throw ('Error Routes creation: ' + err);
                }
            });
        }
    });
});

httpServer.listen(config.rest.port);

console.info('Server listening on port %d, environment=%s', config.rest.port, env);

