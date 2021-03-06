/** 
 * DevExtreme (core/utils/object.js)
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
        commonUtils = require("./common"),
        variableWrapper = require("./variable_wrapper");
    var clone = function() {
        function Clone() {}
        return function(obj) {
            Clone.prototype = obj;
            return new Clone
        }
    }();
    var extendFromObject = function(target, source, overrideExistingValues) {
        target = target || {};
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                var value = source[prop];
                if (!(prop in target) || overrideExistingValues) {
                    target[prop] = value
                }
            }
        }
        return target
    };
    var orderEach = function(map, func) {
        var key, i, keys = [];
        for (key in map) {
            if (map.hasOwnProperty(key)) {
                keys.push(key)
            }
        }
        keys.sort(function(x, y) {
            var isNumberX = commonUtils.isNumber(x),
                isNumberY = commonUtils.isNumber(y);
            if (isNumberX && isNumberY) {
                return x - y
            }
            if (isNumberX && !isNumberY) {
                return -1
            }
            if (!isNumberX && isNumberY) {
                return 1
            }
            if (x < y) {
                return -1
            }
            if (x > y) {
                return 1
            }
            return 0
        });
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            func(key, map[key])
        }
    };
    var assignValueToProperty = function(target, property, value) {
        if (variableWrapper.isWrapped(target[property])) {
            variableWrapper.assign(target[property], value)
        } else {
            target[property] = value
        }
    };
    var deepExtendArraySafe = function(target, changes) {
        var prevValue, newValue;
        for (var name in changes) {
            prevValue = target[name];
            newValue = changes[name];
            if (target === newValue) {
                continue
            }
            if ($.isPlainObject(newValue) && !(newValue instanceof $.Event)) {
                assignValueToProperty(target, name, deepExtendArraySafe($.isPlainObject(prevValue) ? prevValue : {}, newValue))
            } else {
                if (void 0 !== newValue) {
                    assignValueToProperty(target, name, newValue)
                }
            }
        }
        return target
    };
    exports.clone = clone;
    exports.extendFromObject = extendFromObject;
    exports.orderEach = orderEach;
    exports.deepExtendArraySafe = deepExtendArraySafe
});
