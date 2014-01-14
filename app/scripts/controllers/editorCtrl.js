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

var dbg = false;
function l(msg) {
    if (dbg) {
        console.log(msg);
    }
}
function pprint(obj) {
    var hash = {};
    var r = JSON.stringify(obj, function (key, value) {
        if (key && key.length > 0 && typeof value === 'object') {
            var count = hash[value];
            if (count && count === 1) {
                return '[Circularity]';
            }
            hash[value] = 1;
        }
        return value;
    }, '\t');
    console.log(r);
}

/**
 * Class d_SelectorNodeFilter is a NodeFilter that filters out
 * a node if it is not a text node, or a D_SS or D_SE element.
 */
function d_SelectorNodeFilter(node) {
    if (node.nodeType === Node.TEXT_NODE || node.nodeName === 'D_SS' || node.nodeName === 'D_SE') {
        return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
}

// Signin controls username and password model
horaceApp.controller('EditorCtrl', function ($scope, $compile, $http, $location) {

    /* Execute after document loads */
    $scope.$on('$viewContentLoaded', function () {
        $scope.editor.setContent(work);
        var settings = $scope.editor.settings;
        $scope.editor.activateSettings($scope.editor.settings);
    });

    $scope.editor = {

        setContent: function (work) {
            var type = work.type;
            var layout = $scope.editor.engine.workTypeLayouts[type];
            if (layout) {
                layout(work);
            } else {
                throw 'Error: invalid work type "' + type + '"';
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
                    throw 'Error: default styles (id d_styles) missing';
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
                l('Style settings: ' + html);
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
                        viewMeth(testAnnotation);
                    } else {
                        throw 'Error: no view method named "' + viewMethName + '"';
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
        },

        /* The default user preferences TODO should this be separated from editor object? */
        defaultPrefs: {
            lang: { /* Language preferences */
                read: ['en', 'fr'], /* Preferably, user reads English, then French */
                write: ['en']       /* By default, user writes in English */
            }
        },

        /* The default settings */
        defaultSettings: {
            styles: {
                D_P: "D_P {display:block}", /* A poem */
                D_V: "D_V {display:block}", /* A verse (e.g., in a poem) */
                D_L: "D_L {display:block}", /* A line (e.g., in a verse) */
                D_N: "D_N {display:block;float:right;margin-left: 2em}", /* Line numbers */
                D_HY: ".D_HY {background-color: #ffff00}", /* Yellow hilite class */
                D_HR: ".D_HR {background-color: #ff767b}", /* Light red hilite class */
                A_NOTE: "A.note {color:#3648FF;font-weight:bold}" /* Links in popup notes */
            },
            engine: {
                selectionStartNodeName: 'D_SS', /* Used to mark the beginning of a selection */
                selectionEndNodeName: 'D_SE', /* Used to mark the end of a selection */
                selectionSpanNodeName: 'D_S', /* A span used to style a part of a selection */
                selectorXPaths: ['//D_SS', '//D_SE'], /* Used to search for selectors */
                viewMethods: {

                    // Highlights text for annotation
                    selection: function (anno) {
                        function processSelection(selection, sid) {
                            var claz = selection.css['class'];
                            var style = selection.css.style;
                            if (!claz && !style) {
                                throw 'Annotation missing one of class or style';
                            }
                            var sels = $scope.editor.engine.getSelectorById(anno, sid);
                            if (sels) {
                                $scope.editor.engine.doProcessSelection(anno, selection, sels[0], sels[1], claz, style);
                            }
                        }

                        var hiIndex;
                        var sidIndex;
                        var selCount = anno.views.selection.length;
                        for (hiIndex = 0; hiIndex < selCount; hiIndex += 1) {
                            var selection = anno.views.selection[hiIndex];
                            var sidCount = selection.sids.length;
                            for (sidIndex = 0; sidIndex < sidCount; sidIndex += 1) {
                                var sid = selection.sids[sidIndex];
                                processSelection(selection, sid);
                            }
                        }
                    }
                },
                workTypeLayouts: {

                    /* A poem */
                    poem: function (work) {
                        var div = $('#content')[0];
                        div.innerHTML = work.content;
                        var lineCount = $('D_L', div).length;

                        div.innerHTML = $scope.editor.engine.makeLineNumbersHtml(lineCount, 5) + work.content;
                    }
                },

                /* EDITOR METHODS TODO: move most of these to a service? */

                /**
                 * Creates the HTML for the line numbers next to a verse.
                 * @param lineCount The number of lines in the verse.
                 * @param every The line numbers are rendered every interval specified by this number (default: 1).
                 * @param start The starting line number (default: 1)
                 * @returns {string}
                 */
                makeLineNumbersHtml: function (lineCount, every, start) {
                    var html = '<div style="float:left;margin-right:5em;">';
                    every = every ? every : 1;
                    start = start ? start : 1;
                    lineCount += start - 1;
                    var number;
                    for (number = (start ? start : 1); number <= lineCount; number += 1) {
                        html += '<div>' + ((number % every) ? '&nbsp' : number) + '</div>';
                    }
                    html += '</div>';
                    return html;
                },

                /**
                 *
                 * @param anno  An annotation object
                 * @param sid The annotation selector id
                 * @returns Returns an array whose elements are, in order, the start and corresponding end selector.
                 *          Returns null if the selector pair were not found.
                 */
                getSelectorById: function (anno, sid) { // TODO could cache
                    var evaluator = new XPathEvaluator();
                    var selector = [];
                    var index;
                    var count = $scope.editor.engine.selectorXPaths.length;
                    for (index = 0; index < count; index += 1) {
                        var i = $scope.editor.engine.selectorXPaths[index];
                        i = i + "[@sid='" + sid + "']";
                        var iter = evaluator.evaluate(i, document.documentElement, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                        var s = iter.iterateNext();
                        while (s) {
                            selector.push(s);
                            s = iter.iterateNext();
                        }
                    }
                    if (selector.length === 2) {
                        return selector;
                    }
                    return null;
                },

                /*
                 Navigates the DOM starting at the specified d_se element
                 until it finds the corresponding d_se element. All text
                 in between the two elements is is surrounded by span elements,
                 as necessary, with the specified class and/or style.
                 @param anno The annotation
                 @param selection The selection
                 @param startSel The d_ss element starting the selection
                 @param endSel The d_se element ending the selection
                 @param claz An optional CSS class to apply to the span element surrounding the
                 text enclosed by the selection. May be null.
                 @param style An optional style to apply to the span element. May be null.
                 */
                doProcessSelection: function (anno, selection, startSel, endSel, claz, style) {
                    var context = anno.context;
                    var root = document.getElementsByTagName(context.parent);
                    if (!root) {
                        throw 'Error: invalid context "' + context.parent + '"';
                    }
                    root = root[0];
                    var sid = startSel.attributes.sid.nodeValue;
                    l('startSel=' + startSel + ' root=' + root + 'sid=' + sid);
                    var nodeFilter = null; // TODO one that ignores anything besides text, D_SS, D_SE nodes
                    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ALL, d_SelectorNodeFilter, false);
                    $scope.editor.engine.processSelectionSid(tw, anno, selection, startSel, endSel, sid, claz, style);
                },

                /*
                 Walks the tree of the annotation's context and processes a single sid in a selection.
                 @param anno The annotation
                 @param selection The selection
                 @param startSel The d_ss element starting the selection's sid fragment
                 @param endSel The d_se element ending the selection's sid fragment
                 @param sid The sid of the [start and end] selection elements.
                 @param claz Optional CSS class to employ
                 @param style Optional CSS style to employ
                 */
                processSelectionSid: function (tw, anno, selection, startSel, endSel, sid, claz, style) {
                    var doit = false;
                    var curr = tw.nextNode();
                    while (curr) {
                        if (curr.nodeName === $scope.editor.engine.selectionStartNodeName && curr.attributes.sid.nodeValue === sid) {
                            doit = true; // we entered the selection range
                        } else if (curr.nodeName === $scope.editor.engine.selectionEndNodeName && curr.attributes.sid.nodeValue === sid) {
                            //doit = false;
//                    l(curr.nodeName + ':' + sid);
                            return; // leaving the selection range
                        }
                        if (doit) {
//                    l(curr.nodeName + ':' + sid);
                            if (curr.nodeType === Node.TEXT_NODE) {
                                $scope.editor.engine.writeSelectionDom(curr, selection, claz, style);
                            }
                        }
                        curr = tw.nextNode();
                    }
                    if (selection.note) { // Is there a note attached to this sid

                    }
                },

                /**
                 * Applies the CSS hilite style to the node (typically a text node)
                 *
                 * @param node  The text node (TODO handle img etc...).
                 * @param selection The selection
                 * @param claz Optional class to apply
                 * @param style Optional local style to apply
                 */
                writeSelectionDom: function (node, selection, claz, style) {
                    var hilite = document.createElement($scope.editor.engine.selectionSpanNodeName);
                    if (claz) {
                        hilite.setAttribute('class', claz);
                    }
                    if (style) {
                        hilite.setAttribute('style', style);
                    }
                    var textParent = node.parentElement;
                    var tooltip;
                    if (selection.note) { // Add a tooltip for the note
                        tooltip = document.createElement('D_T');
                        tooltip.setAttribute('tooltip-html-unsafe', selection.note.text);
                        tooltip.setAttribute('tooltip-trigger', 'click');
                    }
                    textParent.replaceChild(hilite, node);
                    if (tooltip) {
                        hilite.appendChild(tooltip);
                        tooltip.appendChild(node);
                    } else {
                        hilite.appendChild(node);
                    }
                    var ajs = $compile(textParent);
                    ajs($scope);
                }
            }
        }

    };
    /* End of $scope.editor */

    // Set the editor engine to use (this could be a plugin)
    $scope.editor.engine = $scope.editor.defaultSettings.engine;

    // Set the settings
    $scope.editor.settings = $scope.editor.defaultSettings;

    // Set the user preferences
    $scope.editor.prefs = $scope.editor.defaultPrefs;

});
/* End EditorCtrl */


//            var css = document.createElement('script');
//            var head = $("head");
//            $("<style>." + claz + " { background-color: yellow;}</style>").appendTo($(head));