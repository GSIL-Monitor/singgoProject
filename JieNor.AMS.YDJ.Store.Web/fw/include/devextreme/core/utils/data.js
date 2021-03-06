/** 
 * DevExtreme (core/utils/data.js)
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
        errors = require("../errors"),
        Class = require("../class"),
        objectUtils = require("./object"),
        variableWrapper = require("./variable_wrapper"),
        unwrapVariable = variableWrapper.unwrap,
        isWrapped = variableWrapper.isWrapped,
        assign = variableWrapper.assign;
    var bracketsToDots = function(expr) {
        return expr.replace(/\[/g, ".").replace(/\]/g, "")
    };
    var readPropValue = function(obj, propName) {
        if ("this" === propName) {
            return obj
        }
        return obj[propName]
    };
    var assignPropValue = function(obj, propName, value, options) {
        if ("this" === propName) {
            throw new errors.Error("E4016")
        }
        var propValue = obj[propName];
        if (options.unwrapObservables && isWrapped(propValue)) {
            assign(propValue, value)
        } else {
            obj[propName] = value
        }
    };
    var prepareOptions = function(options) {
        options = options || {};
        options.unwrapObservables = void 0 !== options.unwrapObservables ? options.unwrapObservables : true;
        return options
    };
    var unwrap = function(value, options) {
        return options.unwrapObservables ? unwrapVariable(value) : value
    };
    var compileGetter = function(expr) {
        if (arguments.length > 1) {
            expr = $.makeArray(arguments)
        }
        if (!expr || "this" === expr) {
            return function(obj) {
                return obj
            }
        }
        if ("string" === typeof expr) {
            expr = bracketsToDots(expr);
            var path = expr.split(".");
            return function(obj, options) {
                options = prepareOptions(options);
                var functionAsIs = options.functionsAsIs,
                    current = unwrap(obj, options);
                for (var i = 0; i < path.length; i++) {
                    if (!current) {
                        break
                    }
                    var next = unwrap(current[path[i]], options);
                    if (!functionAsIs && $.isFunction(next)) {
                        next = next.call(current)
                    }
                    current = next
                }
                return current
            }
        }
        if ($.isArray(expr)) {
            return combineGetters(expr)
        }
        if ($.isFunction(expr)) {
            return expr
        }
    };
    var combineGetters = function(getters) {
        var compiledGetters = {};
        for (var i = 0, l = getters.length; i < l; i++) {
            var getter = getters[i];
            compiledGetters[getter] = compileGetter(getter)
        }
        return function(obj, options) {
            var result;
            $.each(compiledGetters, function(name) {
                var current, path, last, i, value = this(obj, options);
                if (void 0 === value) {
                    return
                }
                current = result || (result = {});
                path = name.split(".");
                last = path.length - 1;
                for (i = 0; i < last; i++) {
                    current = current[path[i]] = {}
                }
                current[path[i]] = value
            });
            return result
        }
    };
    var compileSetter = function(expr) {
        expr = expr || "this";
        expr = bracketsToDots(expr);
        var pos = expr.lastIndexOf("."),
            targetGetter = compileGetter(expr.substr(0, pos)),
            targetPropName = expr.substr(1 + pos);
        return function(obj, value, options) {
            options = prepareOptions(options);
            var target = targetGetter(obj, {
                    functionsAsIs: options.functionsAsIs,
                    unwrapObservables: options.unwrapObservables
                }),
                prevTargetValue = readPropValue(target, targetPropName);
            if (!options.functionsAsIs && $.isFunction(prevTargetValue) && !isWrapped(prevTargetValue)) {
                target[targetPropName](value)
            } else {
                prevTargetValue = unwrap(prevTargetValue, options);
                if (options.merge && $.isPlainObject(value) && (void 0 === prevTargetValue || $.isPlainObject(prevTargetValue)) && !(value instanceof $.Event)) {
                    if (!prevTargetValue) {
                        assignPropValue(target, targetPropName, {}, options)
                    }
                    objectUtils.deepExtendArraySafe(unwrap(readPropValue(target, targetPropName), options), value)
                } else {
                    assignPropValue(target, targetPropName, value, options)
                }
            }
        }
    };
    var toComparable = function(value, caseSensitive) {
        if (value instanceof Date) {
            return value.getTime()
        }
        if (value && value instanceof Class && value.valueOf) {
            return value.valueOf()
        }
        if (!caseSensitive && "string" === typeof value) {
            return value.toLowerCase()
        }
        return value
    };
    exports.compileGetter = compileGetter;
    exports.compileSetter = compileSetter;
    exports.toComparable = toComparable
});
