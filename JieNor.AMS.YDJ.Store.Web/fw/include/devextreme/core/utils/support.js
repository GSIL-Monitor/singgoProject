/** 
 * DevExtreme (core/utils/support.js)
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
        inflector = require("./inflector"),
        devices = require("../devices");
    var camelize = inflector.camelize;
    var jsPrefixes = ["", "Webkit", "Moz", "O", "Ms"],
        cssPrefixes = {
            "": "",
            Webkit: "-webkit-",
            Moz: "-moz-",
            O: "-o-",
            ms: "-ms-"
        },
        styles = document.createElement("dx").style;
    var transitionEndEventNames = {
        webkitTransition: "webkitTransitionEnd",
        MozTransition: "transitionend",
        OTransition: "oTransitionEnd",
        msTransition: "MsTransitionEnd",
        transition: "transitionend"
    };
    var forEachPrefixes = function(prop, callBack) {
        prop = camelize(prop, true);
        var result;
        for (var i = 0, cssPrefixesCount = jsPrefixes.length; i < cssPrefixesCount; i++) {
            var jsPrefix = jsPrefixes[i];
            var prefixedProp = jsPrefix + prop;
            var lowerPrefixedProp = camelize(prefixedProp);
            result = callBack(lowerPrefixedProp, jsPrefix);
            if (void 0 === result) {
                result = callBack(prefixedProp, jsPrefix)
            }
            if (void 0 !== result) {
                break
            }
        }
        return result
    };
    var styleProp = function(prop) {
        return forEachPrefixes(prop, function(specific) {
            if (specific in styles) {
                return specific
            }
        })
    };
    var stylePropPrefix = function(prop) {
        return forEachPrefixes(prop, function(specific, jsPrefix) {
            if (specific in styles) {
                return cssPrefixes[jsPrefix]
            }
        })
    };
    var supportProp = function(prop) {
        return !!styleProp(prop)
    };
    var isNativeScrollingSupported = function() {
        var realDevice = devices.real(),
            realPlatform = realDevice.platform,
            realVersion = realDevice.version,
            isObsoleteAndroid = realVersion && realVersion[0] < 4 && "android" === realPlatform,
            isNativeScrollDevice = !isObsoleteAndroid && $.inArray(realPlatform, ["ios", "android", "win"]) > -1 || realDevice.mac;
        return isNativeScrollDevice
    };
    var inputType = function(type) {
        if ("text" === type) {
            return true
        }
        var input = document.createElement("input");
        try {
            input.setAttribute("type", type);
            input.value = "wrongValue";
            return !input.value
        } catch (e) {
            return false
        }
    };
    var touchEvents = "ontouchstart" in window && !("callPhantom" in window),
        pointerEvents = !!window.navigator.pointerEnabled || !!window.navigator.msPointerEnabled,
        touchPointersPresent = !!window.navigator.maxTouchPoints || !!window.navigator.msMaxTouchPoints;
    exports.touchEvents = touchEvents;
    exports.pointerEvents = pointerEvents;
    exports.touch = touchEvents || pointerEvents && touchPointersPresent;
    exports.transform = supportProp("transform");
    exports.transition = supportProp("transition");
    exports.transitionEndEventName = transitionEndEventNames[styleProp("transition")];
    exports.animation = supportProp("animation");
    exports.nativeScrolling = isNativeScrollingSupported();
    exports.winJS = "WinJS" in window;
    exports.styleProp = styleProp;
    exports.stylePropPrefix = stylePropPrefix;
    exports.supportProp = supportProp;
    exports.hasKo = !!window.ko;
    exports.inputType = inputType
});
