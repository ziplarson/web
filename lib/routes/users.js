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
 * Routes for users and groups.
 */
"use strict";

var format = require('util').format;

module.exports = function users(app) {

    var session = app.get('session'),
        db = app.get('db'),
        hogan = app.get('hogan'),
        verbose = app.get('config').rest.verbose;
    var usersCol;

    /**
     * @returns {*} Returns users collection
     */
    function getUsersCol() {
        if (!usersCol) {
            usersCol = db.getDB('users').collection('users');
        }
        return usersCol;
    }

    /**
     * Ensure that user is authorized to access a page.
     * If unauthorized, the user is redirected to the login page.
     * @param req The request
     * @param res The response
     * @param next The next function to call
     */
    function ensureLogin(req, res, next) {
        if (req.session.username) {
            next();
        } else {
            res.redirect('/');
        }
    }

    /**
     * Find the specified username record and, if it exists, apply
     * the given function to the username record.
     * If the record is not found, returns null.
     * @param username The username
     * @param success The function to apply to the record, if it is found. The
     * success function must accept one parameter: the user record.
     * @param error The error function to call if the record is not found. The
     * error function must accept one parameter: the error.
     */
    function findUserByUsername(username, success, error) {
        getUsersCol().find({username: username}).toArray(function (err, results) {
            if (err) {
                error(err);
            }
            if (results.length === 0) {
                success({});
            } else {
                success(results[0]);
            }
        });
    }

    function test(cb) {
        getUsersCol().insert({poonks: 20}, function (err, docs) {
            if (err) {
                throw err;
            }
            usersCol.count(function (err, count) {
                if (err) {
                    throw err;
                }
                if (verbose) {
                    console.log(format("count = %s", count));
                }
                if (cb) {
                    cb(count);
                }
            });

            // Locate all the entries using find
            /*collection.find().toArray(function (err, results) {
             if (err) {
             throw err
             }
             console.dir(results);
             });*/
        });
    }

    // Login authentication methods
    app.namespace('/login', function checkLogin() {

        app.get('/', function (req, res) {
            var s = req.session;
            if (s.username) {
                res.json({loggedIn: true, username: s.username});
            } else {
                res.json({loggedIn: false});
            }
        });
        app.post('/', function (req, res) {
            var b = req.body;
            req.setEncoding('utf8');
            var rawBody = '';
            req.on('data', function (chunk) {
                rawBody += chunk;
            });
            req.on('end', function () {
                var data = JSON.parse(rawBody);
                if (!data.name || !data.password) {
                    res.json({ok: false});
                } else {
                    findUserByUsername(data.name,
                        function (rec) {
                            if (rec.username === data.name && rec.password === data.password) {
                                req.session.username = rec.username;
                                rec.ok = true;
                                res.json(rec);
                            } else {
                                res.json({ok: false});
                            }
                        },
                        function (err) {
                            res.json({ok: false});
                        });
                }
            });
        });
    });

    app.namespace('/users', function createUserRoutes() {

        try {

            app.get('/', ensureLogin, function (req, res) {
                session.handle(req, res,
                    function () {
                        test(function (userCount) {
                            res.send('user counts=' + userCount);
                        });
                    });
            });

            app.get('/new/:name', function (req, res) {
                try {
                    req.session.user = req.params.user;
                    res.send('<p>I just set session user to ' + req.params.name + '. Go <a href=".">Here</a> to see its value.</p>');
                } catch (err) {
                    throw err;
                }
                //res.cookie('user', req.params.name).send('<p>I just set cookie user to ' + req.params.name + '. Go <a href=".">Here</a> to see its value.</p>');
            });

            app.get('/new', function (req, res) {
                res.send(req.session.user);
                /* res.clearCookie('user');
                 res.send('cookie cleared');*/
            });

            app.get('/edit/:id', function (req, res) {
                res.send('edit user ' + req.params.id);
            });

            app.get('/delete/:id', function (req, res) {
                res.send('delete user ' + req.params.id);
            });

            app.get('/19', function (req, res) {
//                var template = '{{#students}} <p>Name: {{name}}, Age: {{age}} years old</p> {{/students}}';
//                var context = {students: [{name: 'Ruben', age: 60},{name: 'Bev', age: 64}]};
//
//                var template = hogan.compile(template);
                var template = hogan.fcompile('./src/views/index.hjs', {delimiters: '<% %>'});
                res.send(template.render({msg: 'hello there!'}));
//                res.render('./index.hjs');
            });

            // Namespaces can be nested
            app.namespace('/2013/jan', function () {

                app.get('/', function (req, res) {
                    res.send('user from jan 2013');
                });

                app.get('/nodejs', function (req, res) {
                    res.send('user about Node from jan 2013');
                });
            });

        } catch (error) {
            console.log('Failed to create user routes: ' + error);
        }
    });
};