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

    // Transaction Socket -------------------------------------------------------------------------------------------
    var txSocket = io.connect(ConfigService.txSocketPath);
    txSocket.on('connection', function (sock) {
        alert('txSocket: Connected');
        sock.on('connecting',function () {
            alert('txSocket: Connecting...');
        });
        sock.on('disconnect', function () {
            console.log('txSocket: Disconnected');
        });
        sock.on('connect_failed',function () {
            console.log('txSocket: Connect failed');
        });
        sock.on('reconnecting',function () {
            console.log('txSocket: Reconnecting...');
        });
        sock.on('reconnect',function () {
            console.log('txSocket: Reconnected');
        });
        sock.on('reconnect_failed',function () {
            console.log('txSocket: Reconnect failed');
        });
        sock.on('error', function () {
            console.log('txSocket: Some socket error');
        });
    });

    /**
     * catalogTx: result of attempt to create or update a catalog item.
     */
    txSocket.on('catalog/submit/metadata', function(tx) {
        var fback = jQuery('#debuginfo');
        console.info('hello');
        if (fback) {
            if (tx.type === 'trans') {
                fback.css('color', 'blue');
            } else if (tx.type === 'ack') {
                fback.css('color', 'green');
            } else {
                fback.css('color', 'red');
            }
            fback[0].innerHTML = tx.type + ': ' + tx.msg + ' (txId=' + tx.txId + ')';
        }
    });



    // Note Socket --------------------------------------------------------------------------------------------------
    /** noteSocket Socket: socket used to communicate notifications from server */
    var noteSocket = io.connect(ConfigService.notificationSocketPath);

    /* noteTitle: key := the notification type, value := the title to use in the notification */
    var noteTitle = {trans: 'Technical Problem', error: 'Error', warn: 'Warning', ack: 'Note', note: 'Note'};

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
            console.error(JSON.stringify(note));
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
        console.log('noteSocket: Connected');
        sock.on('connecting',function () {
            console.log('noteSocket: Connecting...');
        });
        sock.on('disconnect', function () {
            console.log('noteSocket: Disconnected');
        });
        sock.on('connect_failed',function () {
            console.log('noteSocket: Connect failed');
        });
        sock.on('reconnecting',function () {
            console.log('noteSocket: Reconnecting...');
        });
        sock.on('reconnect',function () {
            console.log('noteSocket: Reconnected');
        });
        sock.on('reconnect_failed',function () {
            console.log('noteSocket: Reconnect failed');
        });
        sock.on('error', function () {
            console.log('noteSocket: Some socket error');
        });
    });

    /**
     * Receives a notification from the server.
     */
    noteSocket.on('note', function (note) {
        if (note && note.type && note.msg) {
            var title = noteTitle[note.type] || 'Unknown Error';
            var msg = noteSocket.makeMessage(note);
            var icon = noteSocket.getIcon(note.type);
            NotificationService.displayNotification(title, msg, icon, 0, undefined);
        } else {
            console.log('BAD SERVER NOTIFICATION: ' + JSON.stringify(note));
        }
    });


    // Return the socket service
    return {
        noteSocket: noteSocket,
        txSocket: txSocket
    };

}]);