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

// Handles Home
horaceApp.controller('HomeCtrl', function ($scope) {
    $scope.signin = {menubar: 'views/menubarOnline.html', test: 'views/test.html'};

    $scope.tabs = [
        { title: "Tab 1", content: "Tab 1 Content" },
        { title: "Tab 2", content: "Tab 2 Content", disabled: false }
    ];

    $scope.alertMe = function() {
        setTimeout(function() {
            alert("You've selected the alert tab!");
        });
    };

//    var ctrl = this,
//        tabs = ctrl.tabs = $scope.tabs = [];
//
//    ctrl.select = function(tab) {
//        angular.forEach(tabs, function(tab) {
//            tab.active = false;
//        });
//        tab.active = true;
//    };
//
//    ctrl.addTab = function addTab(tab) {
//        tabs.push(tab);
//        if (tabs.length === 1 || tab.active) {
//            ctrl.select(tab);
//        }
//    };
//
//    ctrl.removeTab = function removeTab(tab) {
//        var index = tabs.indexOf(tab);
//        //Select a new tab if the tab to be removed is selected
//        if (tab.active && tabs.length > 1) {
//            //If this is the last tab, select the previous tab. else, the next tab.
//            var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
//            ctrl.select(tabs[newActiveIndex]);
//        }
//        tabs.splice(index, 1);
//    };

}); /* End HomeCtrl */