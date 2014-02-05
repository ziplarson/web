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

/* CLIENT SIDE ------------------------------------------------------------------------------------- */

'use strict';

horaceApp.service('NotificationService', function () {

    var Notification = window.Notification || window.mozNotification || window.webkitNotification || window.msNotification,
        FileReader = window.FileReader || window.mozFileReader || window.webkitFileReader || window.msFileReader;

    if (!Notification) {
        console.error('no notification support');
    }

    var checkPermission = function () {
        if (Notification.permission !== 'granted') {
            console.log('Getting permission...');
            Notification.requestPermission(function (status) {
                console.log('Returned permission status');
                if (status && status === "granted") {
                    console.log('Permission granted!');
                } else {
                    console.log('Permission NOT granted!');

                }
            });
        } else {
            console.log('checkPermission: ' + Notification.permission);
        }
    };


    var displayNotification = function (title, message, icon, delay, onclick) {
        var instance;

        checkPermission();

//    console.log('Current Notification Permission: ' + Notification.permission);

        if (title.length > 0) {
            var attributes = {lang: 'en'};

            delay = Math.max(0, Math.min(60, delay));

            if (message.length > 0) {
                attributes.body = message.substr(0, 250);
            }

            if (icon !== undefined && icon.length > 0) {
                attributes.icon = icon;
            }

            if (delay > 0) {
                window.setTimeout(function () {

                    instance = new Notification(title.substr(0, 100), attributes);
                    if (onclick !== undefined) {
                        instance.onclick = onclick;
                    }
                }, delay * 1000);
            } else {
                instance = new Notification(title.substr(0, 100), attributes);

                if (onclick !== undefined) {
                    instance.onclick = onclick;
                }
            }
        }
    };

    return {
        displayNotification: displayNotification
    };
});
