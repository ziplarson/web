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

    io = io.listen(server);
    io.set('log level', 1); // debug level

    app.set('sockets', {});

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
     * A channel for error communication. One-way to the client.
     */
    io.of('/note').on("connection", function (noteSocket) {
        console.info('Server noteSocket connected. # total connections=' + Object.keys(io.connected).length);
        app.get('sockets').noteSocket = noteSocket;
    });

    /**
     * A channel for handling various transactions.
     */
    io.of('/tx').on("connection", function (txSocket) {
        console.info('Server txSocket connected. # total connections=' + Object.keys(io.connected).length);
        app.get('sockets').txSocket = txSocket;
    });

    /** Just to test sockets */
    io.of('/chat').on("connection", function (chatSocket) {
        console.info('Server chatSocket connected. # total connections=' + Object.keys(io.connected).length);
        app.get('sockets').chatSocket = chatSocket;
        chatSocket.on('message', function (message) {
            chatSocket.emit('pageview', {'url': message});
        });
    });
};