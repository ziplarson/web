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

// SERVER SIDE --------------------------------------------------------------------------------------------

'use strict';

///* app: The express app */
//var app;

var express = require('express');

var appUtils = require('../utilities/generalUtils.js');

/* Require MongoDB implementation */
var store = require('../store/storeManager.js');

var poemMethods = require('./methods/poemMethods.js').methods;

/**
 * Contains the private methods for this service.
 */
var _internal = {

    // TODO add error checking
    canonicalizeCatalogMetadata: function (catalog) {
        if (!catalog.mdCanonical) {
            var prop;
            for (prop in catalog.arrayFields) {
                var propName = catalog.arrayFields[prop];
                if (typeof catalog[propName] === 'string') {
                    catalog[propName] = [catalog[propName]];
                }
            }
            for (prop in catalog.objectFields) {
                propName = catalog.objectFields[prop];
                var val = catalog[propName];
                if (typeof val === 'string') {
                    var obj = JSON.parse(val); // TODO deal with parse error
                    catalog[propName] = Array.isArray(obj) ? obj[0] : obj;
                }
            }
            catalog.mdCanonical = true;
        }
    },

    methods: {
        Poem: poemMethods
    }
};

/**
 * The public API for the catalog service.
 */
var catalogService = {

    saveMetadata: function (session, catalog, callback) {
        try {
            _internal.canonicalizeCatalogMetadata(catalog);
            store.saveCatalogMetadata(session, catalog, callback);
        } catch (error) {
            callback(appUtils.makeError(error));
        }
    },

    /* search: searches catalog per query */
    search: function (session, query, callback) {
        try {
            store.searchCatalog(session, query, callback);
        } catch (error) {
            callback(appUtils.makeError(error));
        }
    },

    /**
     * saveContent: Updates an existing or inserts a new catalog item. The item must
     * be in canonical form.
     *
     * 1. Canonicalize the catalog metadata and any contents if its format is not canonical.
     * 2. If the catalog has an id, the id requests this to be processed as an update;
     *    else, a new catalog item is created.
     * 3. If the catalog item is not an update (i.e., is new) and the overwrite parameter is false,
     *    determine whether its metadata matches any existing catalog item's metadata or not.
     *    If it matches one (or more), return the ids for the matches and exit.
     * 4. Add or update the catalog item (in the store) using the appropriate method specified in the
     *    catalog's format and workType fields.
     *
     * Sends notifications as necessary for warnings and successful completion, but not for errors.
     *
     * @param catalog A catalog item consisting of catalog metadata and optionally contents.
     * @param overwrite If false and a the catalog is new (not an update), make a best effort
     * to match against existing catalog items. If there are matches, a list of these ids
     * will be returned and the function exits without processing the catalog item.
     * @throws {object} If the item was unsuccessfully processed,
     * returns an object with a field named 'msg' which is a text message specifying the error.
     */
    saveContent: function (session, catalog, overwrite) {

        // TODO turn this into a queue-based service

        // TODO TODO TODO must handle changing catalog metadata versus saving contents: they should be separate operations from the client
        // save the catalog item and client gets the id: with the id, the client can then add content
        // Need two operations: saveCatalogItem (creates or inserts a catalog item and returns the id)
        //   and saveCatalogContents (given a catalog id, it creates or inserts its contents).

        var result;

        _internal.canonicalizeCatalogMetadata(catalog);

//        if (!catalog.id) { TODO
//            var equivalents = this.findEquivalentItems(catalog);
//            if (equivalents && equivalents.length > 0) {
//                return equivalents;
//            }
//        }

        if (catalog.content && catalog.content.length > 0) {
            if (catalog.workType) {
                var workType = _internal.methods[catalog.workType];
                if (workType) {
                    var formatName = catalog.contentFormat;
                    if (formatName) {
                        var format = workType[formatName];
                        if (format) {
                            var canonicalizeContentMeth = format.canonicalize;
                            if (canonicalizeContentMeth && (typeof canonicalizeContentMeth === 'function')) {
                                canonicalizeContentMeth(catalog);
                                result = store.saveContent(session, catalog);
                            } else {
                                throw {type: 'fatal', msg: 'No method for canonicalizing work. contentFormat "' + formatName + '" workType "' + workType + '" item id ' + catalog.id + ' title: "' + catalog.title + '"'};
                            }
                        } else {
                            throw {type: 'fatal', msg: 'No support for work contentFormat "' + formatName + '" workType "' + workType + '" item id ' + catalog.id + ' title: "' + catalog.title + '"'};
                        }
                    } else {
                        throw {type: 'fatal', msg: 'No support for work contentFormat "' + formatName + '" workType "' + workType + '" item id ' + catalog.id + ' title: "' + catalog.title + '"'};
                    }
                } else {
                    throw {type: 'fatal', msg: 'No workType "' + workType + '" for item id ' + catalog.id + ' title: "' + catalog.title + '"'};
                }
            } else {
                throw {type: 'fatal', msg: 'Work workType is missing for item id ' + catalog.id + ' title: ' + catalog.title};
            }
        } else {
            express.get('sockets').getSocket(session, express.get('notificationSocketName')).emit('note', {type: 'warn', msg: 'Catalog item had no content'});
        }

        return result; //  TODO caller must handle this result (along with the thrown errors)
    }
};

exports.catalogService = catalogService;

//exports.use = function (expressApp) {
//    app = expressApp;
//};