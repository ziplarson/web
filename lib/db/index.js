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

/**
 * Manages MongoDB database connection pool and access
 * to its databases.
 */
"use strict";

// Hash of db name => db for open databases (each is a connection pool for a database)
var dbs = {};

// Create a db url for the specified config and db name
exports.makeDbUrl = function makeDbUrl(config, dbName) {
    try {
        var url = 'mongodb://' + config.host + ':' + config.port + '/' + dbName + '?maxPoolSize=' + config.poolSize;
        if (config.writeConcern) {url += '&w=' + config.writeConcern; }
        if (config.readPreference) {url += '&readPreference=' + config.readPreference; }
        if (config.slaveOk) {url += '&slaveOk=' + config.slaveOk; }
        if (config.fsync) {url += '&fsync=' + config.fsync; }
        if (config.journal) {url += '&journal=' + config.journal; }
        return url;
    } catch (err) {
        throw 'DB error makeDbUrl: ' + err;
    }
};

// Configures and creates database connection pools
exports.use = function(app, cb) {

    var mongoClient = app.get('mongodb').MongoClient;
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
            throw 'DB error createConnection: ' + err;
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
    for (i = 0; i < dbNames.length; i++) {
        dbName = dbNames[i];
        createConnection(app.get('config').db, dbName, setDb);
    }
    if (cb) {
        cb();
    }
    try {
    } catch (err) {
        throw err;
    }
};


// Returns the database with the specified name or undefined if it doesn't exist.
exports.getDB = function(dbName) {
    return dbs[dbName];
};



