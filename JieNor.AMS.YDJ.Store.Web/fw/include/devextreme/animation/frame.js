/** 
 * DevExtreme (animation/frame.js)
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
        FRAME_ANIMATION_STEP_TIME = 1e3 / 60,
        request = function(callback) {
            return this.setTimeout(callback, FRAME_ANIMATION_STEP_TIME)
        },
        cancel = function(requestID) {
            this.clearTimeout(requestID)
        },
        nativeRequest = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame,
        nativeCancel = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame;
    if (nativeRequest && nativeCancel) {
        request = nativeRequest;
        cancel = nativeCancel
    }
    if (nativeRequest && !nativeCancel) {
        var canceledRequests = {};
        request = function(callback) {
            var requestId = nativeRequest.call(window, function() {
                try {
                    if (requestId in canceledRequests) {
                        return
                    }
                    callback.apply(this, arguments)
                } finally {
                    delete canceledRequests[requestId]
                }
            });
            return requestId
        };
        cancel = function(requestId) {
            canceledRequests[requestId] = true
        }
    }
    exports.requestAnimationFrame = $.proxy(request, window);
    exports.cancelAnimationFrame = $.proxy(cancel, window)
});
