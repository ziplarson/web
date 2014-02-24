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

/**
 * noopValidityFun: assumes field value is ok
 * @param val The field's value
 * @param fieldSpec The field's spec
 */
function noopValidityFun(val, fieldSpec) {
    return true;
}

/**
 * stringValidityFun: checks the validity of a string value in a field
 * @param val The field's value (must be defined)
 * @param fieldSpec The field's spec
 * @param txId The transaction id
 */
function stringValidityFun(val, fieldSpec, txId) {
    var type = typeof val;
    if (type !== 'undefined') {
        if (type !== 'string') {
            throw {type: 'error', txId: txId, msg: 'Field ' + fieldSpec.name + ' must have be a string'};
        }
        var minLen = fieldSpec.minLength || 1;
        if (val.length < minLen) {
            throw {type: 'error', txId: txId, msg: 'Field ' + fieldSpec.name + ' must have at least ' + minLen + ' characters'};
        }
    }
}

/**
 * Composes two validity functions into one.
 * @param baseFun   The first function to apply
 * @param extraFun  The second function to apply
 * @returns {Function}  The composed function.
 */
function composeValidityFun(baseFun, extraFun) {
    return function (val, fieldSpec, txId) {
        baseFun(val, fieldSpec, txId);
        extraFun(val, fieldSpec, txId);
    }
}


/**
 * fieldSpecs: An object whose key is a work type and whose value
 * is an object whose key is a field name and whose value is the field's spec.
 */
var fieldSpecs = {};

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
 * @param fieldName The name of the field
 * @returns {*} Returns the field's spec object
 */
function getFieldSpec(workType, fieldName) {
    var wtSpecs = fieldSpecs[workType];
    if (typeof wtSpecs === 'undefined') {
        wtSpecs = makeWtFieldSpecs(shared.workTypeCatalogFieldInfo[workType]);
        fieldSpecs[workType] = wtSpecs;
    }
    return wtSpecs[fieldName];
}

/**
 * Throws an error if the field is required.
 * @param clientCat The client catalog object
 * @param fieldName The field name
 * @param txId  The transaction id
 * @param validityFun An optional value validity function check
 * with signature function(value, fieldSpec, txId); its parameters are the field's
 * value, its spec, and the current transaction id (if any), respectively. Function must throw an error
 * if the value is invalid (if the value is undefined, it is ignored).
 */
function checkField(clientCat, fieldName, txId, validityFun) {
    try {
        if (typeof validityFun === 'undefined') {
            validityFun = noopValidityFun;
        }
        var fieldSpec = getFieldSpec(clientCat.workType, fieldName);
        if (typeof fieldSpec === 'undefined') {
            throw {type: 'fatal', msg: 'No field spec "' + fieldName + '"'};
        }
        if (fieldSpec.required) {
            var val = clientCat[fieldName];
            if (typeof val === 'undefined') {
                throw {type: 'error', txId: txId, msg: 'Catalog field "' + fieldName + '" is required'};
            }
        }
        if (validityFun) {
            validityFun(val, fieldSpec, txId);
        }

    } catch (err) {
        console.error(err);
        throw err;
    }
}
/** schema: some common schema objects */
var schema = {

    /* query: catalog search query fields */
    query: {
        general: '' /* general: text query on any catalog metadata and content */
    },

    makeClientCatalog: shared.makeClientCatalog,

    handlers: {
        /***
         *  catalogFieldHandlers: methods to validate and transform a ClientCatalog object to a Catalog object.
         *  Assumes client catalog text data is sanitized (done at the toplevel of the request).
         *  Each xform property name is the name of a property in the ClientCatalog schema;
         *  its value is a function taking two arguments:
         *  clientCat := the ClientCatalog object
         *  serverCat := the corresponding server-side Catalog object
         *  The method updates the serverCat object with the appropriate field.
         */
        catalogFieldHandlers: {
            // TODO make this more data driven
            // TODO validators are now stubs
            _id: {
                validate: function (clientCat, txId) { // TODO replace noopValidityFun with appropriate check for an id
                    checkField(clientCat, '_id', txId, noopValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat._id) {
                        serverCat.id = clientCat._id;
                    }
                }},
            title: {
                validate: function (clientCat, txId) {
                    checkField(clientCat, 'title', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    var obj = {title: clientCat.title};
                    if (clientCat.lang) {
                        obj.lang = clientCat.lang;
                    }
                    serverCat.title = obj;
                }},
            lang: {
                validate: function (clientCat, txId) {
                    checkField(clientCat, 'lang', txId, composeValidityFun(stringValidityFun,
                        function (val, fieldSpec) {
                            if (typeof clientCat.lang !== 'undefined') {
                                if (!shared.definitions.lang.hasOwnProperty(clientCat.lang)) {
                                    throw {type: 'error', txId: txId, msg: '"' + clientCat.lang + '" is not a valid language code'};
                                }
                            }
                        }
                    ));
                },
                xform: function (clientCat, serverCat) {
                    serverCat.lang = clientCat.lang || 'en';
                }},
            workType: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'workType', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    serverCat.workType = clientCat.workType;
                }},
            authors: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'authors', txId, stringValidityFun);

                },
                xform: function (clientCat, serverCat) {
                    if (typeof clientCat.authors !== 'undefined') {
                        serverCat.authors = [clientCat.authors]; // TODO split semicolons
                    }
                }},
            editors: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'editors', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (typeof clientCat.editors !== 'undefined') {
                        serverCat.editors = [clientCat.editors]; // TODO split semicolons
                    }
                }},
            edition: {
                validate: function (clientCat, txId) { // TODO should be a numerical check
                    checkField(clientCat, 'edition', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    serverCat.edition = clientCat.edition || 1;
                }},
            publisherName: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'publisherName', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherName) {
                        var publisher = serverCat.publisher || new schema.Publisher();
                        publisher.name = clientCat.publisherName;
                        serverCat.publisher = publisher;
                    }
                }},
            publisherCity: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'publisherCity', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherCity) {
                        var publisher = serverCat.publisher || new schema.Publisher();
                        publisher.city = clientCat.publisherCity;
                        serverCat.publisher = publisher;
                    }
                }},
            publisherProvince: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'publisherProvince', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherProvince) {
                        var publisher = serverCat.publisher || new schema.Publisher();
                        publisher.province = clientCat.publisherProvince;
                        serverCat.publisher = publisher;
                    }
                }},
            publisherCountryISO: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'publisherCountryISO', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherCountryISO) {
                        var publisher = serverCat.publisher || new schema.Publisher();
                        publisher.countryISO = clientCat.publisherCountryISO;
                        // obj.country = whatever  TODO place to stash the displayable country name
                        serverCat.publisher = publisher;
                    }
                }},
            copyright: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'copyright', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.copyright) {
                        serverCat.copyright = clientCat.copyright;
                    }
                }},
            subjects: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'subjects', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (serverCat.subjects) {
                        serverCat.subjects = [clientCat.subjects]; // TODO split semicolons
                    }
                }},
            pageUrl: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'pageUrl', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.pageUrl) {
                        serverCat.pageUrl = clientCat.pageUrl;
                    }
                }},
            websiteUrl: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'websiteUrl', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.websiteUrl) {
                        serverCat.websiteUrl = clientCat.websiteUrl;
                    }
                }},
            similarEditions: {
                validate: function (clientCat, txId) { // TODO
                    checkField(clientCat, 'similarEditions', txId, stringValidityFun);
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.similarEditions) {
                        serverCat.similarEditions = clientCat.similarEditions; // TODO refine this
                    }
                }}
        }
    },

    CatalogOptions: {

//        /* workTypes: The possible type of works */
//        workTypes: [shared.definitions.workType.Unknown, shared.definitions.workType.BookOfPoems, shared.definitions.workType.Poem, shared.definitions.workType.Verse], // TODO need subtypes or hierarchy of subtypes?

        /* contentFormats: All content formats */
        contentFormats: [shared.definitions.contentFormatRaw, shared.definitions.contentFormatCanonical]

//        /* arrayFields: catalog fields whose value is an array */
//        arrayFields: ['authors', 'editors', 'editors'],
//
//        /* objectFields: catalog fields whose value is an object */
//        objectFields: ['title', 'subjects', 'baseVersions', 'similarEditions'],

        /* catalogIdentifierTypes: the possible types of Dublic Core identifiers
         * ISBN: an ISBN number
         * URL: a web URL
         */
//        catalogIdentifierTypes: ['ISBN', 'URL']
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

    Person: function () {
        this.fullName = null;
    },

    Publisher: function () {
        /* id: the publisher's internal id */
        this.id = null;
        /* name: the publisher's display name */
        this.name = null;
        /* city: city or town of publisher */
        this.city = null;
        /* province: the publisher's province */
        this.province = null;
        /* country: displayable country of publisher TODO ? */
        this.country = null;
        /* countryCode: ISO country code of publisher */
        this.countryISO = null;

    },

    Title: function () {
        /* lang: the title's language */
        this.lang = null;
        /* title: the title's text */
        this.text = null;
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


//    /* Catalog: catalog metadata fields for the server */
//    Catalog: function () {
//
//        /* id: This catalog item's system-specific unique id for this application (default: null) */
//        this.id = null;
//
//        /* identifier: Corresponds to dcterms:identifier */
//        this.identifier = null;
//
//        /* urn: http://www.homermultitext.org/hmt-doc/cite/cts-urn-overview.html
//         * registeredWorkIdentifier: textgroup, work, edition | translation, exemplar (each period-separated) */
//        this.urn = 'urn:cts:dfl:registeredWorkIdentifier[:passageReference[:subreference]]';
//
//        /* identifierType: The type of identifier  */
//        this.identifierType = null;
//
//        /* title: The displayable title in various languages.
//         * DCMI: corresponds to dcterms:title.
//         */
//        this.title = new schema.Title();
//
//        /* description: notes about this work */
//        this.description = new schema.ContentDescription();
//
//        /* authors: Authors of current edition (default: empty array) */
//        this.authors = [];
//
//        /* editors: The editors of the base edition (default: empty array) */
//        this.editors = [];
//
//        /* lang: Default language of text (fragments in a different lang must be explicitly marked as such) (default: English) */
//        this.lang = shared.definitions.lang.en;
//
//        /* subjects: The subject areas covered by this catalog item (default: empty object) */
//        this.subjects = {};         // TODO have canonical keywords or just generate them from word frequency?
//
//        /* publisher: An object with information about the publisher (default: default object) */
//        this.publisher = new schema.Publisher();
//
//        /* edition: The base edition number (default: 1) */
//        this.edition = '1';
//
//        /* versions: Instances of schema.ContentVersion. Starts with the first version -- (default: empty array) */
//        this.versions = [new schema.ContentVersion()];
//
//        /* similarEditions: Different editions or versions of the base edition (default: empty object) */
//        this.similarEditions = {};
//
//        /* workType: The type of work -- see CatalogOptions.workType (default: 'Unknown') */
//        this.workType = shared.definitions.workType.Unknown;
//
//        /* format: The work's format (default: raw) -- see CatalogOptions.contentFormats */
//        this.contentFormat = shared.definitions.contentFormatRaw;
//
//        /* content: Content in specified contentFormat and workType (default: undefined) */
//        this.content = null;
//    },

    /* Content Objects */

    Poem: function () {
        this.verses = [];
    },
    Verse: function () {
        this.lines = [];
    }
};
exports.schema = schema;