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

/* app: The express app */
var app;

/* Require MongoDB implementation */
var db = require('../db/index.js');
var poemMethods = require('./methods/poemMethods.js').methods;

/**
 * Contains the private methods for this service.
 */
var _internal = {

    // TODO add error checking
    canonicalizeCatalogMetadata: function (catalog) {
        if (catalog.mdCanonical) {
            throw {type: 'fatal', msg: 'Metadata already in canonical form'};
        }
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
    },

    updateDbCatalogMetadata: function (item) { // TODO ?? get rid of this?
    },

    methods: {
        Poem: poemMethods
    }
};

/**
 * The public API for the catalog service.
 */
var catalogService = {

    /**
     * Updates an existing or inserts a new catalog item. The item must
     * be in canonical form.
     *
     * 1. Canonicalize the catalog metadata and any contents if its format is not canonical.
     * 2. If the catalog has an id, the id requests this to be processed as an update;
     *    else, a new catalog item is created.
     * 3. If the catalog item is not an update (i.e., is new) and the overwrite parameter is false,
     *    determine whether its metadata matches any existing catalog item's metadata or not.
     *    If it matches one (or more), return the ids for the matches and exit.
     * 4. Add or update the catalog item (in the DB) using the appropriate method specified in the
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
    processCatalog: function (session, catalog, overwrite) {

        // TODO turn this into a queue-based service
        // TODO if catalog is new, get a token with catalog and send back its id with the token

        _internal.canonicalizeCatalogMetadata(catalog);

//        if (!catalog.id) { TODO
//            var equivalents = this.findEquivalentItems(catalog);
//            if (equivalents && equivalents.length > 0) {
//                return equivalents;
//            }
//        }

        _internal.updateDbCatalogMetadata(catalog);

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
                                db.saveWork(session, catalog);
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
            app.get('sockets').getSocket(session, 'note').emit('note', {type: 'warn', msg: 'Catalog item had no content, but the catalog metadata was saved.'});
        }
    }
};

exports.catalogService = catalogService;

exports.use = function (expressApp) {
    app = expressApp;
};