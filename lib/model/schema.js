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

var definitions = require('../../public/scripts/app/shared.js').shared.definitions;

/** schema: some common schema objects */
var schema = {

    /* query: catalog search query fields */
    query: {
        general: '' /* general: text query on any catalog metadata and content */
    },

    CatalogOptions: {

        /* workTypes: The possible type of works */
        workTypes: [definitions.workType.Unknown, definitions.workType.BookOfPoems, definitions.workType.Poem, definitions.workType.Verse], // TODO need subtypes or hierarchy of subtypes?

        /* contentFormats: The possible formats of the catalog item's content field
         *  contentFormatRaw: It is in raw text form. The interpretation of raw text depends on the workType.
         *       This must be converted to canonical before it can be used in most API methods.
         *  contentFormatCanonical: It is in canonical form, allowing it to be exchanged among all API methods.
         */

        /* contentFormats: All content formats */
        contentFormats: [definitions.contentFormatRaw, definitions.contentFormatCanonical],

        /***
         *  catalogHandler: methods to validate and transform a ClientCatalog object to a Catalog object.
         *  Assumes client catalog text data is sanitized (done at the toplevel of the request).
         *  Each xform property name is the name of a property in the ClientCatalog schema;
         *  its value is a function taking two arguments:
         *  clientCat := the ClientCatalog object
         *  serverCat := the corresponding server-side Catalog object
         *  The method updates the serverCat object with the appropriate field.
         */
        catalogHandler: {
            // TODO validators are now stubs
            // TODO sanitize all text entered
            id: {
                required: false,
                validate: function (clientCat, txId) {
                    // TODO throw error type 'error' if field is not valid
                },
                xform: function (clientCat, serverCat) {
                    serverCat.id = clientCat.id;
                }},
            title: {
                required: true,
                validate: function (clientCat, txId) {
                    if (typeof clientCat.title === 'undefined') {
                        throw {type: 'error', txId: txId, msg: 'Title is required'};
                    }
                },
                xform: function (clientCat, serverCat) {
                    var obj = {title: clientCat.title};
                    if (clientCat.lang) {
                        obj.lang = clientCat.lang;
                    }
                    serverCat.title = obj;
                }},
            lang: {
                required: true,
                validate: function (clientCat, txId) {
                    if (typeof clientCat.lang !== 'undefined') {
                        if (!definitions.lang.hasOwnProperty(clientCat.lang)) {
                            throw {type: 'error', txId: txId, msg: '"' + clientCat.lang + '" is not a valid language code'};
                        }
                    } else if (schema.CatalogOptions.catalogHandler.lang.required) {
                        throw {type: 'error', txId: txId, msg: 'Language is required'};
                    }
                },
                xform: function (clientCat, serverCat) {
                    serverCat.lang = clientCat.lang || 'en';
                }},
            workType: {
                required: true,
                validate: function (clientCat, txId) {
                    if (typeof clientCat.workType === 'undefined') {
                        throw {type: 'error', txId: txId, msg: 'Work type is required'};
                    }
                },
                xform: function (clientCat, serverCat) {
                    serverCat.workType = clientCat.workType;
                }},
            authors: {
                required: false,
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (typeof clientCat.authors !== 'undefined') {
                        serverCat.authors = [clientCat.authors]; // TODO split semicolons
                    }
                }},
            editors: {
                required: false,
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (typeof clientCat.editors !== 'undefined') {
                        serverCat.editors = [clientCat.editors]; // TODO split semicolons
                    }
                }},
            edition: {
                required: false,
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    serverCat.edition = clientCat.edition || 1;
                }},
            publisherName: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherName) {
                        var obj = serverCat.publisher || new schema.Publisher();
                        obj.name = clientCat.publisherName;
                        serverCat.publisher = obj;
                    }
                }},
            publisherCity: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherCity) {
                        var obj = serverCat.publisher || new schema.Publisher();
                        obj.city = clientCat.publisherCity;
                        serverCat.publisher = obj;
                    }
                }},
            publisherProvince: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherProvince) {
                        var obj = serverCat.publisher || new schema.Publisher();
                        obj.province = clientCat.publisherProvince;
                        serverCat.publisher = obj;
                    }
                }},
            publisherCountryISO: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.publisherCountryISO) {
                        var obj = serverCat.publisher || new schema.Publisher();
                        obj.countryISO = clientCat.publisherCountryISO;
                        // obj.country = whatever  TODO place to stash the displayable country name
                        serverCat.publisher = obj;
                    }
                }},
            copyright: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.copyright) {
                        serverCat.copyright = clientCat.copyright;
                    }
                }},
            subjects: {
                validate: function (clientCat) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (serverCat.subjects) {
                        serverCat.subjects = [clientCat.subjects]; // TODO split semicolons
                    }
                }},
            similarEditions: {
                validate: function (clientCat, txId) { // TODO
                },
                xform: function (clientCat, serverCat) {
                    if (clientCat.similarEditions) {
                        serverCat.similarEditions = clientCat.similarEditions; // TODO refine this
                    }
                }}
        },

        /* arrayFields: catalog fields whose value is an array */
        arrayFields: ['authors', 'editors', 'editors'],

        /* objectFields: catalog fields whose value is an object */
        objectFields: ['title', 'subjects', 'baseVersions', 'similarEditions'],

        /* catalogIdentifierTypes: the possible types of Dublic Core identifiers
         * ISBN: an ISBN number
         * URL: a web URL
         */
        catalogIdentifierTypes: ['ISBN', 'URL']
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


    /* Catalog: catalog metadata fields for the server */
    Catalog: function () {

        /* id: This catalog item's system-specific unique id for this application (default: null) */
        this.id = null;

        /* identifier: Corresponds to dcterms:identifier */
        this.identifier = null;

        /* urn: http://www.homermultitext.org/hmt-doc/cite/cts-urn-overview.html
         * registeredWorkIdentifier: textgroup, work, edition | translation, exemplar (each period-separated) */
        this.urn = 'urn:cts:dfl:registeredWorkIdentifier[:passageReference[:subreference]]';

        /* identifierType: The type of identifier (oneof catalogIdentifierTypes) */
        this.identifierType = null;

        /* title: The displayable title in various languages.
         * DCMI: corresponds to dcterms:title.
         */
        this.title = new schema.Title();

        /* description: notes about this work */
        this.description = new schema.ContentDescription();

        /* authors: Authors of current edition (default: empty array) */
        this.authors = [];

        /* editors: The editors of the base edition (default: empty array) */
        this.editors = [];

        /* lang: Default language of text (fragments in a different lang must be explicitly marked as such) (default: English) */
        this.lang = definitions.lang.en;

        /* subjects: The subject areas covered by this catalog item (default: empty object) */
        this.subjects = {};         // TODO have canonical keywords or just generate them from word frequency?

        /* publisher: An object with information about the publisher (default: default object) */
        this.publisher = new schema.Publisher();

        /* edition: The base edition number (default: 1) */
        this.edition = '1';

        /* versions: Instances of schema.ContentVersion. Starts with the first version -- (default: empty array) */
        this.versions = [new schema.ContentVersion()];

        /* similarEditions: Different editions or versions of the base edition (default: empty object) */
        this.similarEditions = {};

        /* workType: The type of work -- see CatalogOptions.workType (default: 'Unknown') */
        this.workType = definitions.workType.Unknown;

        /* format: The work's format (default: raw) -- see CatalogOptions.contentFormats */
        this.contentFormat = definitions.contentFormatRaw;

        /* content: Content in specified contentFormat and workType (default: undefined) */
        this.content = null;
    },

    /* Content Objects */

    Poem: function () {
        this.verses = [];
    },
    Verse: function () {
        this.lines = [];
    }
};

//var data = {definitions: definitions, schema: schema};

/**
 * This file is client between node.js and the client, so:
 */
if ((typeof module !== 'undefined') && module.exports) {
    exports.definitions = definitions;
    exports.schema = schema;
}