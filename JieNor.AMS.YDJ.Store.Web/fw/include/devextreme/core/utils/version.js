/** 
 * DevExtreme (core/utils/version.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var compare = function(x, y, maxLevel) {
        function normalizeArg(value) {
            if ("string" === typeof value) {
                return value.split(".")
            }
            if ("number" === typeof value) {
                return [value]
            }
            return value
        }
        x = normalizeArg(x);
        y = normalizeArg(y);
        var length = Math.max(x.length, y.length);
        if (isFinite(maxLevel)) {
            length = Math.min(length, maxLevel)
        }
        for (var i = 0; i < length; i++) {
            var xItem = parseInt(x[i] || 0, 10),
                yItem = parseInt(y[i] || 0, 10);
            if (xItem < yItem) {
                return -1
            }
            if (xItem > yItem) {
                return 1
            }
        }
        return 0
    };
    exports.compare = compare
});
