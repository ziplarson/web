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

    /* Is permission to use notifications granted? */
    var granted = false;

    if (!Notification) {
        alert('Sorry, but your browser settings do not support notifications.');
    }

    function setPermissionState (state, callback) {
        granted = state;
        if (callback) {
            callback();
        }
        console.log('Notification permission ' + (granted ? 'granted' : 'not granted'));
    }

    /**
     * Checks whether we are permitted to use the notification system.
     * Sets var granted to true if permission is granted.
     * Will display a notification by calling callback if it is provided.
     */
    var checkPermission = function (callback) {

        if (Notification.permission === 'granted') {
            setPermissionState(true, callback);
        } else {
            try {
                Notification.requestPermission(function (status) {
                    if (status && status === "granted") {
                        setPermissionState(true, callback);
                    }
                });
            } catch (reqErr) {
                console.error(reqErr);
                alert('Sorry, but your browser settings do not support notifications.');
            }
        }
    };


    var displayNotification = function (title, message, icon, delay, onclick) {
        var instance;

        function doDisplay() {
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
        }

        if (!granted) {
            checkPermission(doDisplay);
        } else {
            doDisplay();
        }
    };

    return {
        displayNotification: displayNotification
    };
});
