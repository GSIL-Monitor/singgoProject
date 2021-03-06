/** 
 * DevExtreme (ui/validation/default_adapter.js)
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
        Class = require("../../core/class");
    var DefaultAdapter = Class.inherit({
        ctor: function(editor, validator) {
            var that = this;
            that.editor = editor;
            that.validator = validator;
            that.validationRequestsCallbacks = $.Callbacks();
            var handler = function(params) {
                that.validationRequestsCallbacks.fire()
            };
            editor.validationRequest.add(handler);
            editor.on("disposing", function() {
                editor.validationRequest.remove(handler)
            })
        },
        getValue: function() {
            return this.editor.option("value")
        },
        getCurrentValidationError: function() {
            return this.editor.option("validationError")
        },
        bypass: function() {
            return this.editor.option("disabled")
        },
        applyValidationResults: function(params) {
            this.editor.option({
                isValid: params.isValid,
                validationError: params.brokenRule
            })
        },
        reset: function() {
            this.editor.reset()
        },
        focus: function() {
            this.editor.focus()
        }
    });
    module.exports = DefaultAdapter
});
