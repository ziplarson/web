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


// Signin controls username and password model
horaceApp.controller('EditorCtrl', function ($scope, EditorEngine, EditorSettings, UserPrefs) {

    /* Execute after document loads */
    $scope.$on('$viewContentLoaded', function () {
        $scope.editor.setContent(work);
        $scope.editor.activateSettings($scope.editor.settings);
    });

    $scope.editor = {

        setContent: function (work) {
            var type = work.type;
            var layout = $scope.editor.engine.workTypeLayouts[type];
            if (layout) {
                layout(work);
            } else {
                throw {message: 'Error: invalid work type "' + type + '"'};
            }
        },

        /**
         * Activates settings. Removes current settings.
         * @param settings The editor's settings object.
         */
        activateSettings: function (settings) {

            function activateSettingStyles() {
                var styles = $('#d_styles');
                if (!styles || styles.length === 0) {
                    throw {message: 'Error: default styles (id d_styles) missing'};
                }
                var className;
                var style;
                var html = '';
                for (className in settings.styles) {
                    if (settings.styles.hasOwnProperty(className)) {
                        style = settings.styles[className];
                        html += style + ' ';
                    }
                }
                styles[0].innerHTML = html;
            }

            activateSettingStyles();
        },

        // stub function to do a test annotation
        test: function () {
            var viewMethName;
            for (viewMethName in testAnnotation.views) {
                if (testAnnotation.views.hasOwnProperty(viewMethName)) {
                    var viewMeth = $scope.editor.engine.viewMethods[viewMethName];
                    if (viewMeth) {
                        viewMeth($scope, testAnnotation);
                    } else {
                        throw {message: 'Error: no view method named "' + viewMethName + '"'};
                    }
                }
            }
        },

        // stub function to clear all annotation views
        clearAnnotationViews: function () {
            $($scope.editor.engine.selectionSpanNodeName).each(function (i) {
                var child = $(this)[0].firstChild;
                $(this).replaceWith(child);

            });
        }
    };
    /* End of $scope.editor */

    // Set the editor engine to use
    $scope.editor.engine = EditorEngine;

    // Set the settings to use
    $scope.editor.settings = EditorSettings;

    // Set the user preferences
    $scope.editor.prefs = UserPrefs;

});
/* End EditorCtrl */
