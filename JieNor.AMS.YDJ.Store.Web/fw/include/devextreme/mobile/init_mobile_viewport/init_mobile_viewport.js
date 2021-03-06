/** 
 * DevExtreme (mobile/init_mobile_viewport/init_mobile_viewport.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        resizeCallbacks = require("../../core/utils/window").resizeCallbacks,
        support = require("../../core/utils/support"),
        devices = require("../../core/devices");
    var initMobileViewport = function(options) {
        options = $.extend({}, options);
        var realDevice = devices.real();
        var allowZoom = options.allowZoom;
        var allowPan = options.allowPan;
        var allowSelection = "allowSelection" in options ? options.allowSelection : "generic" === realDevice.platform;
        var metaSelector = "meta[name=viewport]";
        if (!$(metaSelector).length) {
            $("<meta />").attr("name", "viewport").appendTo("head")
        }
        var metaVerbs = ["width=device-width"],
            msTouchVerbs = [];
        if (allowZoom) {
            msTouchVerbs.push("pinch-zoom")
        } else {
            metaVerbs.push("initial-scale=1.0", "maximum-scale=1.0, user-scalable=no")
        }
        if (allowPan) {
            msTouchVerbs.push("pan-x", "pan-y")
        }
        if (!allowPan && !allowZoom) {
            $("html, body").css({
                "-ms-content-zooming": "none",
                "-ms-user-select": "none",
                overflow: "hidden"
            })
        } else {
            $("html").css("-ms-overflow-style", "-ms-autohiding-scrollbar")
        }
        if (!allowSelection && support.supportProp("user-select")) {
            $(".dx-viewport").css(support.styleProp("user-select"), "none")
        }
        $(metaSelector).attr("content", metaVerbs.join());
        $("html").css("-ms-touch-action", msTouchVerbs.join(" ") || "none");
        realDevice = devices.real();
        if (support.touch && !("win" === realDevice.platform && 10 === realDevice.version[0])) {
            $(document).off(".dxInitMobileViewport").on("dxpointermove.dxInitMobileViewport", function(e) {
                var count = e.pointers.length,
                    isTouchEvent = "touch" === e.pointerType,
                    zoomDisabled = !allowZoom && count > 1,
                    panDisabled = !allowPan && 1 === count && !e.isScrollingEvent;
                if (isTouchEvent && (zoomDisabled || panDisabled)) {
                    e.preventDefault()
                }
            })
        }
        if (realDevice.ios) {
            var isPhoneGap = "file:" === document.location.protocol;
            if (!isPhoneGap) {
                resizeCallbacks.add(function() {
                    var windowWidth = $(window).width();
                    $("body").width(windowWidth)
                })
            }
        }
        if (realDevice.android) {
            resizeCallbacks.add(function() {
                setTimeout(function() {
                    document.activeElement.scrollIntoViewIfNeeded()
                })
            })
        }
    };
    exports.initMobileViewport = initMobileViewport
});
