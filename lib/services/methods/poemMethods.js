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

'use strict';

/* Require internal object representation for works and catalogs */
var schema = require('../../model/schema.js').schema;
var appUtils = require('../../utilities/generalUtils.js');
var uuid = require('../../utilities/uuid.js');

/**
 * Throw error if text is not appropriate as dfl markup format.
 * @param text  The text
 * @throws Error if the text is not dfl markup
 */
function checkDflMarkupText(text) {
    if (typeof text !== 'string') {
        throw {type: 'error', msg: 'Invalid format for DFL markup text'};
    }
}

/**
 * Returns a verseObject for the parsed verse Dfl markup text.
 * Text is sanitized.
 * @param text Dfl markup text format for a poem.
 * @param lines Array of lines (each a Dfl markup text line)
 */
function makeCanonicalVerseFromDflMarkup(lines) {
    if (typeof lines === 'string') {
        lines = text.split('\n');
    } else if (!Array.isArray(lines)) {
        throw {type: 'error', msg: 'Expected string or array'};
    }
    var lineCount = lines.length;
    var line;
    var lineno;
    var verse = new schema.Verse();
    for (lineno = 0; lineno < lineCount; lineno += 1) {
        line = lines[lineno];
        if (line && line.length > 0) {
            line = appUtils.sanitizeObject(line);
            verse.lines.push(line);
        }
    }
    return verse;
}

/**
 * Returns an array of verse daos, each of which is an array of line daos.
 * Text is sanitized.
 * @param text The text. Each line of a verse must be terminated by '\n'.
 * An empty line (one with just '\n') is treated as the beginning of a new verse.
 * All XML-like markup will be escaped.
 * @returns {string} Returns the canonicalized content portion of a poem.
 */
function makeCanonicalPoemFromDflMarkup(text) {
    checkDflMarkupText(text);
    var lines = text.split('\n');
    var lineCount = lines.length;
    var line;
    var verseLines = [];
    var poem = new schema.Poem();
    var newVerse = true;
    for (var lineno = 0; lineno < lineCount; lineno += 1) {
        line = lines[lineno];
        if (line && line.length > 0) {
            if (newVerse) {
                if (verseLines.length > 0) {
                    poem.verses.push(makeCanonicalVerseFromDflMarkup(verseLines));
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
        poem.verses.push(makeCanonicalVerseFromDflMarkup(verseLines));
    }
    return poem;
}

// 40 lines per chunk
/**
 * Combines the specified verse lines into chunks and
 * returns an array of chunks for this
 * Chunk object with following fields:
 * lines := an array of lines in the verse
 * type := 'verse'
 * data := an object with type-specific chunk parameters
 *     start := {true | false}  True if this chunk's first line is start of the verse
 * @param verseLines
 * @returns {Array}
 */
function makeCanonicalVerseFromDflMarkup2(verseLines) {
    var line, lineno, lineCount = verseLines.length, currChunk, chunks = [], chunkSize = schema.definitions.chunkSize;
    for (lineno = 0; lineno < lineCount; lineno += 1) {
        line = verseLines[lineno];
        if (line && line.length > 0) {
            line = appUtils.sanitizeObject(line);
            if (lineno % chunkSize) { // start chunk
                currChunk = {id: uuid.v4(), lines: [], type: 'verse', data: {start: (lineno === 0)}};
                chunks.push(currChunk);
            }
            currChunk.lines.push(line);
        } else {
            throw {type: 'fatal', msg: 'Verse parsing error: empty line not expected'};
        }
    }
    return chunks;
}

/**
 * Resolve chunk pointers
 * @param chunks
 */
function resolvePoemChunks2(chunks, toc) {
    var count = chunks.length;
    for (var i = 0; i < count; i += 1) {
        var current = chunks[i];
        if (i === 0) {
            toc.chunk = current.id;
        }
        if (i < count - 1) {
            var next = chunks[i+1];
            current.nextId = next.id;
            next.previousId = current.id;
            toc.push({chunk: current.id});
        }
    }
}

function makeCanonicalPoemFromDflMarkup2(lines, startLineNo, toc) {
    var line, lineno, verseLines = [], poem = {chunks: []}, newVerse = true, chunks;
    if (lines.length > startLineNo) {
        for (lineno = startLineNo; lineno < lineCount; lineno += 1) {
            line = lines[lineno];
            if (line.indexOf)
                if (line && line.length > 0) {
                    if (newVerse) {
                        if (verseLines.length > 0) {
                            chunks = resolvePoemChunks2(makeCanonicalVerseFromDflMarkup2(verseLines), toc);
                            poem.chunks.concat(chunks);
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
            chunks = resolvePoemChunks2(makeCanonicalVerseFromDflMarkup2(verseLines), toc);
            poem.chunks.concat(chunks);
        }
    } else {
        throw {type: 'fatal', msg: 'Lines missing in poem'};
    }
    toc.chunks = poem.chunks;
    return poem;
}
/**
 * A book of poems uses the following markup:
 * # := Name of poem
 * @param text  The text for the poetry book
 * @return {obj} Returns an object with two properties:
 * toc := the table of contents
 * content := the content to store
 */
function makeCanonicalPoemBookFromDflMarkup2(text) {
    var result = {toc: undefined, content: undefined};
    var lines = text.split('\n');
    var lineCount = lines.length;
    var line, delimiter, lineno, title, poemCount = 0;
    for (lineno = 0; lineno < lineCount; lineno += 1) {
        line = lines[lineno];
        if (line && line.chatAt(0) === '# Poem | poem 1') { // Poem marker
            poemCount += 1;
            delimiter = line.indexOf('|');
            if (delimeter !== -1 && ((line.length - delimiter) > 1)) {
                title = line.substring(delimiter).trim();
            } else {
                title = 'Poem ' + poemCount;
            }
            result.toc = {workType: 'Poem', title: title, chunks: undefined};
            makeCanonicalPoemFromDflMarkup2(lines, lineno + 1, result.toc); // TODO need to build TOC & get right contents out of these
        }
    }
    return result;
}

/**
 * Exports an object containing processing methods for each poem content format (e.g., Dfl markup).
 */
exports.methods = {

    /** Dfl markup text exchange methods */
    dflMarkdown: {

        /**
         * Canonicalizes the Dfl markup text content of a
         * catalog item's content. This does not touch the metadata.
         * The canonical format is used in the intrinsics to directly
         * save elements to the DB and to process them.
         * @param catalog   An catalog item whose content is a Dfl markup string version
         * of a poem.
         */
        canonicalize: function (catalog) {
            catalog.content = makeCanonicalPoemFromDflMarkup(catalog.content);
            catalog.contentFormat = 'canonical'; // It is now in the canonical format
        },

        externalize: function (catalog) {
            throw {type: 'fatal', msg: 'externalize not implemented'};
        }
    }
};

