/*
 *The MIT License (MIT)
 *
 *Copyright (c) 2013 Ruben Kleiman
 *
 *Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 *and associated documentation files (the "Software"), to deal in the Software without restriction,
 *including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 *subject to the following conditions:
 *
 *The above copyright notice and this permission notice shall be included in all copies or
 *substantial portions of the Software.
 *
 *THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 *INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
 *THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// SERVER SIDE --------------------------------------------------------------------------------------------

'use strict';

var io = require('socket.io');

/**
 * Initializes socket io communication.
 *
 * @param app   The express app
 * @param server    The http server.
 * @return Sets into the app the 'sockets' object (to get it: app.get('sockets'))
 * containing a sockets object with interesting sockets for use, including:
 * noteSocket: a socket for communicating errors to the client
 */
exports.init = function (app, sessionSockets, server) {

    io = io.listen(server);
    io.set('log level', 1); // debug level

    /* socketEvents: the types of socket events supported */
    var socketEventTypes = ['note', 'tx', 'chat'];


    /**
     * Checks whether the type of cache is valid.
     * @param type The type (one of cacheTypes)
     * @throws Fatal error if the cache type is invalid.
     */
    function checkEventType(type) {
        if (socketEventTypes.indexOf(type) === -1) {
            throw {type: 'fatal', msg: 'Invalid socket cache type ' + type};
        }
    }

    /**
     * Caches socket/session associations.
     * key := session id, value := <socketMap>
     * <socketMap> := (key := socket type, value := the socket)
     */
    var socketCache = {};

    /**
     * Returns the socket for the given type and socket id.
     * @param session   The session
     * @param type  The type. One of 'note' (note socket),
     * 'chat' (chat socket), or 'tx' (transaction socket).
     * @throws Transient error if there is no socket of the given type.
     * Considering it transient because it might be due to a race
     * condition. Transients get logged.
     */
    var getSocket = function (session, type) {
        checkEventType(type);
        if (typeof session === 'undefined') {
            throw {type: 'trans', msg: 'No session exists'};
        }
        var socket = socketCache[session.id][type];
        if (!socket) {
            throw {type: 'trans', msg: 'Failed to find expected socket type ' + type + ' for session id ' + session.id};
        }
        return socket;
    };

    app.set('sockets', {getSocket: getSocket});

    io.configure(function () {
        io.set('authorization', function (handshakeData, callback) {
            if (handshakeData.xdomain) {
                callback('Cross-domain connections are not allowed');
            } else {
                callback(null, true);
            }
        });
    });

    /**
     * Associates the socket with the session.
     * @param type  The socket type
     * @param session   The session
     * @param socket    The socket
     */
    function addSocketToSession(type, session, socket) {
        checkEventType(type);
        if (typeof session === 'undefined' || typeof socket === 'undefined') {
            throw {type: 'fatal', msg: 'No session and/or socket passed'};
        }
        if (!socketCache[session.id]) {
            socketCache[session.id] = {};
        }
        socketCache[session.id][type] = socket;
        console.log('Session id %s associated with %s socket id ', session.id, type, socket.id);
    }

    /**
     * Removes a socket/session association.
     * @param type  The socket type.
     * @param session   The session
     */
    function removeSocketFromSession(type, session) {
        checkEventType(type);
        if (typeof session !== 'undefined') {
            if (socketCache[session.id]) {
                delete socketCache[session.id][type];
                if (Object.keys(socketCache[session.id]).length === 0) {
                    delete socketCache[session.id];
                }
                console.log('Session id %s dissociated from %s socket', session.id, type);
            }
        }
    }

    io.of('/note').on('connection',function (noteSocket) {
        sessionSockets.getSession(noteSocket, function (err, session) {
            if (err) {
                // TODO send trans error to client
                console.error('Failed to get session from noteSocket. [%s]', JSON.stringify(err));
                return;
            }
//            console.log('%s total connections', Object.keys(io.connected).length);
            addSocketToSession('note', session, noteSocket);
        });

        noteSocket.on('disconnect', function () {
            var theSocket = this; // TODO always true? this is a flaky API should at least do a check on class type
            if (typeof theSocket.emit === 'undefined') {
                console.error('Disconnect "this" is not the disconnected socket!');
                return;
            }
            sessionSockets.getSession(theSocket, function (err, session) {
                if (err) {
                    console.error('Failed to disconnect from socket: %s', err);
                    return;
                }
                removeSocketFromSession('note', session);
//                console.log('%s total connections', Object.keys(io.connected).length);
            });
        });
    }).on('connect_failed',function () {
            console.warn('Connect noteSocket failed');
        }).on('error', function () {
            console.warn('Error on noteSocket');
        });


    io.of('/tx').on('connection', function (txSocket) {
        sessionSockets.getSession(txSocket, function (err, session) {
            if (err) {
                // TODO send trans error to client
                console.error('Failed to get session from txSocket (%s)', JSON.stringify(err));
                return;
            }
            addSocketToSession('tx', session, txSocket);
//            console.log('%s total connections', Object.keys(io.connected).length);
        });

        txSocket.on('disconnect', function () {
            var theSocket = this; // TODO always true? this is a flaky API should at least do a check on class type
            if (typeof theSocket.emit === 'undefined') {
                console.error('Disconnect "this" is not the disconnected socket!');
                return;
            }
            sessionSockets.getSession(theSocket, function (err, session) {
                if (err) {
                    console.error('Failed to disconnect from socket');
                    return;
                }
                removeSocketFromSession('tx', session);
//                console.log('%s total connections', Object.keys(io.connected).length);
            });
        });
    });

    /** Just to test sockets */
    io.of('/chat').on('connection',function (chatSocket) {
        // TODO integrate into session as in other sockets above
        var sockets = app.get('sockets');
        console.log('Server chatSocket ' + chatSocket.id + ' connected. # total connections=' + Object.keys(io.connected).length);

        chatSocket.on('disconnect', function () {
            console.log('DISCONNECTED chatSocket ' + this.id + ' # total connections=' + Object.keys(io.connected).length);
        });

        chatSocket.on('echo', function (message) { // echo
            chatSocket.emit('echo', message);
        });
    }).on('connect_failed',function () {
            console.warn('Connect chatSocket failed');
        }).on('error', function () {
            console.warn('Error on chatSocket');
        });
};