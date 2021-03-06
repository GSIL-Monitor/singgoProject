/** 
 * DevExtreme (core/utils/locker.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var errors = require("../errors");
    var Locker = function() {
        var info = {};
        var currentCount = function(lockName) {
            return info[lockName] || 0
        };
        return {
            obtain: function(lockName) {
                info[lockName] = currentCount(lockName) + 1
            },
            release: function(lockName) {
                var count = currentCount(lockName);
                if (count < 1) {
                    throw errors.Error("E0014")
                }
                if (1 === count) {
                    delete info[lockName]
                } else {
                    info[lockName] = count - 1
                }
            },
            locked: function(lockName) {
                return currentCount(lockName) > 0
            }
        }
    };
    module.exports = Locker
});
