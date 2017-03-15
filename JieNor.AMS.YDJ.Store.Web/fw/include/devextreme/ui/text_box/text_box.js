/** 
 * DevExtreme (ui/text_box/text_box.js)
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
        devices = require("../../core/devices"),
        registerComponent = require("../../core/component_registrator"),
        TextEditor = require("./ui.text_editor"),
        eventUtils = require("../../events/utils");
    var ua = window.navigator.userAgent,
        ignoreCode = [8, 9, 13, 33, 34, 35, 36, 37, 38, 39, 40, 46],
        TEXTBOX_CLASS = "dx-textbox",
        SEARCHBOX_CLASS = "dx-searchbox",
        ICON_CLASS = "dx-icon",
        SEARCH_ICON_CLASS = "dx-icon-search";
    var TextBox = TextEditor.inherit({
        ctor: function(element, options) {
            if (options) {
                this._showClearButton = options.showClearButton
            }
            this.callBase.apply(this, arguments)
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                mode: "text",
                maxLength: null
            })
        },
        _render: function() {
            this.callBase();
            this.element().addClass(TEXTBOX_CLASS);
            this.setAria("role", "textbox");
            this._renderMaxLengthHandlers()
        },
        _renderInputType: function() {
            this.callBase();
            this._renderSearchMode()
        },
        _renderMaxLengthHandlers: function() {
            if (this._isAndroid()) {
                this._input().on(eventUtils.addNamespace("keydown", this.NAME), $.proxy(this._onKeyDownAndroidHandler, this)).on(eventUtils.addNamespace("change", this.NAME), $.proxy(this._onChangeAndroidHandler, this))
            }
        },
        _renderProps: function() {
            this.callBase();
            this._toggleMaxLengthProp()
        },
        _toggleMaxLengthProp: function() {
            if (this._isAndroid()) {
                return
            }
            var maxLength = this.option("maxLength");
            if (maxLength > 0) {
                this._input().attr("maxLength", maxLength)
            } else {
                this._input().removeAttr("maxLength")
            }
        },
        _renderSearchMode: function() {
            var $element = this._$element;
            if ("search" === this.option("mode")) {
                $element.addClass(SEARCHBOX_CLASS);
                this._renderSearchIcon();
                if (void 0 === this._showClearButton) {
                    this._showClearButton = this.option("showClearButton");
                    this.option("showClearButton", true)
                }
            } else {
                $element.removeClass(SEARCHBOX_CLASS);
                this._$searchIcon && this._$searchIcon.remove();
                this.option("showClearButton", void 0 === this._showClearButton ? this.option("showClearButton") : this._showClearButton);
                delete this._showClearButton
            }
        },
        _renderSearchIcon: function() {
            var $searchIcon = $("<div>").addClass(ICON_CLASS).addClass(SEARCH_ICON_CLASS);
            $searchIcon.prependTo(this._input().parent());
            this._$searchIcon = $searchIcon
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "maxLength":
                    this._toggleMaxLengthProp();
                    this._renderMaxLengthHandlers();
                    break;
                default:
                    this.callBase(args)
            }
        },
        _onKeyDownAndroidHandler: function(e) {
            var maxLength = this.option("maxLength");
            if (maxLength) {
                var $input = $(e.target),
                    code = e.keyCode;
                this._cutOffExtraChar($input);
                return $input.val().length < maxLength || $.inArray(code, ignoreCode) !== -1 || "" !== window.getSelection().toString()
            } else {
                return true
            }
        },
        _onChangeAndroidHandler: function(e) {
            var $input = $(e.target);
            if (this.option("maxLength")) {
                this._cutOffExtraChar($input)
            }
        },
        _cutOffExtraChar: function($input) {
            var maxLength = this.option("maxLength"),
                textInput = $input.val();
            if (textInput.length > maxLength) {
                $input.val(textInput.substr(0, maxLength))
            }
        },
        _isAndroid: function() {
            var realDevice = devices.real();
            var version = realDevice.version.join(".");
            return "android" === realDevice.platform && version && /^(2\.|4\.1)/.test(version) && !/chrome/i.test(ua)
        }
    });
    registerComponent("dxTextBox", TextBox);
    module.exports = TextBox
});
