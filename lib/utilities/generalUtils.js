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

///**
// * Pretty prints the object on the console. Avoids circularities
// * @param obj   Javascript object.
// */
//var pprint = function (obj) {
//    var hash = {};
//    var r = JSON.stringify(obj, function (key, value) {
//        if (key && key.length > 0 && typeof value === 'object') {
//            var count = hash[value];
//            if (count && count === 1) {
//                return '<Circular Object>';
//            }
//            hash[value] = 1;
//        }
//        return value;
//    }, '\t');
//    console.log(r);
//};

/**
 * Escapes XML-style markup and optionally checks the length of the text.
 * If specified object is an array, each object is in the array is recursively sanitized.
 * If it is a js object, each subobject is recursively sanitized.
 * Any other type of object is simply returned.
 * @param obj An object.
 * @returns {Array} Returns the same array, sanitized.
 * @throws Error if there's an attemp to insert a function
 */
var sanitizeObject = function (obj) {
    var type = (typeof obj);
    if (type === 'string') {
        return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } else if (type === 'boolean' || type === 'number' || type === 'function' || type === 'undefined') {
        return obj;
    } else if (type === 'function') {
        throw {type: 'error', msg: 'Invalid insertion of function'};
    } else {
        var index;
        for (index in obj) {
            obj[index] = sanitizeObject(obj[index]);
        }
        return obj;
    }
};

function makeErrorMsg(text, prefix, suffix) {
    var msg = text;
    if (prefix) {
        msg = prefix.toString() + msg;
    }
    if (suffix) {
        msg += suffix.toString();
    }
    return msg;
}

var makeError = function (obj, errorMsgSuffix, errorMsgPrefix) {
    var error;
    if (!obj) {
        error = {type: 'fatal', msg: makeErrorMsg('Unknown', errorMsgPrefix, errorMsgSuffix)};
    } else if (obj.type && obj.msg) {
        obj.msg = makeErrorMsg(obj.msg, errorMsgPrefix, errorMsgSuffix);
        error = obj;
    } else if (obj['arguments'] && obj.type) {
        error = {type: 'fatal', msg: makeErrorMsg((obj.type) + ': ' + obj['arguments'].toString(), errorMsgPrefix, errorMsgSuffix) };
    } else {
        error = {type: 'fatal', msg: makeErrorMsg(JSON.stringify(obj), errorMsgPrefix, errorMsgSuffix)};
    }
    return error;
};

var alphanumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var idCharsLength = alphanumericCharacters.length;


/**
 * Creates a id of the specified length. Id is
 * randomized set of aphanumeric characters. This is not a GUID!
 * @param idLength The number of characters in the id
 * @returns {string}    The id
 */
var makeId = function (idLength) {
    var id = [];
    var i;
    for (i = 0; i < idLength; i += 1) {
        var rand = Math.floor(Math.random() * idCharsLength);
        id.push(alphanumericCharacters[rand]);
    }
    return id.join('');
};

//exports.pprint = pprint;
exports.sanitizeObject = sanitizeObject;
exports.makeError = makeError;
exports.makeId = makeId;

/* txIdLength: Suggested length for transaction ids */
exports.txIdLength = 6;