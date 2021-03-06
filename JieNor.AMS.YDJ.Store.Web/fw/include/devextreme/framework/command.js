/** 
 * DevExtreme (framework/command.js)
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
        registerComponent = require("../core/component_registrator"),
        DOMComponent = require("../core/dom_component");
    require("../integration/knockout");
    var Command = DOMComponent.inherit({
        ctor: function(element, options) {
            if ($.isPlainObject(element)) {
                options = element;
                element = $("<div />")
            }
            this.callBase(element, options)
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                iconSrc: {
                    since: "15.1",
                    alias: "icon"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                onExecute: null,
                id: null,
                title: "",
                icon: "",
                visible: true,
                disabled: false,
                renderStage: "onViewShown"
            })
        },
        execute: function() {
            var isDisabled = this._options.disabled;
            if ($.isFunction(isDisabled)) {
                isDisabled = !!isDisabled.apply(this, arguments)
            }
            if (isDisabled) {
                throw errors.Error("E3004", this._options.id)
            }
            this.fireEvent("beforeExecute", arguments);
            this._createActionByOption("onExecute").apply(this, arguments);
            this.fireEvent("afterExecute", arguments)
        },
        _render: function() {
            this.callBase();
            this.element().addClass("dx-command")
        },
        _renderDisabledState: $.noop,
        _dispose: function() {
            this.callBase();
            this.element().removeData(this.NAME)
        }
    });
    registerComponent("dxCommand", Command);
    module.exports = Command
});
