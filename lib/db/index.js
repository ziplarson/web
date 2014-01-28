/**
 The MIT License (MIT)

 Copyright (c) 2013 Ruben Kleiman

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

// TODO close connections when server goes down if the driver doesn't do it

// Hash of db name => db for open databases (each is a connection pool for a database)
var dbs = {};

/** The mongodb object */
var mongodb;

/* usersCol: stores user profiles */
var usersCol;

/* worksCol: caches works collection */
var worksCol;

var data = require('../../public/scripts/app/schema.js');
var definitions = data.definitions;

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
exports.use = function (app, cb) {

    mongodb = app.get('mongodb');
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

    var dbNames = app.get('config').db.dbNames;
    var dbName;

    function setDb(err, db) {
        if (err) {
            if (cb) {
                cb(err);
            } else {
                console.log(err);
            }
        } else {
            dbs[dbName] = db;
        }
    }

    for (i = 0; i < dbNames.length; i += 1) {
        dbName = dbNames[i];
        createConnection(app.get('config').db, dbName, setDb);
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

/* START DAO READ/WRITE ********************************************************************************* */

var saveWork = function (sockets, catalog) {
    if (!catalog || catalog.contentFormat !== definitions.contentFormatCanonical || (catalog.content === undefined)) {
        throw {type: 'fatal', msg: 'Content format must be canonical and have content to save it'};
    }
    try {
        var col = getWorksCol();

        if (catalog.id) { // update
            var key;
            try {
                key = mongodb.ObjectID.createFromHexString(catalog.id);
            } catch (e) {
                sockets.noteSocket.emit('note', {type: 'error', msg: 'Catalog item id "' + catalog.id + '" is an invalid id'});
                sockets.txSocket.emit('catalogTx', {tx: 'update', status: 'error', msg: 'Catalog item id "' + catalog.id + '" is an invalid id'});
                return;
            }
            var query = {_id: key};
            col.update(query, {$set: catalog}, insertUpdateOptions, function (err, count) {
                if (err) {
                    console.info(err);
                    console.error(err);
                    sockets.noteSocket.emit('note', {type: 'note', msg: 'Catalog item update failed'});
                    sockets.txSocket.emit('catalogTx', {tx: 'update', status: 'error', msg: 'Catalog item update failed: ' + err});
                } else if (count > 0) {
                    sockets.noteSocket.emit('note', {type: 'note', msg: 'Catalog item updated'});
                    sockets.txSocket.emit('catalogTx', {tx: 'update', status: 'ok', msg: 'Catalog item id ' + catalog.id + ' updated', info: {id: catalog.id}});
                } else {
                    console.info(err);
                    console.error(err);
                    sockets.noteSocket.emit('note', {type: 'error', msg: 'Catalog item id "' + catalog.id + '" not updated because it does not exist'});
                    sockets.txSocket.emit('catalogTx', {tx: 'update', status: 'error', msg: 'Catalog item id "' + catalog.id + '" not updated because it does not exist'});
                }
            });
        } else { // create
            col.insert(catalog, insertUpdateOptions, function (err, doc) {
                if (err) {
                    console.info(err);
                    console.error(err);
                    sockets.noteSocket.emit('note', {type: 'note', msg: 'Catalog item insert failed: ' + err});
                    sockets.txSocket.emit('catalogTx', {tx: 'insert', status: 'error', msg: 'Catalog item insert failed: ' + err});
                } else {
                    sockets.noteSocket.emit('note', {type: 'note', msg: 'Catalog item inserted'});
                    sockets.txSocket.emit('catalogTx', {tx: 'insert', status: 'ok', msg: 'New catalog item inserted with id ' + doc[0]._id, info: {id: doc[0]._id}});
                }
            });
        }

//        col.findAndModify(query, [], obj, {w: writeConcernAck, upsert: true, 'new': true}, function (err, doc) {
//            console.info(doc);
//        });
    } catch (err) {
        throw {type: 'fatal', msg: 'Failed to save catalog item. ' + err};
    }
};

/*
 TODO can this be factored out into a facade or is this good enough?
 Point is that the API should be as free as possible from Mongodb implementation knowledge.
 */
exports.saveWork = saveWork;

/* END DAO READ/WRITE ********************************************************************************* */



