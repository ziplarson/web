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


var schema = {
    Catalog: function () {
        /* The authors of the base edition TODO should be a sequence of person ID references */
        this.baseAuthors = [];
        /* Authors of current edition (authors who ammended the content--rathen than just annotating it) */
        this.authors = [];
        /* The editors of the base edition TODO should be a sequence of person ID references */
        this.baseEditors = [];
        /* Editors who annotated the content */
        this.editors = [];
        /* The displayable title in various languages (defaults to en or to the only provided one) */
        this.title = {};
        this.lang = 'la';
        /* TODO reference to a language record with display names; etc. for language */
        this.subjects = {};
        /* TODO Subject catalog or just keywords? */
        /* This should be an ID to a record with publisher's name, address, etc. */
        this.basePublisher = '';
        this.baseEdition = '1';
        /* Identifiers from the first to the current version (last in array) */
        this.versions = [];
        /* Editions/versions closest to the base edition */
        this.baseVersions = {};
        /* Different editions or versions of the base edition */
        this.similarVersions = {};
        /* The type of work */
        this.type = 'BookOfPoetry';
        this.content = null;
        /* Content depends on type */

        /**
         * Transforms this object into an internal, canonical version.
         * @param cat A catalog whose fields have not been canonicalized.
         * Such a catalog includes one submitted in a web form.
         * @return {Catalog} A canonical catalog object.
         */
        this.internalize = function (contents) {
            var prop;
            var props = ['baseAuthors', 'authors', 'baseEditors', 'editors'];
            for (prop in props) {
                var propName = props[prop];
                if (typeof this[propName] === 'string') {
                    this[propName] = [this[propName]];
                }
            }
            props = ['baseVersions', 'similarVersions', 'title', 'subjects'];
            for (prop in props) {
                var propName = props[prop];
                if (typeof this[propName] === 'string') {
                    var foo = JSON.parse("\"{\"one\": 'one'}\"");
                    foo = JSON.parse(foo);
                    console.log(foo);
//                    this[propName] = JSON.parse(this[propName]); // TODO deal with parse error
                }
            }
            this.contents = contents;
        };

        /**
         * Validates a canonical catalog's fields.
         */
        this.validate = function () { // TODO

        };
    },
    Poem: function () {
        this.verses = [];
    },
    Verse: function () {
        this.lines = [];
    }
};

var catalogService = {

    addCatalogWork: function (item) {
    },
    /**
     * Adds the catalog items to the database.
     * @param works A set of catalog items
     * @param addToDB If true, adds the works references by the items to the database.
     */
    addCatalogWorks: function (works, addToDB) {
        var count;
        for (count = 0; count < works.length; count += 1) {
            var work = works[count];
            this.addCatalogWork(work);
            if (addToDB) {
                if (work.type) {
                    var type = this.workTypes[work.type];
                    if (type) {
                        var formatName = work.format;
                        if (formatName) {
                            var format = type[formatName];
                            if (format) {
                                var addMethod = format.add;
                                if (addMethod && (typeof addMethod === 'function')) {
                                    addMethod(work);  // TODO add metadata, too, all the way up to the catalog item(s?) to which it belongs
                                } else {
                                    throw 'Error: no add method for work format "' + formatName + '" type "' + type + '" item id ' + work.id + ' title: "' + work.title + '"';
                                }
                            } else {
                                throw 'Error: no support for work format "' + formatName + '" type "' + type + '" item id ' + work.id + ' title: "' + work.title + '"';
                            }
                        } else {
                            throw 'Error: no support for work format "' + formatName + '" type "' + type + '" item id ' + work.id + ' title: "' + work.title + '"';
                        }
                    } else {
                        throw 'Error: no type "' + type + '" for item id ' + work.id + ' title: "' + work.title + '"';
                    }
                } else {
                    throw 'Error: work type is missing for item id ' + work.id + ' title: ' + work.title;
                }
            }
        }
    },

    /* FUNCTIONS THAT ADD RAW TEXT TO THE DB. THE TEXT MAY BE A PART OF OR A WHOLE WORK */

    /**
     * Adds a poem to a book (TODO: or volume?) of poetry.
     * @param poem The raw poem text.
     */
    addPoemFromRawText: function (poem) {
        var poemObject = this.makePoemFromRawText(poem.content);
        print(poemObject);
    },

    /**
     * Returns an array of verse daos, each of which is an array of line daos.
     * @param text The text. Each line of a verse must be terminated by '\n'.
     * An empty line (one with just '\n') is treated as the beginning of a new verse.
     * @returns {string} Returns the content portion of a poem as an HTML string
     */
    makePoemFromRawText: function (text) {
        var lines = text.split('\n');
        var lineCount = lines.length;
        var line;
        var lineno;
        var verseLines = [];
        var poem = new schema.Poem();
        var newVerse = true;
        for (lineno = 0; lineno < lineCount; lineno += 1) {
            line = lines[lineno];
            if (line && line.length > 0) {
                if (newVerse) {
                    if (verseLines.length > 0) {
                        poem.verses.push(this.makeVerseFromRawText(verseLines));
                        verseLines = [];
                    }
                    newVerse = false;
                }
                verseLines.push(line);
            } else {
                newVerse = true;
            }
        }
        if (verseLines.length > 0) {
            poem.verses.push(this.makeVerseFromRawText(verseLines));
        }
        return poem;
    },

    /**
     * Returns a verseObject for the parsed verse raw text.
     * @param text Raw text format for a poem.
     * @param lines Array of lines (each a raw text line)
     */
    makeVerseFromRawText: function (lines) {
        if (typeof lines === 'string') {
            lines = text.split('\n');
        } else if (!Array.isArray(lines)) {
            throw 'Error: expected string or array';
        }
        var lineCount = lines.length;
        var line;
        var lineno;
        var verse = new schema.Verse();
        for (lineno = 0; lineno < lineCount; lineno += 1) {
            line = lines[lineno];
            if (line && line.length > 0) {
                verse.lines.push(line);
            }
        }
        return verse;
    },

    workTypes: {
        Poem: {raw: {add: function (work) {
            var poem = catalogService.makePoemFromRawText(work.content);
            var conn = db.getMongo();
            var works = conn.getCollection('works');
            works.insert(poem);
            print(poem);
        }}}
    }
};

var dummycounter = 0;

module.exports = function submit(app) {

    var fs = app.get('fs');
    var dirname = app.get('dirname');

    // Login authentication methods
    app.namespace('/submit', function processSubmit() {
        app.post('/', function (req, res) {
            var catalog = new schema.Catalog();
            var prop;
            for (prop in req.body) {
                if (req.body.hasOwnProperty(prop) && catalog.hasOwnProperty(prop)) {
                    catalog[prop] = req.body[prop];
                }
            }
            var filepath = req.files.work.path;
            fs.readFile(filepath, {encoding: "UTF-8"}, function (err, data) {
                // TODO Write it to DB instead of saving it using the dbTest code
                // TODO remove file from tmp directory after saving it
                catalog.internalize(data);

//                cataloguer.addCatalogWorks(work, true);
                fs.unlink(filepath, function (err) {
                    if (err) {
                        console.log('Failed to unlink file ' + err);
                    }
                });
            });
        });

    });
};

