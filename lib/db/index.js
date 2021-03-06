/**
 The MIT License (MIT)

 Copyright (c) 2014 Ruben Kleiman

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


// SERVER SIDE --------------------------------------------------------------------------------------------

/**
 * Manages MongoDB database connection pool and access
 * to its databases.
 */
"use strict";

var appUtils = require('../utilities/generalUtils.js');

var uuid = require('../utilities/uuid.js');

// TODO close connections when server goes down if the driver doesn't do it

/* app: The express app */
var app;

/* dbs: Hash of db name => db for open databases (each is a connection pool for a database) */
var dbs = {};

/** mongodb: The mongodb object */
var mongodb;

/* usersCol: stores user profiles */
var usersCol;

/* worksCol: caches works collection in works DB */
var worksCol;

/* catalogCol: caches catalog collection in works DB */
var catalogCol;

var writeConcernAck = 1;
var insertUpdateOptions = {w: writeConcernAck, journal: true};


// Create a db url for the specified config and db name
exports.makeDbUrl = function makeDbUrl(config, dbName) {
    try {
        var url = 'mongodb://' + config.host + ':' + config.port + '/' + dbName + '?maxPoolSize=' + config.poolSize;
        if (config.writeConcern) {
            url += '&w=' + config.writeConcern;
        }
        if (config.readPreference) {
            url += '&readPreference=' + config.readPreference;
        }
        if (config.slaveOk) {
            url += '&slaveOk=' + config.slaveOk;
        }
        if (config.fsync) {
            url += '&fsync=' + config.fsync;
        }
        if (config.journal) {
            url += '&journal=' + config.journal;
        }
        return url;
    } catch (err) {
        throw {type: 'fatal', msg: 'DB error makeDbUrl: ' + err};
    }
};

// Configures and creates database connection pools
exports.use = function (expressApp, cb) {

    app = expressApp;
    mongodb = require('mongodb');
    var mongoClient = mongodb.MongoClient;
    var i;

    function createConnection(config, dbName, cb) {
        try {
            if (dbs[dbName]) {
                cb(null, dbs[dbName]);
            } else {
                //placeholder: modify this-should come from a configuration source
                var url = exports.makeDbUrl(config, dbName);
                mongoClient.connect(url,
                    function (err, db) {
                        if (err) {
                            err = "createConnection failed: " + err;
                        } else {
                            dbs[dbName] = db;
                            if (config.verbose) {
                                console.log('Configured DB: ' + db.databaseName + ' ' + url);
                            }
                        }
                        cb(err, db);
                    });
            }
        } catch (err) {
            throw {type: 'fatal', msg: 'DB error createConnection: ' + err};
        }
    }

    var dbNames = expressApp.get('config').db.dbNames;
    var dbName;

    function setDb(err, db) {
        if (err) {
            if (cb) {
                cb(err);
            } else {
                console.log('setDb: ' + err);
            }
        } else {
            dbs[dbName] = db;
        }
    }

    for (i = 0; i < dbNames.length; i += 1) {
        dbName = dbNames[i];
        createConnection(expressApp.get('config').db, dbName, setDb);
    }
    if (cb) {
        cb();
    }
    try {
    } catch (err) {
        throw {type: 'fatal', msg: err};
    }
};

var getDB = function (dbName) {
    return dbs[dbName];
};
// Returns the database with the specified name or undefined if it doesn't exist.
exports.getDB = getDB;

var getMongoDb = function () {
    return mongodb;
};
exports.getMongoDb = getMongoDb;

/**
 * @returns {*} Returns users collection in users DB
 */
function getUsersCol() {
    if (!usersCol) {
        usersCol = getDB('users').collection('users');
    }
    return usersCol;
}

/**
 * @returns {*} Returns works collection in works DB
 */
function getWorksCol() {
    if (!worksCol) {
        worksCol = getDB('works').collection('works');
    }
    return worksCol;
}

/**
 * @returns {*} Returns catalog collection in works DB
 */
function getCatalogCol() {
    if (!catalogCol) {
        catalogCol = getDB('works').collection('catalog');
    }
    return catalogCol;
}

/* START DAO READ/WRITE ********************************************************************************* */

function createCatalog(session, catalog, callback) {
    catalog._id = uuid.v4(); // create v4 uuid as catalog item key
    getCatalogCol().insert(catalog, insertUpdateOptions, function (err, doc) {
        if (err) {
            callback(appUtils.makeError({type: 'fatal', msg: 'Failed to create catalog item. '}, err));
        } else { // successful insert
            var catalogId = doc[0]._id.toString();
            callback(null, {type: 'ack', msg: 'Created catalog id ' + catalogId, created: true, data: {catalogId: catalogId}});
        }
    });
}

function updateCatalog(session, catalog, callback) {
//    var key;
//    try {
//        key = mongodb.ObjectID.createFromHexString(catalog._id);
//    } catch (e) {
//        callback({type: 'error', msg: 'Catalog item id "' + catalog._id + '" is invalid'});
//    }
    var catalogId = catalog._id;
    delete catalog._id;
    var query = {_id: catalogId};
    getCatalogCol().update(query, {$set: catalog}, insertUpdateOptions, function (err, count) {
        if (err) {
            callback(appUtils.makeError({type: 'trans', msg: 'Failed to update catalog item id ' + catalogId, data: {catalogId: catalogId}}, err));
        } else if (count > 0) { // successful update
            callback(null, {type: 'ack', msg: 'Updated catalog id ' + catalogId, created: false, data: {catalogId: catalogId}});
        } else {
            callback({type: 'trans', msg: 'Catalog item id ' + catalogId + ' not updated because it does not exist', data: {catalogId: catalogId}});
        }
    });
}


var searchCatalog = function (query, callback) {
    getDB('works').command({text: 'catalog', search: query}, function (error, result) {
        if (error) {
            error = appUtils.makeError({type: 'trans', msg: 'Search failed'}, ': ' + error.name + ' ' + error.message);
            callback(error, null);
        } else if (typeof result.results === 'undefined' || result.results.length === 0) {
            callback(null, {type: 'ack', msg: 'No results found for query "' + query + '".'});
        } else {
            callback(null, {type: 'ack', msg: result.results.length + ' results found', data: result.results});
        }
    });
};


/**
 * saveCatalogMetadata: Creates a new or updates an existing catalog item's metadata in the store.
 * @param session   The session
 * @param catalog   The catalog. If catalog._id exists, the catalog item
 * is updated; else it is created (inserted).
 */
var saveCatalogMetadata = function (session, catalog, callback) {
    try {
        if (catalog._id) {
            updateCatalog(session, catalog, callback);
        } else {
            createCatalog(session, catalog, callback);
        }
    } catch (err) {
        callback(appUtils.makeError({type: 'fatal', msg: 'Failed to save catalog metadata. '}, err));
    }
};

/**
 * saveContent: Saves some content for the specified catalog. The catalog item must exist.
 * @param session   The session
 * @param catalog   The catalog item. The catalog's id field is required.
 * @param callback  The callback for results or errors
 */
var saveCatalogContent = function (session, catalog, callback) {
    var catalogId = catalog._id;

    // TODO catalog content must be saved on works collection AFTER parsing it through the appropriate workType methods
    if (catalogId) { // update
//        var key;
//        try {
//            key = mongodb.ObjectID.createFromHexString(catalog._id);
//        } catch (e) {
//            throw {type: 'error', msg: 'Catalog item id "' + catalog._id + '" is an invalid id'};
//        }
        var query = {_id: catalogId};
        delete catalog._id;
        getCatalogCol().update(query, {$set: catalog}, insertUpdateOptions, function (err, count) {
            catalog._id = catalogId;
            if (err) {
                callback(appUtils.makeError({type: 'fatal', msg: 'Failed to update contents catalog item id ' + catalog._id}, err));
            } else if (count > 0) {
                callback(null, {type: 'ack', msg: 'Catalog id "' + catalog._id + '" contents updated', data: {catalogId: catalog._id}});
            } else {
                callback({type: 'trans', msg: 'Catalog id "' + catalog._id + '" not updated because it does not exist', data: {catalogId: catalog._id}});
            }
        });
    } else {
        callback({type: 'fatal', msg: 'Missing catalog id'});
    }
};

exports.searchCatalog = searchCatalog;
exports.saveCatalogContent = saveCatalogContent;
exports.saveCatalogMetadata = saveCatalogMetadata;

/* END DAO READ/WRITE ********************************************************************************* */



