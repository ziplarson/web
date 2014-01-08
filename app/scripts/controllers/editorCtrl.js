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
horaceApp.controller('EditorCtrl', function ($scope, $http, $location) {

    $scope.editor = {
        hiliteAnnotation: {
            name: 'Multi-hilite',
            views: {
                hilite: [
                    {
                        sids: [19], // selector ids
                        method: 'sid', /* Find the text to hilite using the given sids */
                        css: {'class': 'd_hy'}
                    },
                    {
                        sids: [20, 21], // selector ids
                        method: 'sid', /* Find the text to hilite using the given sids */
                        css: {'class': 'd_hr'}
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
        }
    };
});
/* end EditorCtrl */


var annotations =
{
    tagSelectionStart: 'D_SS',
    tagSelectionEnd: 'D_SE',
    selectorsXpath: ['//D_SS', '//D_SE'],
    viewMethods: {

        // Highlights text for annotation
        hilite: function (anno) {
            anno.views.hilite.map(function (hilite) {
                hilite.sids.map(function (sid) {
                    var claz = hilite.css['class'];
                    var style = hilite.css.style;
                    if (!claz && !style) {
                        throw 'Annotation missing one of class or style';
                    }
                    var sels = d_getSelectorById(sid);
                    if (sels) {
                        d_processHilite(anno.context, sels[0], sels[1], claz, style);
                    }
                });
            });
        }
    }
};

// user preferences
var annotationPrefs =
{
};

// Application settings (e.g., CSS style definitions)
var annotationSettings =
{
};

/**
 * Class d_SelectorNodeFilter is a NodeFilter that filters out
 * a node if it is not a text node, a D_SS or D_SE element.
 */
function d_SelectorNodeFilter(node) {
    if (node.nodeType === Node.TEXT_NODE || node.nodeName === 'D_SS' || node.nodeName === 'D_SE') {
        return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
}

// @return Returns an array whose elements are, in order, the start and corresponding end selector.
//         Returns null if the selector pair were not found.
function d_getSelectorById(id) {
    var evaluator = new XPathEvaluator();
    var selector = [];

    annotations.selectorsXpath.map(function (i) {
        i = i + "[@sid='" + id + "']";
        var iter = evaluator.evaluate(i, document.documentElement, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var s = iter.iterateNext();
        while (s) {
            selector.push(s);
            s = iter.iterateNext();
        }
    });

    if (selector.length === 2) {
        return selector;
    }
    return null;
}

/*
 FUNCTION: Navigates the DOM starting at the specified d_se element
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
function d_processHilite(context, startSel, endSel, claz, style) {
    var root = document.getElementsByTagName(context.parent);
    if (!root) {
        throw 'Error: invalid context "' + context.parent + '"';
    }
    root = root[0];
    var sid = startSel.attributes.sid.nodeValue;
//    console.log('startSel=' + startSel + ' root=' + root + 'sid=' + sid);
    var nodeFilter = null; // TODO one that ignores anything besides text, D_SS, D_SE nodes
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ALL, d_SelectorNodeFilter, false);
    d_processHilite1(tw, startSel, endSel, false, sid, claz, style);
}

/*
 Walks the tree of the annotation's context and hilights the text fragments, as specified.
 @param context The annotation's context element
 @param doit If true, we are in the selection range and text nodes
 should be processed.
 @param sid The sid of the [start and end] selection elements.
 @param claz Optional CSS class to employ
 @param style Optional CSS style to employ
 */
function d_processHilite1(tw, startSel, endSel, doit, sid, claz, style) {
    var curr = tw.nextNode();
    while (curr) {
        if (curr.nodeName === annotations.tagSelectionStart && curr.attributes.sid.nodeValue === sid) {
            doit = true; // we entered the selection range
        } else if (curr.nodeName === annotations.tagSelectionEnd && curr.attributes.sid.nodeValue === sid) {
            //doit = false;
            console.log(curr.nodeName + ':' + sid);
            return; // leaving the selection range
        }
        if (doit) {
            console.log(curr.nodeName + ':' + sid);
            if (curr.nodeType === Node.TEXT_NODE) {
                d_hiliteText(curr, claz, style);

            }
        }
        curr = tw.nextNode();
    }
}

function d_hiliteText(textNode, claz, style) {
    var hilite = document.createElement('d_h');
    if (claz) {
        hilite.setAttribute('class', claz);
    }
    if (style) {
        hilite.setAttribute('style', style);
    }
    var parent = textNode.parentElement;
    parent.replaceChild(hilite, textNode);
    hilite.appendChild(textNode);
}

function test(anno) {
    var viewType;
    for (viewType in anno.views) {
        var viewMethod = annotations.viewMethods[viewType];
        viewMethod(anno);
    }
}

function clearAll() {
    $("d_h").each(function (i) {
        var child = $(this)[0].firstChild;
        $(this).replaceWith(child);

    });
}