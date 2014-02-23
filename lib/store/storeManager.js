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

// SERVER SIDE --------------------------------------------------------------------------------------------

/**
 * Wrapper for database store.
 */

"use strict";

/* db: Require MongoDB implementation */
var mongodb = require('../db');

/**
 * saveCatalogMetadata: Inserts or updates a catalog's metadata in the store.
 * @param session   The session
 * @param catalog   The catalog item
 * @return Returns an ack object with fields 'msg' (a human
 * readable message) and optionally 'data' (an object containing
 * information about the transaction--specifically, this is provided
 * only when the catalog item is being inserted for the first time and
 * it contains the field 'id' with the unique catalog id for the catalog item).
 */
var saveCatalogMetadata = function (session, catalog, callback) {
    return mongodb.saveCatalogMetadata(session, catalog, callback);
};
exports.saveCatalogMetadata = saveCatalogMetadata;

var searchCatalog = function(session, query, callback) {
    return mongodb.searchCatalog(session, query, callback);
}
exports.searchCatalog = searchCatalog;