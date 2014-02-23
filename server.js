/**
 The MIT License (MIT)

 Copyright (c) 2014 Ruben Kleiman

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
    path = require('path'),
    sessionSockets,
    io = require('socket.io'),

    db = require('./lib/db'),
    routes = require('./lib/routes'),
    session = require('./lib/session'),
    cookieParser,
    appUtils = require('./lib/utilities/generalUtils.js'),

    app = express(),
    httpServer = require('http').createServer(app),
    env = app.get('env'),

    config = require('./config/server-config.js')(env);

console.info('Environment: %s\nLocation: %s\nConfiguration:\n',
    env, __dirname, JSON.stringify(config, null, 2));

// Configure express for all environments
app.configure(function () {
    if (env === 'development') {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    }

    app.use(express.bodyParser());
    app.use(express.methodOverride());
//    app.use(express.logger());
    app.set('config', config); // Our app's configuration object
    app.set('db', db); // Our wrapper to the DB implementation
    app.set('routes', routes); // Router
    app.set('session', session); // Session management
    app.set('dirname', __dirname); // Root directory name
    app.set('appUtils', appUtils); // Our app's utilities
    app.set('views', path.join(__dirname, 'lib/views'));  // Our app's views
    app.set('view engine', 'hjs'); // The HJS engine
    app.use(express.favicon(__dirname + '/app/images/favicon.ico'));
    app.use(express.cookieParser()); // Initialize cookie management
    cookieParser = express.cookieParser(config.rest.session.secret);
    sessionSockets = session.use(app, io, cookieParser, config.rest.session.key); // Initialize session management
    app.use(app.router); // Initialize REST routes
    var stat = express['static']; // Use this to prevent JLint error (static is a reserved word)
    app.use(stat(path.join(__dirname, 'public'))); // Configure our app's statics server
    db.use(app, function (err) { // First initialize our DB wrapper
        if (err) {
            throw {type: 'fatal', msg: 'DB not created: ' + err};
        } else {
            routes.use(app, function (err) { // Then initialize the router, which relies on our DB being initialized
                if (err) {
                    throw {type: 'fatal', msg: 'Routes not created: ' + err};
                }
            });

            require('./lib/routes/sockets.js').init(app, sessionSockets, httpServer); // Open socket.io communication
        }
    });
});

var port = config.rest.port || process.env.NODE_SERVER_PORT || 80;

// Initialize the server and get it back
var server = httpServer.listen(port);
console.info('HTTP server listening on port %d, environment=%s', port, env);

