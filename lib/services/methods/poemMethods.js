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

/* Require internal object representation for works and catalogs */
var schema = require('../../models/schema.js').schema;


/**
 * Returns a verseObject for the parsed verse raw text.
 * @param text Raw text format for a poem.
 * @param lines Array of lines (each a raw text line)
 */
function makeVerseFromRawText(lines) {
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
}

/**
 * Returns an array of verse daos, each of which is an array of line daos.
 * @param text The text. Each line of a verse must be terminated by '\n'.
 * An empty line (one with just '\n') is treated as the beginning of a new verse.
 * All XML-like markup will be escaped.
 * @returns {string} Returns the content portion of a poem as an HTML string
 */
function makePoemFromRawText(text) {
    if (typeof text !== 'string') {
        throw {message: 'Raw text for a poem is not a string; type=' + (typeof text)};
    }
    // TODO escape HTML / XML markup (sanitize methods for node.js?)
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
                    poem.verses.push(makeVerseFromRawText(verseLines));
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
        poem.verses.push(makeVerseFromRawText(verseLines));
    }
    return poem;
}

/**
 * Exports an object containing data processing methods for each poem content format (e.g., raw).
 */
exports.methods = {

    /** Raw text */
    raw: {
    /**
     * Canonicalizes just the raw text content of a
     * catalog item. This does not touch the metadata.
     * The canonical format is used in the intrinsics to directly
     * save elements to the DB and to process them.
     * @param catalog   An catalog item whose content is a raw string version
     * of a poem.
     */
    canonicalize: function (catalog) {
        catalog.content = makePoemFromRawText(catalog.content);
        catalog.contentFormat = 'canonical'; // It is now in the canonical format
    }
}};

