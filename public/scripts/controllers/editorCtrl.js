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


var testAnnotation = {
    name: 'Multi-hilite',
    views: {
        selection: [
            {
                note: {lang: 'en', text: 'Note the repetition: male/malae. <i>bellus</i> is a colloquial form of <i>bonus</i>. Catullus, like the <i>novi poetae</i>, is unafraid of diminutives and vernacular language. ' +
                    '<br/>See: <a class="note" href="http://www.perseus.tufts.edu/hopper/morph?l=bellus&la=la" target="_blank">Perseus Latin Word Study Tool</a>'},
                sids: [1, 2], // selector ids
                method: 'sid', /* Find the text to hilite using the given sids */
                css: {'class': 'D_HY'}
            },
            {
                note: {lang: 'en', text: 'Note the repetition: bella/bellum. <i>bellus</i> is a colloquial form of <i>bonus</i>. Catullus, like the <i>novi poetae</i>, is unafraid of diminutives and vernacular language. ' +
                    '<br/>See: <a class="note" href="http://www.perseus.tufts.edu/hopper/morph?l=bellus&la=la" target="_blank">Perseus Latin Word Study Tool</a>'},
                sids: [3, 4], // selector ids
                method: 'sid', /* Find the text to hilite using the given sids */
                css: {'class': 'D_HR'}
            }
        ]
    }, /* end views */
    actions: {
        hover: {
            text: ''
        }
    }, /* end actions */
    context: {
        parent: 'body'
    } /* end context */
};

var work =
{ content:
    "<D_P>" +
        "        <D_V>" +
        "        <D_L>Lugete, o Veneres Cupidinesque</D_L>" +
        "        <D_L>et quantum est hominum venustiorum!</D_L>" +
        "        <D_L>passer mortuus est meae puellae,</D_L>" +
        "        <D_L>passer, deliciae meae puellae,</D_L>" +
        "        <D_L>quem plus illa oculis suis amabat;</D_L>" +
        "        <D_L>nam mellitus erat, suamque norat</D_L>" +
        "        <D_L>ipsa tam bene quam puella matrem,</D_L>" +
        "        <D_L>nec sese a gremio illius movebat,</D_L>" +
        "        <D_L>sed circumsiliens modo huc modo illuc</D_L>" +
        "        <D_L>ad solam dominam usque pipiabat.</D_L>" +
        "        <D_L>qui nunc it per iter tenebricosum</D_L>" +
        "       <D_L>illuc unde negant redire quemquam.</D_L>" +
        "        <D_L>at vobis" +
        "<d_ss sid='1'/>" +
        "        male" +
        "<d_se sid='1'/>" +
        "        sit," +
        "<d_ss sid='2'/>" +
        "        malae" +
        "<d_se sid='2'/>" +
        "        tenebrae" +
        "        </D_L>" +
        "        <D_L>Orci, quae omnia" +
        "<d_ss sid='3'/>" +
        "        bella" +
        "<d_se sid='3'/>" +
        "        devoratis;" +
        "</D_L>" +
        "        <D_L>tam" +
        "<d_ss sid='4'/>" +
        "        bellum" +
        "<d_se sid='4'/>" +
        "        mihi passerem abstulistis." +
        "</D_L>" +
        "        <D_L>o factum male! o miselle passer!</D_L>" +
        "        <D_L>tua nunc opera meae puellae</D_L>" +
        "        <D_L>flendo turgiduli rubent ocelli.</D_L>" +
        "</D_V>" +
        "</D_P>",
    type: 'Poem'
};

// Signin controls username and password model
horaceApp.controller('EditorCtrl', function ($scope, EditorEngine, EditorSettings, UserPrefs) {

    /* Execute after document loads */
    $scope.$on('$viewContentLoaded', function () {
        $scope.editor.setContent(work);
        $scope.editor.activateSettings(EditorSettings);
    });

    $scope.editor = {

        setContent: function (work) {
            var type = work.type;
            var layout = $scope.editor.engine.workTypeLayouts[type];
            if (layout) {
                layout(work);
            } else {
                throw {type: 'fatal', msg: 'Invalid work layout type "' + type + '"'};
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
                    throw {type: 'fatal', msg: 'Default styles (id d_styles) missing'};
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
                        throw {type: 'fatal', msg: 'No view method named "' + viewMethName + '"'};
                    }
                }
            }
        },

        // stub function to clear all annotation views
        clearAnnotationViews: function () {
            $(EditorSettings.nodeNames.selectionSpan).each(function (i) {
                var child = $(this)[0].firstChild;
                $(this).replaceWith(child);

            });
        }
    };
    /* End of $scope.editor */

    // Set the editor engine to use
    $scope.editor.engine = EditorEngine;

    // Set the user preferences
    $scope.editor.prefs = UserPrefs;

});
/* End EditorCtrl */
