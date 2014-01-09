/*
 The MIT License (MIT)

 Copyright (c) 2013 Ruben Kleiman

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

// Signin controls username and password model
horaceApp.controller('SigninCtrl', function ($scope, $http, $location) {

    $scope.signin = {
        menubars: {standard: 'views/menubarOffline.html'}
    };
    $scope.signin.menubar = $scope.signin.menubars.standard;


    $scope.login = function () {
        var user = $scope.signin.user;
        $http.post('/login', user)
            .success(function (res) {
                if (res.ok) {
                    $location.path('home');
//                    $window.location.href = 'home.html';
                } else {
                    $scope.signin.user.name = '';
                    $scope.signin.user.password = '';
                    $scope.signin.msg = 'No such user: Try again';
                    $scope.signin.error = true;
//                    $scope.signinForm.$valid = false;
                }
            })
            .error(function (res) {
                $scope.signin.msg = 'Technical Problem: Please retry';
                $scope.signin.error = true;
            });
    };
});
/* End SigninCtrl */