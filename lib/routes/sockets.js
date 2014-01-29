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
exports.init = function (app, server) {

    // dbg
    function showConnections(prefix, socket) {
        var cache = socket.cache;
        var msg = '';
        var cacheName;
        for (cacheName in cache) {
            msg += cacheName + ': ';
            var socketMap = cache[cacheName];
            if (socketMap) {
                var socketId;
                for (socketId in socketMap) {
                    msg += ' ' + socketId;
                }
            }
            msg += '\n';
//            if (cacheName === 'chat' || cacheName === 'note' || cacheName == 'tx') {
//            }
        }
        console.info(prefix + msg);
    }

    io = io.listen(server);
    io.set('log level', 1); // debug level

    /* cacheTypes: the types of socket caches supported */
    var cacheTypes = ['note', 'tx', 'chat'];

    /* socketCache: caches sockets by socket type */
    var socketCache = {note: {}, tx: {}, chat: {}};


    /**
     * Checks whether the type of cache is valid.
     * @param type The type (one of cacheTypes)
     * @throws Fatal error if the cache type is invalid.
     */
    function checkCacheType(type) {
        if (cacheTypes.indexOf(type) === -1) {
            throw {type: 'fatal', msg: 'Invalid socket cache type ' + type};
        }
    }

    /**
     * Returns the socket for the given type and socket id.
     * @param type  The type. One of 'note' (note socket),
     * 'chat' (chat socket), or 'tx' (transaction socket).
     * @param socketId The socket id
     * @throws Transient error if there is no socket of the given type.
     * Considering it transient because it might be due to a race
     * condition. Transients get logged.
     */
    var getSocket = function (type) {
        checkCacheType(type);
        var session = app.get('session');
        if (typeof session === 'undefined') {
            throw {type: 'trans', msg: 'No session exists'};
        }
        if (typeof session.sockets !== 'undefined') {
            return session.sockets[type];
        }
        throw {type: 'trans', msg: 'No socket type ' + type + ' for session'};
    };

    app.set('sockets', {cache: socketCache, getSocket: getSocket});

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
     * @param socket    The socket
     */
   function addToSession(type, socket) {
       checkCacheType(type);
       var session = app.get('session');
       if (typeof session !== 'undefined') {
           if (typeof session.sockets === 'undefined') {
               session.sockets = {};
           }
           session.sockets[type] = socket;
       }
   }

    /**
     * Removes a socket/session association.
     * @param type  The socket type.
     */
    function removeFromSession(type) {
        checkCacheType(type);
        var session = app.get('session');
        if (typeof session !== 'undefined' && typeof session.sockets !== 'undefined') {
            delete session.sockets[type];
        }
    }

    io.of('/note').on('connection',function (noteSocket) {
        console.info('Server noteSocket ' + noteSocket.id + ' connected. # total connections=' + Object.keys(io.connected).length);
        var sockets = app.get('sockets');
        sockets.cache.note[noteSocket.id] = noteSocket;
        addToSession('note', noteSocket);
        showConnections('AFTER CONNECT:\n', sockets);

        noteSocket.on('disconnect', function () {
            var sockets = app.get('sockets');
            console.info('DISCONNECTED noteSocket ' + this.id + ' # total connections=' + Object.keys(io.connected).length);
            delete sockets.cache.note[this.id];
            removeFromSession('note');
            showConnections('AFTER DISCONNECT:\n', sockets);
        });
    }).on('connect_failed',function () {
            console.warn('Connect noteSocket failed');
        }).on('error', function () {
            console.warn('Error on noteSocket');
        });


    io.of('/tx').on('connection', function (txSocket) {
        var sockets = app.get('sockets');
        console.info('Server txSocket ' + txSocket.id + ' connected. # total connections=' + Object.keys(io.connected).length);
        sockets.cache.tx[txSocket.id] = txSocket;
        addToSession('tx', txSocket);

        showConnections('AFTER CONNECT:\n', sockets);

        txSocket.on('disconnect', function () {
            console.info('DISCONNECTED txSocket ' + this.id + ' # total connections=' + Object.keys(io.connected).length);
            var sockets = app.get('sockets');
            delete sockets.cache.tx[this.id];
            removeFromSession('tx');
            showConnections('AFTER DISCONNECT:\n', sockets);
        });
    });

    /** Just to test sockets */
    io.of('/chat').on('connection',function (chatSocket) {
        var sockets = app.get('sockets');
        console.info('Server chatSocket ' + chatSocket.id + ' connected. # total connections=' + Object.keys(io.connected).length);
        sockets.cache.chat[chatSocket.id] = chatSocket;
        addToSession('chat', chatSocket);
        showConnections('AFTER CONNECT:\n', sockets);

        chatSocket.on('disconnect', function () {
            var sockets = app.get('sockets');
            delete sockets.cache.chat[this.id];
            removeFromSession('chat');
            console.info('DISCONNECTED chatSocket ' + this.id + ' # total connections=' + Object.keys(io.connected).length);
            showConnections('AFTER DISCONNECT:\n', sockets);
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