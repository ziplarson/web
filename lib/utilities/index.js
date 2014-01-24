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

/**
 * Pretty prints the object on the console. Avoids circularities
 * @param obj   Javascript object.
 */
exports.pprint = function (obj) {
    var hash = {};
    var r = JSON.stringify(obj, function (key, value) {
        if (key && key.length > 0 && typeof value === 'object') {
            var count = hash[value];
            if (count && count === 1) {
                return '<Circular Object>';
            }
            hash[value] = 1;
        }
        return value;
    }, '\t');
    console.log(r);
};

/**
 * Escapes XML-style markup but keeps quotes, etc. and optionally
 * checks the length of the text.
 * E.g., '<a>"foo"' is rendered as '&gt;a&lt;"foo"'.
 * @param text  Raw text.
 * @param maxLength Optional: the maximum number of characters in the text.
 * Default: unlimited length.
 * @returns {*} The text without any XML markup.
 * @throws Error if maxLength is specified and is exceeded.
 */
exports.sanitizeText = function (text, maxLength) {
    // TODO Should check the validity (remove XML markup but keep quotes, etc)
    if (maxLength && text.length > maxLength) {
        throw {msg: 'Text exceeded maximum length of ' + maxLength + ' chars'};
    }
    return text; // stub
};


/**
 * Removes HTML markup (e.g., changes '<' to '&lt;') and just changes double
 * quotes to &quot;. TODO see if sanitizeText will do.
 * @param text Some text.
 * @returns {string} Cleaned up text.
 */
exports.escapeHtml = function (text) {
    return text.toString().
        replace('<', '&lt;').
        replace('>', '&gt;').
        replace('"', '&quot;');
}