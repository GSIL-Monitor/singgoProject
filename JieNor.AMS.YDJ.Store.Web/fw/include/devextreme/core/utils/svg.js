/** 
 * DevExtreme (core/utils/svg.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    function getMarkup(element) {
        var temp = document.createElement("div");
        temp.appendChild(element.cloneNode(true));
        return temp.innerHTML
    }

    function fixIENamespaces(markup) {
        var first = true;
        markup = markup.replace(/xmlns="[\s\S]*?"/gi, function(match) {
            if (!first) {
                return ""
            }
            first = false;
            return match
        });
        return markup.replace(/xmlns:NS1="[\s\S]*?"/gi, "").replace(/NS1:xmlns:xlink="([\s\S]*?)"/gi, 'xmlns:xlink="$1"')
    }

    function decodeHtmlEntities(markup) {
        return markup.replace(/&quot;/gi, "&#34;").replace(/&amp;/gi, "&#38;").replace(/&apos;/gi, "&#39;").replace(/&lt;/gi, "&#60;").replace(/&gt;/gi, "&#62;").replace(/&nbsp;/gi, "&#160;").replace(/&shy;/gi, "&#173;")
    }
    exports.getSvgMarkup = function(element) {
        return fixIENamespaces(decodeHtmlEntities(getMarkup(element)))
    }
});
