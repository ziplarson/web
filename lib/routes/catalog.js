/*
 *The MIT License (MIT)
 *
 *Copyright (c) 2014 Ruben Kleiman
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

/* Object schemas */
var schema = require('../model/schema.js').schema;

/* The catalog service */
var catalogService = require('../services/catalogService.js').catalogService;

/* App utilities */
var  appUtils = require('../utilities/generalUtils.js');

/* File system to read uploaded file from tmp location */
var fs = require('fs');


/**
 * Safely copies request body parameters into corresponding
 * client catalog properties. All text is sanitized and only properties
 * that are defined in the schema of the catalog object are copied into the catalog.
 * Note: although faster and more efficient to get object directly from body,
 * we would still need to weed out unwelcome properties as well as sanitize them.
 * @param request   The http request
 * @param txId  The transaction id
 * @return {object} Returns the server catalog
 */
function makeCanonicalCatalog(metadata, txId) {
    var workType = metadata.workType;
    if (typeof workType === 'undefined') {
        throw {type: 'fatal', txId: txId, msg: 'Work type is required'};
    }
    var fieldId, catalog = schema.makeClientCatalog(workType);
    // Compose sanitized & normalized client catalog object
    for (fieldId in metadata) {
        // SECURITY POINT: make sure that the property exists in the catalog!
        if (metadata.hasOwnProperty(fieldId) && catalog.hasOwnProperty(fieldId)) {
            var item = metadata[fieldId];
            catalog[fieldId] = appUtils.sanitizeObject(item);
        }
    }

    // Create canonical catalog object from it and validate fields
    for (fieldId in catalog) {
        var fieldSpec = schema.getFieldSpec(workType, fieldId);
        if (typeof fieldSpec === 'undefined') {
            throw {type: 'fatal', msg: 'No field spec "' + fieldId + '"'};
        }
        if (fieldSpec.required) {
            var val = catalog[fieldId];
            if (typeof val === 'undefined' || val.length === 0) {
                throw {type: 'error', txId: txId, msg: 'Catalog field "' + fieldSpec.name + '" is required'};
            }
        }
        var validator = schema.validators[fieldSpec.validator];
        if (typeof validator === 'undefined') {
            throw {type: 'fatal', txId: txId, msg: 'No validator for catalog field ' + fieldSpec.name};
        }
        validator(catalog, fieldSpec, txId);
    }

    // Create canonical catalog and copy transformed client data onto it
    var canonicalCatalog = {}; // new schema.Catalog();
    for (fieldId in catalog) {
        if (typeof catalog[fieldId] !== 'undefined') {
            var fieldSpec = schema.getFieldSpec(workType, fieldId); // known to exist
            var xformer = schema.transformers[fieldSpec.xformer];
            if (typeof xformer === 'undefined') {
                throw {type: 'fatal', txId: txId, msg: 'No transformer for catalog field ' + fieldSpec.name};
            }
            xformer(fieldSpec, catalog, canonicalCatalog);
        }
    }
    return canonicalCatalog;
}

module.exports = function (app) {

    // TODO Replace file upload with https://github.com/andrewrk/node-multiparty/ for connect-3.0 ???
    app.namespace('/catalog', function () {

        /*
         TODO run scripts/init-db.js when initing the DB
          */
        app.post('/search/query', function (req, res, next) {

            var query = req.body.general;
            var sockets = app.get('sockets'); // TODO fetch might be done just once at init time if ordering is correct
            var notify = req.body.notify;
            var noteSocket;
            if (notify) {
                noteSocket = sockets.getSocket(req.session, app.get('notificationSocketName'));
            }

            try {
                if (!query) {
                    res.json({type: 'ack', msg: 'No results found.'})
                } else {
                    catalogService.search(query, function (error, result) {
                        if (error) {
                            result = error;
                        }
                        if (noteSocket) {
                            noteSocket.emit('note', result);
                        }
                        res.json(result);
                    });
                }
            } catch (err) {
                var error = appUtils.makeError(err);
                res.json(error);
                if (noteSocket) {
                    noteSocket.emit('note', error);
                }
            }
//            if (next) {
//                next(req, res);
//            }
        });



        app.post('/submit/metadata', function (req, res, next) {

            var sockets = app.get('sockets'); // TODO fetch might be done just once at init time if ordering is correct
            var txId = appUtils.makeId(appUtils.txIdLength);
            var notify = req.body.notify;
            var txSocket, noteSocket;
            var metadata = (typeof req.body.metadata === 'string') ? JSON.parse(req.body.metadata) : req.body.metadata;
            var haveContent = (typeof req.files !== 'undefined');

            try {
                res.json({type: 'ack', txId: txId}); // send response immediately (errors reported later through tx socket)

                // Step 1: save catalog metadata
                var catalog = makeCanonicalCatalog(metadata, txId);
                noteSocket = notify ? sockets.getSocket(req.session, app.get('notificationSocketName')) : null; // client requested notifications for this transaction
                txSocket = sockets.getSocket(req.session, app.get('txSocketName'));
                catalogService.saveMetadata(req.session, catalog, function (error, saveMetadataResult) {
                    if (error) {
                       error.txId = txId;
                        txSocket.emit('catalog/submit/metadata', error);
                        !noteSocket || noteSocket.emit('note', error);
                    } else {
                        saveMetadataResult.txId = txId;
                        var catalogId = saveMetadataResult.data.catalogId;
                        if (!catalogId) {
                            var err = {type: 'fatal', txId: txId, msg: 'Catalog id not returned'};
                            txSocket.emit('catalog/submit/metadata', err);
                            !noteSocket || noteSocket.emit('note', err);
                        } else {
                            // Step 2: optionally save content file
                            if (haveContent) {
                                var filepath = req.files.file.path;
                                fs.readFile(filepath, {encoding: "UTF-8"}, function (err, content) {
                                    fs.unlink(filepath, function (err) { /* remove file from tmp location */
                                        if (err) {
                                            console.warn('Failed to unlink tmp file ' + err);
                                        }
                                    });
                                    try {
                                        catalog._id = catalogId;
                                        catalog.content = content;
                                        catalogService.saveContent(req.session, catalog, function (error, saveContentResult) {
                                            var result = error || saveContentResult;
                                            result.txId = txId;
                                            result.msg += '. Catalog metadata ' + (saveMetadataResult.created ? 'created' : 'updated');
                                            txSocket.emit('catalog/submit/metadata', result);
                                            !noteSocket || noteSocket.emit('note', result);
                                        });
                                    } catch (e) {
                                        e = appUtils.makeError(e);
                                        txSocket.emit('catalog/submit/metadata', e);
                                        !noteSocket || noteSocket.emit('note', e);
                                    }
                                });
                            } else {
                                txSocket.emit('catalog/submit/metadata', saveMetadataResult);
                                !noteSocket || noteSocket.emit('note', saveMetadataResult);
                            }
                        }
                    }
                });


            } catch (err) {
                var error = appUtils.makeError(err);
                try { // try to directly get sockets as that might have been the problem
                    txSocket = sockets.getSocket(req.session, app.get('txSocketName'));
                    if (txSocket) {
                        txSocket.emit('catalog/submit/metadata', error);
                    }
                    if (notify) {
                        noteSocket = sockets.getSocket(req.session, app.get('notificationSocketName'));
                        if (noteSocket) {
                            noteSocket.emit('note', error);
                        }
                    }
                } catch (err2) { // last ditch
                    throw error;
                }
            }

            if (next) {
                next(req, res);
            }
        });
    });
};

