/** 
 * DevExtreme (core/utils/array.js)
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
        objectUtils = require("./object");
    var isEmpty = function(entity) {
        return $.isArray(entity) && !entity.length
    };
    var wrapToArray = function(entity) {
        return $.isArray(entity) ? entity : [entity]
    };
    var intersection = function(a, b) {
        if (!$.isArray(a) || 0 === a.length || !$.isArray(b) || 0 === b.length) {
            return []
        }
        var result = [];
        $.each(a, function(_, value) {
            var index = $.inArray(value, b);
            if (index !== -1) {
                result.push(value)
            }
        });
        return result
    };
    var removeDuplicates = function(from, what) {
        if (!$.isArray(from) || 0 === from.length) {
            return []
        }
        if (!$.isArray(what) || 0 === what.length) {
            return from.slice()
        }
        var result = [];
        $.each(from, function(_, value) {
            var index = $.inArray(value, what);
            if (index === -1) {
                result.push(value)
            }
        });
        return result
    };
    var normalizeIndexes = function(items, indexParameterName, currentItem, needIndexCallback) {
        var indexedItems = {},
            parameterIndex = 0;
        $.each(items, function(index, item) {
            index = item[indexParameterName];
            if (commonUtils.isDefined(index)) {
                indexedItems[index] = indexedItems[index] || [];
                if (item === currentItem) {
                    indexedItems[index].unshift(item)
                } else {
                    indexedItems[index].push(item)
                }
                delete item[indexParameterName]
            }
        });
        objectUtils.orderEach(indexedItems, function(index, items) {
            $.each(items, function() {
                if (index >= 0) {
                    this[indexParameterName] = parameterIndex++
                }
            })
        });
        $.each(items, function() {
            if (!commonUtils.isDefined(this[indexParameterName]) && (!needIndexCallback || needIndexCallback(this))) {
                this[indexParameterName] = parameterIndex++
            }
        });
        return parameterIndex
    };
    exports.isEmpty = isEmpty;
    exports.wrapToArray = wrapToArray;
    exports.intersection = intersection;
    exports.removeDuplicates = removeDuplicates;
    exports.normalizeIndexes = normalizeIndexes
});
