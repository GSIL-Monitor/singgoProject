/** 
 * DevExtreme (ui/widget/jquery.selectors.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery");
    var focusable = function(element, tabIndex) {
        var nodeName = element.nodeName.toLowerCase(),
            isTabIndexNotNaN = !isNaN(tabIndex),
            isVisible = visible(element),
            isDisabled = element.disabled,
            isDefaultFocus = /^(input|select|textarea|button|object|iframe)$/.test(nodeName),
            isHyperlink = "a" === nodeName,
            isFocusable = true;
        if (isDefaultFocus) {
            isFocusable = !isDisabled
        } else {
            if (isHyperlink) {
                isFocusable = element.href || isTabIndexNotNaN
            } else {
                isFocusable = isTabIndexNotNaN
            }
        }
        return isVisible ? isFocusable : false
    };
    var visible = function(element) {
        var $element = $(element);
        return $element.is(":visible") && "hidden" !== $element.css("visibility") && "hidden" !== $element.parents().css("visibility")
    };
    var icontains = function(elem, text) {
        var result = false;
        $.each($(elem).contents(), function(index, content) {
            if (3 === content.nodeType && (content.textContent || content.nodeValue || "").toLowerCase().indexOf((text || "").toLowerCase()) > -1) {
                result = true;
                return false
            }
        });
        return result
    };
    $.extend($.expr[":"], {
        "dx-focusable": function(element) {
            return focusable(element, $.attr(element, "tabindex"))
        },
        "dx-tabbable": function(element) {
            var tabIndex = $.attr(element, "tabindex");
            return (isNaN(tabIndex) || tabIndex >= 0) && focusable(element, tabIndex)
        },
        "dx-icontains": $.expr.createPseudo(function(text) {
            return function(elem) {
                return icontains(elem, text)
            }
        })
    });
    module.exports = {
        focusable: ":dx-focusable",
        tabbable: ":dx-tabbable",
        icontains: ":dx-icontains"
    }
});
