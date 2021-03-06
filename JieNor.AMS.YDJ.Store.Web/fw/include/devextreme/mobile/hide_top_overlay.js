/** 
 * DevExtreme (mobile/hide_top_overlay.js)
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
    var hideCallback = function() {
        var callbacks = [];
        return {
            add: function(callback) {
                var indexOfCallback = $.inArray(callback, callbacks);
                if (indexOfCallback === -1) {
                    callbacks.push(callback)
                }
            },
            remove: function(callback) {
                var indexOfCallback = $.inArray(callback, callbacks);
                if (indexOfCallback !== -1) {
                    callbacks.splice(indexOfCallback, 1)
                }
            },
            fire: function() {
                var callback = callbacks.pop(),
                    result = !!callback;
                if (result) {
                    callback()
                }
                return result
            },
            hasCallback: function() {
                return callbacks.length > 0
            }
        }
    }();
    module.exports = function() {
        return hideCallback.fire()
    };
    module.exports.hideCallback = hideCallback
});
