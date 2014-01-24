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

'use strict';

var clientConfig =
{
    /* Server's hostname */
    hostname: 'localhost',

    /* Server's port number */
    port: '3000',

    /**
     * @param path Optional path extension to the base URL
     * @returns {string} Returns the base url to access the server. TODO can this be pulled from the context?
     */
    getBaseUrl: function(path) {
        var base = 'http://' + clientConfig.hostname + ':' + clientConfig.port + '/';
        return path ? base + path : base;
    },

    /* notificationSocket: Used to get push notifications from server */
//    notificationSocket: clientConfig.getBaseUrl('note'),

    /* chatSocket: Used to hold a chat room for users */
//    chatSocket: clientConfig.getBaseUrl('chat'),

//    icon: {
//        notification: clientConfig.getBaseUrl('images/dfl-icon-250.png')
//    }

};

/* notificationSocket: Used to get push notifications from server */
clientConfig.notificationSocket = clientConfig.getBaseUrl('note');


/* chatSocket: Used to hold a chat room for users */
clientConfig.chatSocket = clientConfig.getBaseUrl('chat');

clientConfig.icon = {
    notification: clientConfig.getBaseUrl('images/dfl-icon-250.png')
};