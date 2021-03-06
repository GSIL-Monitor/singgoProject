/** 
 * DevExtreme (core/component_registrator.js)
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
        errors = require("./errors"),
        MemorizedCallbacks = require("./memorized_callbacks");
    var callbacks = new MemorizedCallbacks;
    var registerComponent = function(name, namespace, componentClass) {
        if (!componentClass) {
            componentClass = namespace
        } else {
            namespace[name] = componentClass
        }
        componentClass.publicName(name);
        callbacks.fire(name, componentClass)
    };
    registerComponent.callbacks = callbacks;
    var registerJQueryComponent = function(name, componentClass) {
        $.fn[name] = function(options) {
            var result, isMemberInvoke = "string" === typeof options;
            if (isMemberInvoke) {
                var memberName = options,
                    memberArgs = $.makeArray(arguments).slice(1);
                this.each(function() {
                    var instance = componentClass.getInstance(this);
                    if (!instance) {
                        throw errors.Error("E0009", name)
                    }
                    var member = instance[memberName],
                        memberValue = member.apply(instance, memberArgs);
                    if (void 0 === result) {
                        result = memberValue
                    }
                })
            } else {
                this.each(function() {
                    var instance = componentClass.getInstance(this);
                    if (instance) {
                        instance.option(options)
                    } else {
                        new componentClass(this, options)
                    }
                });
                result = this
            }
            return result
        }
    };
    callbacks.add(registerJQueryComponent);
    module.exports = registerComponent
});
