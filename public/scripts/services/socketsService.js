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

// CLIENT SIDE --------------------------------------------------------------------------------------------

'use strict';

/**
 * Creates sockets for use by interested client parties.
 */
horaceApp.service('SocketsService', function () {

    /** chatSocket: a test socket */
    var chatSocket = io.connect(clientConfig.chatSocket);
    chatSocket.on('connection', function (sock) {
        console.info('Client chatSocket connected');
    });

    /** noteSocket Socket: socket used to communicate notifications from server */
    var noteSocket = io.connect(clientConfig.notificationSocket);
    noteSocket.on('connection', function (sock) {
        console.info('Client noteSocket connected');
    });
    noteSocket.on('note', function (notification) {
        if (notification && notification.type && notification.msg) {
            console.info('SERVER NOTIFICATION: ' + JSON.stringify(notification));
            if (displayNotification) {
                displayNotification(notification.type, notification.msg, clientConfig.icon.notification, 2, undefined);
            }
        } else {
            console.info('BAD SERVER NOTIFICATION');
        }
    });

    // dummy for testing
    chatSocket.on('pageview', function (msg) {
        $('#pageViews').append('<h4 style="color:blue">' + JSON.stringify(msg) + '</h4>');
    });
    chatSocket.emit('message', 'The chat channel is open');

    return {
        chatSocket: chatSocket,
        noteSocket: noteSocket
    };
});