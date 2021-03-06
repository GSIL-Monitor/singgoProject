/** 
 * DevExtreme (core/memorized_callbacks.js)
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
    var MemorizedCallbacks = function() {
        var memory = [];
        var callbacks = $.Callbacks();
        this.add = function(fn) {
            $.each(memory, function(_, item) {
                fn.apply(fn, item)
            });
            callbacks.add(fn)
        };
        this.remove = function(fn) {
            callbacks.remove(fn)
        };
        this.fire = function() {
            memory.push(arguments);
            callbacks.fire.apply(callbacks, arguments)
        }
    };
    module.exports = MemorizedCallbacks
});
