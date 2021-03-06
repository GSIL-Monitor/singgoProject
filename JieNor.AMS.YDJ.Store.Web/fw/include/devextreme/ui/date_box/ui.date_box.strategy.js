/** 
 * DevExtreme (ui/date_box/ui.date_box.strategy.js)
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
        dateLocalization = require("../../localization/date");
    var abstract = Class.abstract;
    var DateBoxStrategy = Class.inherit({
        ctor: function(dateBox) {
            this.dateBox = dateBox
        },
        widgetOption: function() {
            return this._widget && this._widget.option.apply(this._widget, arguments)
        },
        _renderWidget: function(element) {
            element = element || $("<div>");
            this._widget = this._createWidget(element);
            this._widget.element().appendTo(this._getWidgetContainer())
        },
        _createWidget: function(element) {
            var widgetName = this._getWidgetName();
            var widgetOptions = this._getWidgetOptions();
            return this.dateBox._createComponent(element, widgetName, widgetOptions)
        },
        _getWidgetOptions: abstract,
        _getWidgetName: abstract,
        getDefaultOptions: function() {
            return {
                mode: "text"
            }
        },
        getDisplayFormat: abstract,
        supportedKeys: $.noop,
        attachKeyboardEvents: function(keyboardProcessor) {
            this._widgetKeyboardProcessor = keyboardProcessor.attachChildProcessor()
        },
        getParsedText: function(text, format) {
            return dateLocalization.parse(text, format)
        },
        renderInputMinMax: $.noop,
        renderOpenedState: function() {
            if (this.dateBox.option("opened")) {
                this._updateValue()
            }
        },
        popupConfig: abstract,
        renderPopupContent: function() {
            var popup = this._getPopup();
            this._renderWidget();
            popup.content().parent().off("mousedown").on("mousedown", $.proxy(this._preventFocusOnPopup, this))
        },
        getFirstPopupElement: $.noop,
        getLastPopupElement: $.noop,
        _preventFocusOnPopup: function(e) {
            e.preventDefault()
        },
        _getWidgetContainer: function() {
            return this._getPopup().content()
        },
        _getPopup: function() {
            return this.dateBox._popup
        },
        popupShowingHandler: $.noop,
        popupHiddenHandler: $.noop,
        _updateValue: function() {
            this._widget && this._widget.option("value", this.dateBoxValue())
        },
        _valueChangedHandler: function(args) {
            if (this.dateBox.option("opened") && "instantly" === this.dateBox.option("applyValueMode")) {
                this.dateBoxValue(args.value)
            }
        },
        textChangedHandler: $.noop,
        renderValue: function() {
            if (this.dateBox.option("opened")) {
                this._updateValue()
            }
        },
        getValue: function() {
            return this._widget.option("value")
        },
        isAdaptivityChanged: function() {
            return false
        },
        dispose: function() {
            var popup = this._getPopup();
            if (popup) {
                popup.content().empty()
            }
        },
        dateBoxValue: function() {
            var args = ["value"];
            arguments.length && args.push(arguments[0]);
            return this.dateBox.dateOption.apply(this.dateBox, args)
        }
    });
    module.exports = DateBoxStrategy
});
