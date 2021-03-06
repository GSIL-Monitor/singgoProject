/** 
 * DevExtreme (core/utils/window.js)
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
    var resizeCallbacks = function() {
        var prevSize, callbacks = $.Callbacks(),
            jqWindow = $(window),
            resizeEventHandlerAttached = false,
            originalCallbacksAdd = callbacks.add,
            originalCallbacksRemove = callbacks.remove;
        var formatSize = function() {
            return {
                width: jqWindow.width(),
                height: jqWindow.height()
            }
        };
        var handleResize = function() {
            var now = formatSize();
            if (now.width === prevSize.width && now.height === prevSize.height) {
                return
            }
            var changedDimension;
            if (now.width === prevSize.width) {
                changedDimension = "height"
            }
            if (now.height === prevSize.height) {
                changedDimension = "width"
            }
            prevSize = now;
            setTimeout(function() {
                callbacks.fire(changedDimension)
            })
        };
        prevSize = formatSize();
        callbacks.add = function() {
            var result = originalCallbacksAdd.apply(callbacks, arguments);
            if (!resizeEventHandlerAttached && callbacks.has()) {
                jqWindow.on("resize", handleResize);
                resizeEventHandlerAttached = true
            }
            return result
        };
        callbacks.remove = function() {
            var result = originalCallbacksRemove.apply(callbacks, arguments);
            if (!callbacks.has() && resizeEventHandlerAttached) {
                jqWindow.off("resize", handleResize);
                resizeEventHandlerAttached = false
            }
            return result
        };
        return callbacks
    }();
    var defaultScreenFactorFunc = function(width) {
        if (width < 768) {
            return "xs"
        } else {
            if (width < 992) {
                return "sm"
            } else {
                if (width < 1200) {
                    return "md"
                } else {
                    return "lg"
                }
            }
        }
    };
    var getCurrentScreenFactor = function(screenFactorCallback) {
        var screenFactorFunc = screenFactorCallback || defaultScreenFactorFunc;
        return screenFactorFunc($(window).width())
    };
    exports.resizeCallbacks = resizeCallbacks;
    exports.defaultScreenFactorFunc = defaultScreenFactorFunc;
    exports.getCurrentScreenFactor = getCurrentScreenFactor
});
