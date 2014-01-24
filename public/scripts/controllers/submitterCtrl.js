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

// Signin controls username and password model
horaceApp.controller('SubmitterCtrl', function ($scope, $http, $timeout, $upload) {


    $scope.submitter = {
        progress: [],
        response: 'Ready To Submit',
        immediate: true, /* Upload immediately after selecting the file */
        model: {type: 'BookOfPoems'},
        setPreview: function (fileReader, index) {
            fileReader.onload = $scope.onload;
        }
    };

    $scope.onFileSelect = function ($files) {
        $scope.selectedFiles = [];
        $scope.submitter.progress = [];
        if ($scope.upload && $scope.upload.length > 0) {
            var i;
            for (i = 0; i < $scope.upload.length; i += 1) {
                if ($scope.upload[i] !== null) {
                    $scope.upload[i].abort();
                }
            }
        }
        $scope.upload = [];
        $scope.uploadResult = [];
        $scope.selectedFiles = $files;
        $scope.dataUrls = [];
        var j;
        for (j = 0; j < $files.length; j += 1) {
            var $file = $files[j];
            if (window.FileReader && $file.type.indexOf('image') > -1) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL($files[j]);
                $scope.submitter.setPreview(fileReader, j);
            }
            $scope.submitter.progress[j] = -1;
            if ($scope.submitter.immediate) {
                $scope.start(j);
            }
        }
    };

    $scope.start = function (index) {
        $scope.submitter.progress[index] = 0;
        var fileReader = new FileReader();
        fileReader.readAsArrayBuffer($scope.selectedFiles[index]);
        fileReader.onload = function (e) {
            var fileType = $scope.selectedFiles[index].type;
            $scope.upload[index] = $upload.http({
                url: '/submit',
//                headers: {'Content-Type': fileType},
                data: e.target.result
            }).then(function (response) {
                    $scope.uploadResult.push(response.data.result);
                    $scope.submitter.response = response.data;
                    console.log(response.data);
                }, null, function (evt) {
                    // Math.min is to fix IE which reports 200% sometimes
                    $scope.submitter.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total, 10));
                });
        };
    };
});