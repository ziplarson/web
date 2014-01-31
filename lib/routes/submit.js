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

// SERVER SIDE --------------------------------------------------------------------------------------------

module.exports = function submit(app) {

    var fs = app.get('fs');
    /* File system to read uploaded file from tmp location */
    var db = app.get('db');
    /* All db methods */
    var appUtils = app.get('appUtils');
    /* App utilities */
    var schemas = require('../../public/scripts/app/schema.js');
    /* Object schemas and definitions */
    var catalogService = require('../services/catalogService.js').catalogService;
    /* The catalog service */

    // Login authentication methods
    // TODO Replace this with https://github.com/andrewrk/node-multiparty/ for connect-3.0
    app.namespace('/submit', function processSubmit() {

        app.post('/', function (req, res, next) {

            res.json({ok: true}); // send response immediately (errors reported later through error socket)

            var catalog = new schemas.schema.Catalog();
            var prop;
            for (prop in req.body) {
                // SECURITY POINT: make sure that the property exists in the catalog!
                if (req.body.hasOwnProperty(prop) && catalog.hasOwnProperty(prop)) {
                    var item = req.body[prop];
                    catalog[prop] = appUtils.sanitizeObject(item);
                }
            }
            var filepath = req.files.work.path;
            fs.readFile(filepath, {encoding: "UTF-8"}, function (err, content) {
                fs.unlink(filepath, function (err) { /* remove file from tmp location */
                    if (err) {
                        console.warn('Failed to unlink tmp file ' + err);
                    }
                });
                catalog.content = content;
                try {
                    catalogService.processCatalog(req.session, catalog, true);
                } catch (e) {
                    e.type = e.type || 'fatal';
                    app.get('sockets').getSocket(req.session, 'note').emit('note', e);
                }
            });
//                res.redirect("back"); /* go back one page after the upload */
        });

    });
};

