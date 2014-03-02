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

// SERVER-SIDE ---------------------------------------------------------------------------------------------------

/**
 *
 * @param app
 */
module.exports = function (app) {

    app.namespace('/sys', function () {

        app.get('/status', function (req, res, next) {
            global.gc();
            var mem = process.memoryUsage();
            var x = mem.heapUsed / mem.heapTotal;
            var pct = parseInt(100 * x, 10);
            res.json({type: 'ack', msg: ' Heap Used: ' + pct + '% \nHeap (used/total kbytes): ' + parseInt(mem.heapUsed / 1000, 10) + '/' + parseInt(mem.heapTotal / 1000, 10) + '\n Stack (kbytes): ' + parseInt(mem.rss / 1000, 10)});
        });
    });

};