/** 
 * DevExtreme (ui/widget/ui.keyboard_processor.js)
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
        Class = require("../../core/class"),
        eventUtils = require("../../events/utils");
    var KeyboardProcessor = Class.inherit({
        _keydown: eventUtils.addNamespace("keydown", "KeyboardProcessor"),
        codes: {
            8: "backspace",
            9: "tab",
            13: "enter",
            27: "escape",
            33: "pageUp",
            34: "pageDown",
            35: "end",
            36: "home",
            37: "leftArrow",
            38: "upArrow",
            39: "rightArrow",
            40: "downArrow",
            46: "del",
            32: "space",
            70: "F",
            65: "A",
            106: "asterisk",
            109: "minus"
        },
        ctor: function(options) {
            var _this = this;
            options = options || {};
            if (options.element) {
                this._element = $(options.element)
            }
            if (options.focusTarget) {
                this._focusTarget = options.focusTarget
            }
            this._handler = options.handler;
            this._context = options.context;
            this._childProcessors = [];
            if (this._element) {
                this._processFunction = function(e) {
                    _this.process(e)
                };
                this._element.on(this._keydown, this._processFunction)
            }
        },
        dispose: function() {
            if (this._element) {
                this._element.off(this._keydown, this._processFunction)
            }
            this._element = void 0;
            this._handler = void 0;
            this._context = void 0;
            this._childProcessors = void 0
        },
        clearChildren: function() {
            this._childProcessors = []
        },
        push: function(child) {
            if (!this._childProcessors) {
                this.clearChildren()
            }
            this._childProcessors.push(child);
            return child
        },
        attachChildProcessor: function() {
            var childProcessor = new KeyboardProcessor;
            this._childProcessors.push(childProcessor);
            return childProcessor
        },
        reinitialize: function(childHandler, childContext) {
            this._context = childContext;
            this._handler = childHandler;
            return this
        },
        process: function(e) {
            if (this._focusTarget && this._focusTarget !== e.target && $.inArray(e.target, this._focusTarget) < 0) {
                return false
            }
            var args = {
                key: this.codes[e.which] || e.which,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
                originalEvent: e
            };
            var handlerResult = this._handler && this._handler.call(this._context, args);
            if (handlerResult && this._childProcessors) {
                $.each(this._childProcessors, function(index, childProcessor) {
                    childProcessor.process(e)
                })
            }
        }
    });
    module.exports = KeyboardProcessor
});
