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

// CLIENT SIDE --------------------------------------------------------------------------------------------

horaceApp.controller('CatalogCtrl', function ($scope, $http, $timeout, $upload) {

    $scope.oneAtATime = true;

    $scope.groups = [
        {
            title: "Dynamic Group Header - 1",
            content: "Dynamic Group Body - 1"
        },
        {
            title: "Dynamic Group Header - 2",
            content: "Dynamic Group Body - 2"
        }
    ];

    $scope.items = ['Item 1', 'Item 2', 'Item 3'];

    $scope.addItem = function() {
        var newItemNo = $scope.items.length + 1;
        $scope.items.push('Item ' + newItemNo);
    };

    $scope.catalog = {

//        groups: [
//            {title: 'Create or Update Catalog Metadata', content: 'stuff for create'},
//            {title: 'Search Catalog', content: 'stuff for search'}
//        ],

        metadataOptions: [
            {name: 'Title', type: 'text'},
            {name: 'Description', type: 'text'},
            {name: 'Subject', type: 'text'},
            {name: 'URN', type: 'text'},
            {name: 'Work Type', options: ['BookOfPoems', 'BookOfProse', 'Poem', 'Verse', 'VerseLine']},
            {name: 'Author', type: 'text'},
            {name: 'Publisher', type: 'text'},
            {name: 'Editor', type: 'text'},
            {name: 'Edition', type: 'text'}
        ],

        /* metadata: catalog metadata fields TODO must conform to schema.Catalog! */
        metadata: {
            notify: true,
            id: '',
            title: '[{"en": "Poem 1"}]',
            workType: 'Poem',
            baseAuthorNames: 'Catullus, Gaius Valerius',
            basePublisher: 'Harvard University Press',
            baseEdition: '1',
            baseEditors: 'Merrill, Elmer Truesdell',
            lang: 'la',
            subjects: '{"en": ["poetry"]}',
            contentFormat:'raw',
            baseVersions: '{"worldcat": "http://www.worldcat.org/title/catullus/oclc/8121753", "achiveOrg": "", "hathiTrust": "http://babel.hathitrust.org/cgi/pt?id=uc1.32106005763302;view=1up;seq=5"}',
            similarVersions: '{"archiveOrg": "https://archive.org/details/thepoemsandfragm18867gut"}'
        },

        /* query: catalog search query fields TODO must conform to schema.query! */
        query: {
            general: null /* general: queries any metadata and content */
        },

        /* goBrowse: Go browse TODO unfinished */
        goBrowse: function () {
            alert('goBrowse');
            document.location = 'index.html#/browse/';
        },

        /* submitMetadata: creates or updates a catalog item's metadata using a form */
        submitMetadata: function () {
            var metadata = $scope.catalog.metadata;
            $http.post('/catalog/submit/metadata', metadata)
                .success(function (res, status, headers, config) {
                    if (status === 200) {
                        $('#debuginfo').innerHTML = '<b>' + res + '</b>';
                    } else {
                        $scope.catalog.errorMsg = 'Error: Try again. (' + res.error + ')';
                        $scope.catalog.error = true;
                    }
                })
                .error(function (err, status, headers, config) { // TODO should be either 400 or 500 page
                    if (status !== 200) {
                        $('#debuginfo').innerHTML = '<b>Error: HTTP STATUS ' + status + '</b>';
                    }
                    $scope.catalog.errorMsg = 'Technical Problem: Please retry. (' + err + ')';
                    $scope.catalog.error = true;
                });
        },

        /* searchCatalog: searches catalog */
        search: function() {
            var query = $scope.catalog.query;
            $http.post('/catalog/search/query', query)
                .success(function (res, status, headers, config) {
                    console.info('Status ' + status);
                    if (status === 200) {
                        $('#debuginfo').innerHTML = '<b>' + res + '</b>';
                    } else {
                        $scope.catalog.errorMsg = 'Error: Try again. (' + res.error + ')';

                        $scope.catalog.error = true;
                    }
                })
                .error(function (err, status, headers, config) { // TODO should be either 400 or 500 page
                    if (status !== 200) {
                        $('#debuginfo').innerHTML = '<b>Error: HTTP STATUS ' + status + '</b>';
                    }
                    $scope.catalog.errorMsg = 'Technical Problem: Please retry. (' + err + ')';
                    $scope.catalog.error = true;
                });
        },

        /** submitContent: creates or overwrites content for a catalog item */ // TODO
        submitContent: function () {
            var formData = new FormData($('form')[0]);
            $.ajax({
                url: 'catalog/submit/content',
                type: 'POST',

                //Ajax events
                success: function (x) {
                    console.log('Metadata received by server: ' + JSON.stringify(x));
                },
                error: function (err) { // TODO should be either 400 or 500 page
                    console.error('Metadata save error: ' + err);
                },
                // Form data
                data: formData,

                //Options to tell jQuery not to process data or worry about content-type.
                cache: false,
                contentType: false,
                processData: false
            });
        }
    };

});
/* End of CatalogCtrl */


// TODO submit content part is currently directly using Ajax & not working through controller: any need for it to do so?
//    $scope.catalog = {
//        progress: [],
//        response: 'Ready To Submit',
//        immediate: true, /* Upload immediately after selecting the file */
//        model: {type: 'BookOfPoems'},
//        setPreview: function (fileReader, index) {
//            fileReader.onload = $scope.onload;
//        }
//    };
//
//    $scope.onFileSelect = function ($files) {
//        $scope.selectedFiles = [];
//        $scope.catalog.progress = [];
//        if ($scope.upload && $scope.upload.length > 0) {
//            var i;
//            for (i = 0; i < $scope.upload.length; i += 1) {
//                if ($scope.upload[i] !== null) {
//                    $scope.upload[i].abort();
//                }
//            }
//        }
//        $scope.upload = [];
//        $scope.uploadResult = [];
//        $scope.selectedFiles = $files;
//        $scope.dataUrls = [];
//        var j;
//        for (j = 0; j < $files.length; j += 1) {
//            var $file = $files[j];
//            if (window.FileReader && $file.type.indexOf('image') > -1) {
//                var fileReader = new FileReader();
//                fileReader.readAsDataURL($files[j]);
//                $scope.catalog.setPreview(fileReader, j);
//            }
//            $scope.catalog.progress[j] = -1;
//            if ($scope.catalog.immediate) {
//                $scope.start(j);
//            }
//        }
//    };
//
//    $scope.start = function (index) {
//        $scope.catalog.progress[index] = 0;
//        var fileReader = new FileReader();
//        fileReader.readAsArrayBuffer($scope.selectedFiles[index]);
//        fileReader.onload = function (e) {
//            var fileType = $scope.selectedFiles[index].type;
//            $scope.upload[index] = $upload.http({
//                url: '/submit',
////                headers: {'Content-Type': fileType},
//                data: e.target.result
//            }).then(function (response) {
//                    $scope.uploadResult.push(response.data.result);
//                    $scope.catalog.response = response.data;
//                    console.log(response.data);
//                }, null, function (evt) {
//                    // Math.min is to fix IE which reports 200% sometimes
//                    $scope.catalog.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
//                });
//        };
//    };