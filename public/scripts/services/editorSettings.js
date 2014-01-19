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

horaceApp.service('EditorSettings', ['$compile', function ($compile) {

    // TODO generalize hiliting styles

    var settings = {

        nodes: {
            poem: 'D_P',  /* A poem */
            verse: 'D_V', /* A verse (e.g., in a poem) */
            line: 'D_L', /* A line (e.g., in a verse) */
            lineNumbering: 'D_N', /* Block containing line numbers for a poem or prose */
            lineNumber: 'D_NL', /* A line number itself within a line number block */
            yHilite: 'D_HY',  /* Yellow hilite class */
            rHilite: 'D_HR', /* Light red hilite class */
            note: 'A_NOTE' /* Links in popup notes */
        },

        styles: {
            D_P: "D_P {display:block}",
            D_V: "D_V {display:block}",
            D_L: "D_L {display:block}",
            D_N: "D_N {display:block;float:right;width:10em;text-align:left}",
            D_NL: "D_NL {display:block}",
            D_HY: ".D_HY {background-color: #ffff00}",
            D_HR: ".D_HR {background-color: #ff767b}",
            A_NOTE: "A.note {color:#3648FF;font-weight:bold}"
        }
    };
    return settings;
}
]);
