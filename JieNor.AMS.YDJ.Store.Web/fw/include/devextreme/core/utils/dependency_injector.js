/** 
 * DevExtreme (core/utils/dependency_injector.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    module.exports = function(object) {
        var $ = require("jquery"),
            Class = require("../class");
        var BaseClass = Class.inherit(object),
            InjectedClass = BaseClass,
            instance = new InjectedClass(object),
            initialFields = {};
        var injectFields = function(injectionObject, initial) {
            $.each(injectionObject, function(key) {
                if ($.isFunction(instance[key])) {
                    if (initial || !object[key]) {
                        object[key] = function() {
                            return instance[key].apply(object, arguments)
                        }
                    }
                } else {
                    if (initial) {
                        initialFields[key] = object[key]
                    }
                    object[key] = instance[key]
                }
            })
        };
        injectFields(object, true);
        object.inject = function(injectionObject) {
            InjectedClass = InjectedClass.inherit(injectionObject);
            instance = new InjectedClass;
            injectFields(injectionObject)
        };
        object.resetInjection = function() {
            $.extend(object, initialFields);
            InjectedClass = BaseClass;
            instance = new BaseClass
        };
        return object
    }
});
