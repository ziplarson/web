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
horaceApp.controller('EditorCtrl', function ($scope, $http, $location) {

    /* Execute after document loads */
    $scope.$on('$viewContentLoaded', function () {
        $scope.editor.activateSettings($scope.editor.settings.styles);
        $("headline").innerHTML = 'Hello';
    });

    $scope.editor = {

        /**
         * Activates styles from settings. Removes current styles.
         */
        activateSettings: function (settings) {
            var styles = $('#d_styles');
            if (!styles || styles.length === 0) {
                throw 'Error: default styles (id d_styles) missing';
            }
            var html = '';
            $.each(settings, function (clazName, style) {
                html += '.' + clazName + ' {';
                $.each(style, function (name, value) {
                    html += name + ':' + value + ';';
                });
                html += '} ';
            });
            l('Style settings: ' + html);
            styles[0].innerHTML = html;
        },

        // stub function to do a test annotation
        test: function () {
            var viewMethName;
            for (viewMethName in testAnnotation.views) {
                var viewMeth = $scope.editor.engine.viewMethods[viewMethName];
                if (viewMeth) {
                    viewMeth(testAnnotation);
                } else {
                    throw 'Error: no view method named "' + viewMethName + '"';
                }
            }
        },
        // stub function to clear all annotation views
        clearAnnotationViews: function () {
            $($scope.editor.engine.tagSelectionSpan).each(function (i) {
                var child = $(this)[0].firstChild;
                $(this).replaceWith(child);

            });
        },

        /* The default settings */
        defaultSettings: {
            styles: {
                d_hy: {'background-color': '#ffff00'},
                d_hr: {'background-color': '#ff767b'}
            },
            engine: {
                tagSelectionStart: 'D_SS',
                tagSelectionEnd: 'D_SE',
                tagSelectionSpan: 'D_S',
                selectorsXpath: ['//D_SS', '//D_SE'],
                viewMethods: {
                    // Highlights text for annotation
                    hilite: function (anno) {
                        var hiIndex;

                        function makeStyle(ignore, sid) {
                            var claz = hilite.css['class'];
                            var style = hilite.css.style;
                            if (!claz && !style) {
                                throw 'Annotation missing one of class or style';
                            }
                            var sels = $scope.editor.engine.getSelectorById(anno, sid);
                            if (sels) {
                                $scope.editor.engine.processSelection(anno.context, sels[0], sels[1], claz, style);
                            }
                        }

                        for (hiIndex in anno.views.hilite) {
                            var hilite = anno.views.hilite[hiIndex];
//                        var index;
                            $.each(hilite.sids, makeStyle);
                        }
                    }
                },
                /* EDITOR METHODS TODO: move most of these to a service? */

                /**
                 *
                 * @param anno  An annotation object
                 * @param sid The annotation selector id
                 * @returns Returns an array whose elements are, in order, the start and corresponding end selector.
                 *          Returns null if the selector pair were not found.
                 */
                getSelectorById: function (anno, sid) {
                    var evaluator = new XPathEvaluator();
                    var selector = [];
                    var index;
                    for (index in $scope.editor.engine.selectorsXpath) {
                        var i = $scope.editor.engine.selectorsXpath[index];
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
                 @param context The annotation's context
                 @param startSel The d_ss element starting the selection
                 @param endSel The d_se element ending the selection
                 @param claz An optional CSS class to apply to the span element surrounding the
                 text enclosed by the selection. May be null.
                 @param style An optional style to apply to the span element. May be null.
                 */
                processSelection: function (context, startSel, endSel, claz, style) {
                    var root = document.getElementsByTagName(context.parent);
                    if (!root) {
                        throw 'Error: invalid context "' + context.parent + '"';
                    }
                    root = root[0];
                    var sid = startSel.attributes.sid.nodeValue;
                    l('startSel=' + startSel + ' root=' + root + 'sid=' + sid);
                    var nodeFilter = null; // TODO one that ignores anything besides text, D_SS, D_SE nodes
                    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ALL, d_SelectorNodeFilter, false);
                    $scope.editor.engine.hiliteSelection(tw, startSel, endSel, false, sid, claz, style);
                },

                /*
                 Walks the tree of the annotation's context and hilights the text fragments, as specified.
                 @param context The annotation's context element
                 @param doit If true, we are in the selection range and text nodes
                 should be processed.
                 @param sid The sid of the [start and end] selection elements.
                 @param claz Optional CSS class to employ
                 @param style Optional CSS style to employ
                 */
                hiliteSelection: function (tw, startSel, endSel, doit, sid, claz, style) {
                    var curr = tw.nextNode();
                    while (curr) {
                        if (curr.nodeName === $scope.editor.engine.tagSelectionStart && curr.attributes.sid.nodeValue === sid) {
                            doit = true; // we entered the selection range
                        } else if (curr.nodeName === $scope.editor.engine.tagSelectionEnd && curr.attributes.sid.nodeValue === sid) {
                            //doit = false;
//                    l(curr.nodeName + ':' + sid);
                            return; // leaving the selection range
                        }
                        if (doit) {
//                    l(curr.nodeName + ':' + sid);
                            if (curr.nodeType === Node.TEXT_NODE) {
                                $scope.editor.engine.applyHilite(curr, claz, style);

                            }
                        }
                        curr = tw.nextNode();
                    }
                },

                /**
                 * Applies the CSS hilite style to the node (typically a text node).
                 * @param node  The node.
                 * @param claz Optional class to apply
                 * @param style Optional local style to apply
                 */
                applyHilite: function (node, claz, style) {
                    var hilite = document.createElement($scope.editor.engine.tagSelectionSpan);
                    if (claz) {
                        hilite.setAttribute('class', claz);
                    }
                    if (style) {
                        hilite.setAttribute('style', style);
                    }
                    if (claz || style) {
                        var parent = node.parentElement;
                        parent.replaceChild(hilite, node);
                        hilite.appendChild(node);
                    }
                }

            }
        }

    };
    /* End of $scope.editor */

    // Set the editor engine to use (this could be a plugin)
    $scope.editor.engine = $scope.editor.defaultSettings.engine;

    // Set the style settings (these could be changed by the user)
    $scope.editor.settings = {styles: $scope.editor.defaultSettings.styles};

});
/* End EditorCtrl */


//            var css = document.createElement('script');
//            var head = $("head");
//            $("<style>." + claz + " { background-color: yellow;}</style>").appendTo($(head));