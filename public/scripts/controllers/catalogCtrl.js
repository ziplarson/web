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

    var defaultNotify = false;

    $('input[type=file]').css('background-color', 'red');

    $scope.catalog = {

        // Accordion flags
        openOneAtATime: false,
        searchCatalogOpen: true,
        createCatalogOpen: true,

        /** userLang: the client's current language */
        clientLang: window.navigator.userLanguage || window.navigator.language,

        /** contentFile: content file to upload */
        contentFile: undefined,
        /** fileSelected: called with content file selected by user */
        fileSelected: function ($files) {
            $scope.catalog.contentFile = $files[0];
        },

//        createCatalogStep: 1,

        workTypeCatalogFieldInfo: client.shared.workTypeCatalogFieldInfo,

        contentFormatOptions: client.shared.definitions.contentFormats.options,

        workTypeOptions: client.workTypeOptions,

        /* metatadaValid: true if the metadata has been validated by client.
         Used by save button, too.
         */
        metatadaValid: false,

        /* editable: true if catalog metadata can be edited.
         Used by save and edit buttons.
         */
        editable: false,

        postData: {
            metadata: undefined, // The catalog metadata
            notify: defaultNotify // eventually a user preference
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
            $scope.catalog.postData.metadata.contentFormat = contentFormats.dflMarkdown; // default
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

        printMetadata: function () { // DBG
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
            notify: defaultNotify /* eventually part of user prefs */
        },

//        /* goBrowse: Go browse TODO unfinished */
//        goBrowse: function () {
//            document.location = 'index.html#/browse/';
//        },

        /* saveMetadata: creates or updates a catalog item's metadata using a form */
        saveMetadata: function () {
            if ($scope.catalog.metatadaValid) { // save button disabled

                var postData = $scope.catalog.postData;

                if (typeof $scope.catalog.contentFile === 'undefined') {

                    $http.post('/catalog/submit/metadata', postData)
                        .success(function (res, status, headers, config) {
                            if (status === 200) {
                                horaceApp.debug(res);
                                $scope.catalog.metatadaValid = false;
                                setMetadataFieldDisable(true);
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

                } else {
                    $scope.upload = $upload.upload({
                        url: '/catalog/submit/metadata',
                        data: postData, // TODO add a flag if metadata shouldn't be updated
                        file: $scope.catalog.contentFile
                    }).progress(function (evt) {
                            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                        }).success(function (data, status, headers, config) {
                            console.log(data);
                            if (status === 200) {
                                horaceApp.debug(data);
                                $scope.catalog.metatadaValid = false;
                            } else {
                                $scope.catalog.errorMsg = 'Error: Try again. (' + data.error + ')';
                                $scope.catalog.error = true;
                            }
                        });

                }

            }
        },

        /* status: get server status DBG ONLY TODO REMOVE */
        status: function (event) {
            $http.get('/sys/status')
                .success(function (res, status, headers, config) {
                    alert(res.msg);
                })
                .error(function (err, status, headers, config) {
                    console.trace(err);
                });

        },

        /* searchCatalog: searches catalog */
        search: function (event) {
            var query = $scope.catalog.query;
            if ((typeof query === 'undefined') || (typeof event !== 'undefined' && event.keyCode !== 13)) {
                return;
            }
            $scope.catalog.searchResults = [];
            var searchMsg = $('#searchMsg')[0];
            searchMsg.innerHTML = '';
            $('#searchResults').css('display', 'inline');
            $http.post('/catalog/search/query', query)
                .success(function (res, status, headers, config) {
                    if (status === 200) {
                        horaceApp.debug(res);
                        if (typeof res.data === 'undefined' || res.data.length === 0) {
                            searchMsg.innerHTML = res.msg;
                        } else {
                            $scope.catalog.searchResults = res.data;
                        }
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
        }

        /** submitContent: creates or overwrites content for a catalog item */ // TODO
//        submitContent: function () {
//            var formData = new FormData($('form')[0]);
//            $.ajax({
//                url: 'catalog/submit/content',
//                type: 'POST',
//
//                //Ajax events
//                success: function (x) {
//                    console.log('Metadata received by server: ' + JSON.stringify(x));
//                },
//                error: function (err) { // TODO should be either 400 or 500 page
//                    console.trace('Metadata save error: ' + err);
//                },
//                // Form data
//                data: formData,
//
//                //Options to tell jQuery not to process data or worry about content-type.
//                cache: false,
//                contentType: false,
//                processData: false
//            });
//        }
    };

    function setMetadataFieldDisable(disabled) {
        $('#catalogMetadata input, #catalogMetadata select, #catalogMetadata textarea').attr('disabled', disabled);
        $('#fileInput').attr('disabled', disabled);
        $scope.editable = !disabled;
    }

    // TODO not called when catalog.editable model is changed within scope methods!
    $scope.$watch('catalog.editable', function (oldVal, editable) {
//        alert('old=' + oldVal + ' new=' + editable);
        if (oldVal !== editable) {
            setMetadataFieldDisable(editable);
        }
    });

});
/* End of CatalogCtrl */
