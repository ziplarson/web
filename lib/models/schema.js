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

var definitions = {

    /* Supported bcp47 languages for CatalogOptions.lang */
    langEn: 'en',
    langGerman: 'de',
    langFrench: 'fr',
    langLa: 'la',
    langAncientGreek: 'grc',

    /* Work types for CatalogOptions.workType */
    workTypeUnknown: 'Unknown',
    workTypeBookOfPoems: 'BookOfPoems',
    workTypePoem: 'Poem',
    workTypeVerse: 'Verse',

    /* The content formats for CatalogOptions.contentFormat */
    contentFormatRaw: 'raw',
    contentFormatCanonical: 'canonical'
};
exports.definitions = definitions;

var schema = {

    CatalogOptions: {

        /* langs: All supported languages */
        langs: [definitions.langEn, definitions.langGerman, definitions.langFrench, definitions.langLa, definitions.langAncientGreek], // TODO Require a new bcp47.js object

        /* workTypes: The possible type of works */
        workTypes: [definitions.workTypeUnknown, definitions.workTypeBookOfPoems, definitions.workTypePoem, definitions.workTypeVerse], // TODO need subtypes or hierarchy of subtypes?

        /* contentFormats: The possible formats of the catalog item's content field
         *  contentFormatRaw: It is in raw text form. The interpretation of raw text depends on the workType.
         *       This must be converted to canonical before it can be used in most API methods.
         *  contentFormatCanonical: It is in canonical form, allowing it to be exchanged among all API methods.
         */

        /* contentFormats: All content formats */
        contentFormats: [definitions.contentFormatRaw, definitions.contentFormatCanonical],

        /* arrayFields: catalog fields whose value is an array */
        arrayFields: ['baseAuthors', 'authors', 'baseEditors', 'editors'],

        /* objectFields: catalog fields whose value is an object */
        objectFields: ['title', 'subjects', 'baseVersions', 'similarVersions']
    },

    /**
     * Version: object contains version information for a catalog item.
     * @param id    The version id. This is an arbitrary string, but it generally
     * is an integer.
     * @param dateTime  The datetime when this version was created.
     * @constructor
     */
    Version: function(id, dateTime) {
        this.id = id;
        this.dateTime = dateTime;
    },

    Catalog: function () {
        /* catalogId: the globally unique catalog id (default: undefined) */
        this.catalogId = undefined;
        /** canonical: True if catalog's metadata (not including content field) is in canonical form. (default: false) */
        this.mdCanonical = false;
        /* baseAuthors: The authors of the base edition (default: empty array) TODO should be a sequence of person ID references */
        this.baseAuthors = [];
        /* authors: Authors of current edition (default: empty array) (authors who ammended the content--rathen than just annotating it) */
        this.authors = [];
        /* baseEditors: The editors of the base edition (default: empty array) TODO should be a sequence of person ID references */
        this.baseEditors = [];
        /* editors: Editors who annotated the content (default: empty array) */
        this.editors = [];
        /* title: The displayable title in various languages (defaults to an empty object) */
        this.title = {};
        /* lang: Default language of text (fragments in a different lang must be explicitly marked as such) (default: English) */
        this.lang = definitions.langEn;
        /* subjects: The subject areas covered by this catalog item (default: empty object) */
        this.subjects = {};         // TODO add keywords or just generate them from word frequency?
        /* basePublisher: This should be an ID to a record with publisher's name, address, etc. (default: undefined) */
        this.basePublisher = undefined;
        /* baseEdition: The base edition number (default: 1) */
        this.baseEdition = '1';
        /* versions: Starts with the first version -- ea. version is instance of Version prototype (default: empty array) */
        this.versions = [];
        /* baseVersions: Editions/versions closest to the base edition (default: empty object) */
        this.baseVersions = {};
        /* similarVersions: Different editions or versions of the base edition (default: empty object) */
        this.similarVersions = {};
        /* workType: The type of work -- see CatalogOptions.workTypes (default: 'Unknown') */
        this.workType = definitions.workTypeUnknown;
        /* format: The work's format (default: raw) -- see CatalogOptions.contentFormats */
        this.contentFormat = definitions.contentFormatRaw;
        /* content: Content in specified contentFormat and workType (default: undefined) */
        this.content = undefined;
    },


    /* Data Objects */

    Poem: function () {
        this.verses = [];
    },
    Verse: function () {
        this.lines = [];
    }
};
exports.schema = schema;
