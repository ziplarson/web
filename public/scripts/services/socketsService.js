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
horaceApp.service('SocketsService', ['ConfigService', 'NotificationService', function (ConfigService, NotificationService) {

    // Chat Socket --------------------------------------------------------------------------------------------------
    /** chatSocket: a test socket */
    var chatSocket = io.connect(ConfigService.chatSocketPath);
    chatSocket.on('connection', function (sock) {
        console.info('chatSocket: Connected');
        sock.on('connecting',function () {
            console.info('chatSocket: Connecting...');
        });
        sock.on('disconnect', function () {
            console.info('chatSocket: Disconnected');
        });
        sock.on('connect_failed',function () {
            console.info('chatSocket: Connect failed');
        });
        sock.on('reconnecting',function () {
            console.info('chatSocket: Reconnecting...');
        });
        sock.on('reconnect',function () {
            console.info('chatSocket: Reconnected');
        });
        sock.on('reconnect_failed',function () {
            console.info('chatSocket: Reconnect failed');
        });
        sock.on('error', function () {
            console.info('chatSocket: Some socket error');
        });
    });

    // Transaction Socket -------------------------------------------------------------------------------------------
    var txSocket = io.connect(ConfigService.txSocketPath);
    txSocket.on('connection', function (sock) {
        alert('txSocket: Connected');
        sock.on('connecting',function () {
            alert('txSocket: Connecting...');
        });
        sock.on('disconnect', function () {
            console.info('txSocket: Disconnected');
        });
        sock.on('connect_failed',function () {
            console.info('txSocket: Connect failed');
        });
        sock.on('reconnecting',function () {
            console.info('txSocket: Reconnecting...');
        });
        sock.on('reconnect',function () {
            console.info('txSocket: Reconnected');
        });
        sock.on('reconnect_failed',function () {
            console.info('txSocket: Reconnect failed');
        });
        sock.on('error', function () {
            console.info('txSocket: Some socket error');
        });
    });

    /**
     * catalogTx: result of attempt to create or update a catalog item.
     */
    txSocket.on('catalogTx', function(tx) {
        var fback = jQuery('#feedback');
        if (fback) {
            if (tx.status === 'error') {
                fback.css('color', 'red');
            } else if (tx.status === 'ok') {
                fback.css('color', 'green');
            }
            fback[0].innerHTML = tx.msg;
        }
    });



    // Note Socket --------------------------------------------------------------------------------------------------
    /** noteSocket Socket: socket used to communicate notifications from server */
    var noteSocket = io.connect(ConfigService.notificationSocketPath);

    /* noteTitle: key := the notification type, value := the title to use in the notification */
    var noteTitle = {trans: 'Technical Problem', error: 'Error', warn: 'Warning', note: 'Note'};

    /**
     * Returns an appropriate message for the specified notification
     * @param note  The notification object
     * @returns {string} The message text
     */
    noteSocket.makeMessage = function (note) {
        var msg = note.msg;
        if (note.type === 'fatal') {
            msg = 'Our site is currently down for maintenance. Our apologies. Please try again later.';
            console.error(note);
        } else if (note.type === 'trans') {
            msg = 'Due to a technical problem, your request was not fulfilled. Please try again.';
            console.error(note);
        }
        return msg;
    };

    /**
     * Returns an appropriate notification icon based on the specified notification type.
     * @param noteType  The notification type.
     * @returns {ConfigService.icon.notification|*}
     */
    noteSocket.getIcon = function (noteType) {
        return ConfigService.icon.notification; // TODO create warning and error icons
    };

    noteSocket.on('connection', function (sock) {
        console.info('noteSocket: Connected');
        sock.on('connecting',function () {
            console.info('noteSocket: Connecting...');
        });
        sock.on('disconnect', function () {
            console.info('noteSocket: Disconnected');
        });
        sock.on('connect_failed',function () {
            console.info('noteSocket: Connect failed');
        });
        sock.on('reconnecting',function () {
            console.info('noteSocket: Reconnecting...');
        });
        sock.on('reconnect',function () {
            console.info('noteSocket: Reconnected');
        });
        sock.on('reconnect_failed',function () {
            console.info('noteSocket: Reconnect failed');
        });
        sock.on('error', function () {
            console.info('noteSocket: Some socket error');
        });
    });

    /**
     * Receives a notification from the server.
     */
    noteSocket.on('note', function (note) {
        if (note && note.type && note.msg) {
//            console.info('SERVER NOTIFICATION: ' + JSON.stringify(note));
            var title = noteTitle[note.type] || 'Error';
            var msg = noteSocket.makeMessage(note);
            var icon = noteSocket.getIcon(note.type);
            NotificationService.displayNotification(title, msg, icon, 0, undefined);
        } else {
            console.info('BAD SERVER NOTIFICATION: ' + JSON.stringify(note));
        }
    });

    // dummy for testing
    chatSocket.on('echo', function (msg) {
        $('#pageview').append('<h4 style="color:blue">' + JSON.stringify(msg) + '</h4>');
    });


    // Return the socket service
    return {
        chatSocket: chatSocket,
        noteSocket: noteSocket,
        txSocket: txSocket
    };

}]);