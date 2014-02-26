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

// CLIENT SIDE --------------------------------------------------------------------------------------------

'use strict';

var shared = require('../../public/scripts/app/shared.js').shared;

var maxStringLength = 4096;
var minStringLength = 1;

//var integerRegexp = /^(?:-?(?:0|[1-9][0-9]*))$/;
var urlRegexp = new RegExp("^(http|https|ftp)\://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*$");

//var emailRegexp = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;


/**
 * fieldSpecCache: An object whose key is a work type and whose value
 * is an object whose key is a field name and whose value is the field's spec.
 */
var fieldSpecCache = {};

/**
 * Returns an array of specs as an object whose key
 * is the spec's id and whose value is the spec.
 * @param specArray A spec array for a work type.
 * @returns {{}} Returns an array of specs as an object whose key
 */
function makeWtFieldSpecs(specArray) {
    var specs = {};
    for (var i in specArray) {
        var spec = specArray[i];
        specs[spec.id] = spec;
    }
    return specs;
}
/**
 * getFieldSpec: Returns the field spec for a field
 * @param workType  The work type
 * @param fieldId The id of the field
 * @returns {*} Returns the field's spec object
 */
var getFieldSpec = function (workType, fieldId) {
    var wtSpecs = fieldSpecCache[workType];
    if (typeof wtSpecs === 'undefined') {
        wtSpecs = makeWtFieldSpecs(shared.workTypeCatalogFieldInfo[workType]);
        fieldSpecCache[workType] = wtSpecs;
    }
    return wtSpecs[fieldId];
}

/** schema: some common schema objects */
var schema = {

    validators: {
        /**
         * string: checks the validity of a string value in a field
         * @param catalog the catalog object holding field values
         * @param fieldSpec The field's spec
         * @param txId The transaction id
         */
        string: function (catalog, fieldSpec, txId) {
            var val = catalog[fieldSpec.id];
            var type = typeof val;
            if (type !== 'undefined') {
                if (type !== 'string') {
                    throw {type: 'error', txId: txId, msg: 'Field ' + fieldSpec.name + ' must have be a string'};
                }
                var min = fieldSpec.min || minStringLength;
                var max = fieldSpec.max || maxStringLength;
                var len = val.length;
                if (len !== 0 && (len < min || len > max)) {
                    if (min === max) {
                        throw {type: 'error', txId: txId, msg: 'Field ' + fieldSpec.name + ' must be exactly ' + min + ' characters'};
                    } else {
                        throw {type: 'error', txId: txId, msg: 'Field ' + fieldSpec.name + ' must be between ' + min + ' and ' + max + ' characters'};
                    }
                }
            }
        },

        /**
         * collection: checks whether the val is in the collection of allowed values.
         * @param catalog   the catalog object holding field values
         * @param fieldSpec The field's spec
         * @param txId The transaction id
         */
        collection: function (catalog, fieldSpec, txId) {
            var fieldId = fieldSpec.id;
            var val = catalog[fieldId];
            if (typeof val !== 'undefined') {
                var col = shared.definitions.collections[fieldId];
                if (typeof col === 'undefined') {
                    throw {type: 'fatal', txId: txId, msg: 'Field "' + fieldSpec.name + '" must be a collection'};
                }
                if (!col.hasOwnProperty(val)) {
                    throw {type: 'error', txId: txId, msg: 'Field "' + fieldSpec.name + '" value (' + val + ' is invalid'};
                }
            }
        },

        /**
         * integer: checks whether the val is an integer
         * @param catalog the catalog object holding field values
         * @param fieldSpec The field's spec
         * @param txId The transaction id
         */
        integer: function (catalog, fieldSpec, txId) {
            var val = catalog[fieldSpec.id];
            if (typeof val !== 'undefined') {
                var int;
                try {
                    int = parseInt(val, 10);
                } catch (error) {
                    int = NaN;
                }
                if (isNaN(int)) {
                    throw {type: 'error', txId: txId, msg: 'Field "' + fieldSpec.name + '" value "' + val + '" must be an integer'};
                }
                var min = fieldSpec.min || 0;
                var max = fieldSpec.max || Number.MAX_VALUE;
                if (int < min || int > max) {
                    throw {type: 'error', txId: txId, msg: 'Field "' + fieldSpec.name + '" value "' + val + '" must be between ' + min + ' and ' + max};
                }
            }
        },

        /**
         * http: checks whether the field value is an URL
         * @param catalog the catalog object holding field values
         * @param fieldSpec The field's spec
         * @param txId The transaction id
         */
        url: function (catalog, fieldSpec, txId) {
            var val = catalog[fieldSpec.id];
            if (typeof val !== 'undefined') {
                if (!urlRegexp.test(val)) {
                    throw {type: 'error', txId: txId, msg: 'Field "' + fieldSpec.name + '" value "' + val + '" must be an URL'};
                }
            }
        }
    }, // end validators

    transformers: {

        set: function (fieldSpec, catalog, targetCatalog) {
            var fieldId = fieldSpec.id;
            var val = catalog[fieldId];
            if (typeof val !== 'undefined' && val.length !== 0) {
                targetCatalog[fieldSpec.toId || fieldId] = val;
            }
        },

        push: function (fieldSpec, catalog, targetCatalog) {
            var fieldId = fieldSpec.id;
            var vals = catalog[fieldId];
            var delimiter = ';';
            if (typeof vals !== 'undefined') {
                vals = vals.split(delimiter);
                if (vals.length != 0) {
                    var target = [];
                    var subId = fieldSpec.subId;
                    for (var i in vals) {
                        var name = vals[i];
                        if (name.length != 0) {
                            var obj = {};
                            obj[subId] = name;
                            target.push(obj);
                        }
                    }
                    if (target.length !== 0) {
                        targetCatalog[fieldSpec.toId || fieldId] = target;
                    }
                }
            }
        },

        construct: function (fieldSpec, catalog, targetCatalog) {
            var fieldId = fieldSpec.id;
            if (catalog[fieldId]) {
                var targetSubId = fieldSpec.subId || fieldId;
                var targetId = fieldSpec.toId || fieldId;
                var obj = targetCatalog[targetId] || new Object();
                obj[targetSubId] = catalog[fieldId];
                targetCatalog[targetId] = obj;
            }
        }
    },

    /* query: catalog search query fields */
    query: {
        general: '' /* general: text query on any catalog metadata and content */
    },

    makeClientCatalog: shared.makeClientCatalog,

    catalogFieldSpecs: shared.catalogFieldSpecs,

    getFieldSpec: getFieldSpec,
    CatalogOptions: {

        /* contentFormats: All content formats */
        contentFormats: [shared.definitions.contentFormatRaw, shared.definitions.contentFormatCanonical]
    },

    /**
     * ContentVersion: object contains version information for a catalog item's content.
     * @param id,     The version id, . This is an arbitrary string, but it generally
     * is an integer.
     * @param dateTime The ISO datetime when this version was posted or published (default: now)
     * @constructor
     */
    ContentVersion: function (number, dateTime) {
        this.number = number || '1';
        this.dateTime = dateTime || new Date().toISOString();
    },

    ContentDescription: function () { // TODO incorporate this into UI once main things are working
        /* notes: general notes in freehand */
        this.notes = null;
        /* print: if true, this was published in a print form (default: false) */
        this.print = false;
        /* images: the number of images in work (default: 0). An image can be an illustration, figure, chart, map, etc. */
        this.images = 0;
        /* maps: images that are maps (default: 0) */
        this.maps = 0;
        /* format: if print is true, this is the widthxheight of the book (default: null) */
        this.format = null;
        /* pages: if published in print form, the number of pages (default: null) */
        this.pages = null;
        /* words: number of words in work (default: null) */
        this.words = null;
    },


    Poem: function () {
        this.verses = [];
    },
    Verse: function () {
        this.lines = [];
    }
};
exports.schema = schema;