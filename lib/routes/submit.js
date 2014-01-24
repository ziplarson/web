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

    var fs = app.get('fs'); /* File system to read uploaded file from tmp location */
    var db = app.get('db'); /* All db methods */
    var utils = app.get('utils'); /* App utilities */
    var schemas = require('../models/schema.js'); /* The schema */
    var catalogService = require('../services/catalogService.js').catalogService; /* The catalog service */

    // Login authentication methods
    app.namespace('/submit', function processSubmit() {

        app.post('/', function (req, res, next) {
            res.json({ok: true}); // send response immediately (errors reported later through error socket)
            var catalog = new schemas.schema.Catalog();
            var prop;
            for (prop in req.body) {
                // SECURITY POINT: make sure that the property exists in the catalog!
                if (req.body.hasOwnProperty(prop) && catalog.hasOwnProperty(prop)) {
                    catalog[prop] = utils.sanitizeText(req.body[prop]);
                }
            }
            var filepath = req.files.work.path;
            fs.readFile(filepath, {encoding: "UTF-8"}, function (err, content) {
                fs.unlink(filepath, function (err) { /* remove file from tmp location */
                    if (err) {
                        console.warn('Failed to unlink tmp file ' + err);
                    }
                });
                // Add content (contentFormat should have been included in body)
                catalog.content = content;
                    var sockets = app.get('sockets'); /* Contains sockets and useful socket methods (see sockets.js) */
                try {
                    catalogService.processCatalog(catalog, sockets, true); // TODO should be async with queue
                    // TODO could send the catalogId to the client? Else, how will client know how to find the newly catalogued item?
                    // Maybe get a token from client that can be lazily bound to the catalogId when the response arrives at the client.
//                    res.json({ok: true});
                    sockets.noteSocket.emit('note', {type: 'note', msg: 'Catalog item successfully processed.'});
                } catch (e) {
                    e.type = 'Error';
                    sockets.noteSocket.emit('note', e);
//                    res.json({ok: false});
                }
            });
//                res.redirect("back"); /* go back one page after the upload */
        });

    });
};

