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

// SERVER SIDE --------------------------------------------------------------------------------------------

/**
 * session/index.js
 *
 * Supports session-based sockets. Allows client to
 * access the session when the socket is known.
 */

"use strict";

var config;

/* SessionSockets: code borrowed from session.socket.io and integrated here */
var SessionSockets = function (io, sessionStore, cookieParser, sessionKey) {
    if (!sessionKey) {
        throw {type: 'fatal', msg: 'Missing session key'};
    }

    this.getSession = function (socket, callback) {
        if (!socket) {
            throw {type: 'fatal', msg: 'socket is not defined'};
        }
        cookieParser(socket.handshake, {}, function (parseErr) {
            if (!socket) {
                callback({type: 'trans', msg: 'socket not defined in cookieParser'});
                return;
            }
            var handshake = socket.handshake;
            var cookie = (handshake &&
                (handshake.secureCookies && handshake.secureCookies[sessionKey]) ||
                (handshake.signedCookies && handshake.signedCookies[sessionKey]) ||
                (handshake.cookies && handshake.cookies[sessionKey]));
            if (!cookie) {
                callback({type: 'trans', msg: 'Could not find cookie session id ' + sessionKey}); // TODO trans or ?
                return;
            }
            sessionStore.load(cookie, function (storeErr, session) {
                var err = parseErr || storeErr || null;
                if (!err && !session) {
                    err = {type: 'trans', msg: 'Could not lookup session by key: ' + sessionKey}; // TODO trans or ?
                }
                callback(err, session);
            });
        });
    };
};

/**
 * Configures session cookie management
 * @param app The application
 */
var use = function (app, io, cookieParser, sessionKey) {

    config = app.get('config');
    var db = app.get('db'),
        express = require('express'),
        url = db.makeDbUrl(config.db, config.db.sessionDb),
        SessionStore = require('connect-mongodb'),
        store = new SessionStore({url: url});
    if (!store) {
        throw {type: 'fatal', msg: 'Session store not created for url=' + url};
    }
    app.use(express.session({store: store, key: config.rest.session.key, secret: config.rest.session.secret, cookie: {maxAge: config.rest.session.maxAge}}));

    if (config.rest.session.verbose) {
        console.log('Configured Session: db=' + config.db.sessionDb + " key=" + config.rest.session.key + " secret=" + config.rest.session.secret + " maxAge=" + config.rest.session.maxAge);
    }

    // Now let sockets keep the current session
    return new SessionSockets(io, store, cookieParser, sessionKey);
};

exports.use = use;


/**
 * TODO get rid of this sample code (used by users.js router)
 * Default handler for basic session state.
 * Handles view count, etc.
 * @param req   The http request
 * @param res   The http response
 * @param next  Optional next closure for handling http transaction
 */
exports.handle = function (req, res, next) {
    var sess = req.session;
    if (!sess) {
        throw {type: 'trans', msg: 'Invalid session state: no session'};
    } else {
        if (sess.views) {
            sess.views += 1;
        } else {
            sess.views = 1;
        }
        var last = (sess.lastAccess === undefined) ? null : new Date(JSON.parse(sess.lastAccess));
        if (config.rest.session.verbose) {
            console.log('Session ' + sess.id + ' lastAccess: ' + last + ' expires: ' + sess.cookie._expires + ' maxAge: ' + (sess.cookie.originalMaxAge / (1000 * 60)) + ' minutes' + ' views=' + sess.views);
        }
    }
    if (next) {
        next();
    }
};