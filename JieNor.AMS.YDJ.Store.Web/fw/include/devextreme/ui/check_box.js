/** 
 * DevExtreme (ui/check_box.js)
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
        devices = require("../core/devices"),
        inkRipple = require("./widget/utils.ink_ripple"),
        Editor = require("./editor/editor"),
        registerComponent = require("../core/component_registrator"),
        eventUtils = require("../events/utils"),
        themes = require("./themes"),
        clickEvent = require("../events/click");
    var CHECKBOX_CLASS = "dx-checkbox",
        CHECKBOX_ICON_CLASS = "dx-checkbox-icon",
        CHECKBOX_CHECKED_CLASS = "dx-checkbox-checked",
        CHECKBOX_CONTAINER_CLASS = "dx-checkbox-container",
        CHECKBOX_TEXT_CLASS = "dx-checkbox-text",
        CHECKBOX_HAS_TEXT_CLASS = "dx-checkbox-has-text",
        CHECKBOX_INDETERMINATE_CLASS = "dx-checkbox-indeterminate",
        CHECKBOX_FEEDBACK_HIDE_TIMEOUT = 100;
    var CheckBox = Editor.inherit({
        _supportedKeys: function() {
            var click = function(e) {
                e.preventDefault();
                this._clickAction({
                    jQueryEvent: e
                })
            };
            return $.extend(this.callBase(), {
                space: click
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                hoverStateEnabled: true,
                activeStateEnabled: true,
                value: false,
                text: "",
                useInkRipple: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function(device) {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }, {
                device: function() {
                    return /android5/.test(themes.current())
                },
                options: {
                    useInkRipple: true
                }
            }])
        },
        _feedbackHideTimeout: CHECKBOX_FEEDBACK_HIDE_TIMEOUT,
        _render: function() {
            this.callBase();
            this._$container = $("<div>").addClass(CHECKBOX_CONTAINER_CLASS);
            this.setAria("role", "checkbox");
            this._renderClick();
            this._renderValue();
            this._renderIcon();
            this._renderText();
            this.option("useInkRipple") && this._renderInkRipple();
            this.element().addClass(CHECKBOX_CLASS).append(this._$container)
        },
        _renderInkRipple: function() {
            this._inkRipple = inkRipple.render({
                waveSizeCoefficient: 2.5,
                useHoldAnimation: false,
                wavesNumber: 2,
                isCentered: true
            })
        },
        _renderInkWave: function(element, jQueryEvent, doRender, waveIndex) {
            if (!this._inkRipple) {
                return
            }
            var config = {
                element: element,
                jQueryEvent: jQueryEvent,
                wave: waveIndex
            };
            if (doRender) {
                this._inkRipple.showWave(config)
            } else {
                this._inkRipple.hideWave(config)
            }
        },
        _updateFocusState: function(e, value) {
            this.callBase.apply(this, arguments);
            this._renderInkWave(this._$icon, e, value, 0)
        },
        _toggleActiveState: function($element, value, e) {
            this.callBase.apply(this, arguments);
            this._renderInkWave(this._$icon, e, value, 1)
        },
        _renderIcon: function() {
            this._$icon = $("<span>").addClass(CHECKBOX_ICON_CLASS).prependTo(this._$container)
        },
        _renderText: function() {
            var textValue = this.option("text");
            if (!textValue) {
                if (this._$text) {
                    this._$text.remove();
                    this.element().removeClass(CHECKBOX_HAS_TEXT_CLASS)
                }
                return
            }
            if (!this._$text) {
                this._$text = $("<span>").addClass(CHECKBOX_TEXT_CLASS)
            }
            this._$text.text(textValue);
            this._$container.append(this._$text);
            this.element().addClass(CHECKBOX_HAS_TEXT_CLASS)
        },
        _renderClick: function() {
            var that = this,
                eventName = eventUtils.addNamespace(clickEvent.name, that.NAME);
            that._clickAction = that._createAction(that._clickHandler);
            that.element().off(eventName).on(eventName, function(e) {
                that._clickAction({
                    jQueryEvent: e
                })
            })
        },
        _clickHandler: function(args) {
            var that = args.component;
            that._saveValueChangeEvent(args.jQueryEvent);
            that.option("value", !that.option("value"))
        },
        _renderValue: function() {
            var $element = this.element(),
                checked = this.option("value"),
                indeterminate = void 0 === checked;
            $element.toggleClass(CHECKBOX_CHECKED_CLASS, Boolean(checked));
            $element.toggleClass(CHECKBOX_INDETERMINATE_CLASS, indeterminate);
            this.setAria("checked", indeterminate ? "mixed" : checked || "false")
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "useInkRipple":
                    this._invalidate();
                    break;
                case "value":
                    this._renderValue();
                    this.callBase(args);
                    break;
                case "text":
                    this._renderText();
                    this._renderDimensions();
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxCheckBox", CheckBox);
    module.exports = CheckBox
});
