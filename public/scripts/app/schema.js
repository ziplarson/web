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

var definitions = {

    /* Supported bcp47 languages for CatalogOptions.lang */
    lang: {
        en: 'en',
        de: 'de',
        fr: 'fr',
        la: 'la',
        grc: 'grc'
    },

    /* Work types for CatalogOptions.workType */
    workType: {
        Unknown: 'Unknown',
        BookOfPoems: 'BookOfPoems',
        Poem: 'Poem',
        Verse: 'Verse'
    },

    /* The content formats for CatalogOptions.contentFormat */
    contentFormatRaw: 'raw',
    contentFormatCanonical: 'canonical'
};

var schema = {

    /* query: catalog search query fields */
    query: {
        general: '' /* general: text query on any catalog metadata and content */
    },

//    /* The most general object TODO might or might not be wise (not in use)*/
//    Item: {
//        /* plist: A property list whose values are any kind of object */
//        plist: {},
//
//        /* parent: A refid to the parent Item or undefined if this is a root Item */
//        parent: undefined,
//
//        /* children: An ordered set of refids */
//        children: []
//    },

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

        /* arrayFields: catalog fields whose value is an array */
        arrayFields: ['baseAuthorNames', 'authors', 'baseEditors', 'editors'],

        /* objectFields: catalog fields whose value is an object */
        objectFields: ['title', 'subjects', 'baseVersions', 'similarVersions'],

        /* catalogIdentifierTypes: the possible types of Dublic Core identifiers
         * ISBN: an ISBN number
         * URL: a web URL
         */
        catalogIdentifierTypes: ['ISBN', 'URL']
    },

    /**
     * ContentVersion: object contains version information for a catalog item's content.
     * @param id    The version id. This is an arbitrary string, but it generally
     * is an integer.
     * @param dateTime  The datetime when this version was posted or published.
     * @constructor
     */
    ContentVersion: function (id, number, dateTime) {
        this.id = id || '1';
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
        /* country: displayable country of publisher */
        this.country = null;
        /* countryCode: ISO country code of publisher */
        this.countryISO = null;

    },

    ContentDescription: function () {
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

        /* title: The displayable title in various languages (defaults to an empty object).
         * DCMI: corresponds to dcterms:title.
         */
        this.title = {};

        /* description: notes about this work */
        this.description = new schema.ContentDescription();

        /* canonical: True if catalog's metadata (not including content field) is in canonical form. (default: false) */
        this.mdCanonical = false;

        /* baseAuthorNames: The authors of the base edition (default: empty array)  */
        this.baseAuthorNames = [];

        /* authors: Authors of current edition (default: empty array) (authors who ammended the content--rathen than just annotating it) */
        this.authors = [];

        /* baseEditors: The editors of the base edition (default: empty array) TODO should be a sequence of person ID references conjoined with a distinguished literal name */
        this.baseEditors = [];

        /* editors: Editors who annotated or ammended the content (default: empty array) */
        this.editors = [];

        /* lang: Default language of text (fragments in a different lang must be explicitly marked as such) (default: English) */
        this.lang = definitions.lang.en;

        /* subjects: The subject areas covered by this catalog item (default: empty object) */
        this.subjects = {};         // TODO add keywords or just generate them from word frequency?

        /* basePublisher: An object with information about the publisher (default: default object) */
        this.basePublisher = new schema.Publisher();

        /* baseEdition: The base edition number (default: 1) */
        this.baseEdition = '1';

        /* versions: Instances of schema.ContentVersion. Starts with the first version -- (default: empty array) */
        this.versions = [new schema.ContentVersion()];

        /* baseEditions: Editions/versions closest to the base edition (default: empty object) */
        this.baseEditions = {};

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

var data = {definitions: definitions, schema: schema};

/**
 * This file is shared between node.js and the client, so:
 */
if ((typeof module !== 'undefined') && module.exports) {
    exports.definitions = definitions;
    exports.schema = schema;
}