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

// CLIENT SIDE --------------------------------------------------------------------------------------------

'use strict';

// TODO error handling


/**
 * Controls the catalog behavior (search, create, update).
 */

horaceApp.controller('CatalogCtrl', function ($scope, $http, SocketsService, $timeout, $upload) {

    $scope.catalog = {

        // Accordion flags
        openOneAtATime: false,
        createCatalogOpen: true,
        searchCatalogOpen: true,

        workTypeCatalogFieldInfo: client.shared.workTypeCatalogFieldInfo,

        workTypeOptions: client.workTypeOptions,

        postData: {
            metadata: undefined, // The catalog metadata
            notify: true // eventually a user preference
        },

        searchResults: undefined,

        /**
         * workTypeSelected: Called when a new work type is selected.
         * This method displays the catalog fields for the selected type of work.
         */
        workTypeSelected: function () {
            $scope.catalog.resetCatalogMetadata();
            $('#catalogFields').css('display', 'inline');
        },

        /**
         * resetCatalogMetadata: Clears the catalog metadata (and its corresponding fields)
         */
        resetCatalogMetadata: function () {
            var wt = $scope.catalog.postData.metadata.workType;
            $scope.catalog.postData.metadata = new client.shared.makeClientCatalog(wt);
            $scope.catalog.postData.metadata.workType = wt;
        },

        /**
         * Fetches a list of potential matches for an address from a user's typeahead input
         * @param input   The user's current typed input
         * @returns {!webdriver.promise.Promise}
         */
        getAddress: function (input) {
            return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: input,
                    sensor: false
                }
            }).then(function (res) {
                    var addresses = [];
                    angular.forEach(res.data.results, function (item) {
//                        addresses.push(item.formatted_address);
                        addresses.push(item);
                    });
                    return addresses;
                });
        },

        printMetadata: function() { // DBG
            console.info($scope.catalog.postData.metadata);
        },

        /**
         * selectedAddress: Called when the user has selected an address. The address
         * is a location returned by the Google location service.
         * @param address   Google location service object
         */
        selectedAddress: function (address) {
            var city;
            var province;
            var country;
            for (var i in address.address_components) {
                var component = address.address_components[i];
                if (component.types[0] === 'locality') {
                    city = component.long_name;
                } else if (component.types[0] === 'administrative_area_level_1') {
                    province = component.long_name;
                } else if (component.types[0] === 'country') {
                    country = component.short_name;
                }
            }
            if (address.formatted_address) {
                $scope.catalog.postData.metadata.publisherAddress = address.formatted_address;
            }
            if (city) {
                $scope.catalog.postData.metadata.publisherCity = city;
            }
            if (province) {
                $scope.catalog.postData.metadata.publisherProvince = province;
            }
            if (country) {
                $scope.catalog.postData.metadata.publisherCountry = country;
            }
        },

        /* query: catalog search query fields TODO must conform to server-side schema.query! */
        query: {
            general: null, /* general: queries any metadata and content */
            notify: true /* eventually part of user prefs */
        },

//        /* goBrowse: Go browse TODO unfinished */
//        goBrowse: function () {
//            document.location = 'index.html#/browse/';
//        },

        /* submitMetadata: creates or updates a catalog item's metadata using a form */
        submitMetadata: function () {
            var postData = $scope.catalog.postData;
            $http.post('/catalog/submit/metadata', postData)
                .success(function (res, status, headers, config) {
                    if (status === 200) {
                        horaceApp.debug(res);
                    } else {
                        $scope.catalog.errorMsg = 'Error: Try again. (' + res.error + ')';
                        $scope.catalog.error = true;
                    }
                })
                .error(function (err, status, headers, config) { // TODO should be either 400 or 500 page
                    if (status !== 200) {
                        horaceApp.debug(err);
                    }
                    $scope.catalog.errorMsg = 'Technical Problem: Please retry. (' + status + ')';
                    $scope.catalog.error = true;
                });
        },

        /* searchCatalog: searches catalog */
        search: function () {
            var query = $scope.catalog.query;
            $http.post('/catalog/search/query', query)
                .success(function (res, status, headers, config) {
                    if (status === 200) {
                        horaceApp.debug(res);
                    } else {
                        $scope.catalog.errorMsg = 'Error: Try again. (' + res.error + ')';

                        $scope.catalog.error = true;
                    }
                })
                .error(function (err, status, headers, config) { // TODO should be either 400 or 500 page
                    if (status !== 200) {
                        horaceApp.debug(err);
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


    SocketsService.setCatalogSearchQueryListener(function (tx) {
        $scope.catalog.searchResults = tx.data;
        $('#searchResults').css('display', 'inline');
    });

});
/* End of CatalogCtrl */


// TODO submit content part is currently directly using Ajax & not working through controller: any need for it to do so?
//    $scope.catalog = {
//        progress: [],
//        response: 'Ready To Submit',
//        immediate: true, /* Upload immediately after selecting the file */
//        model: {type: 'BookPoems'},
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