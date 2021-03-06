/** 
 * DevExtreme (ui/number_box/number_box.js)
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
        commonUtils = require("../../core/utils/common"),
        devices = require("../../core/devices"),
        registerComponent = require("../../core/component_registrator"),
        TextEditor = require("../text_box/ui.text_editor"),
        eventUtils = require("../../events/utils"),
        pointerEvents = require("../../events/pointer"),
        wheelEvent = require("../../events/core/wheel"),
        SpinButton = require("./number_box.spin"),
        messageLocalization = require("../../localization/message");
    var math = Math;
    var WIDGET_CLASS = "dx-numberbox",
        SPIN_CLASS = "dx-numberbox-spin",
        SPIN_CONTAINER_CLASS = "dx-numberbox-spin-container",
        SPIN_TOUCH_FRIENDLY_CLASS = "dx-numberbox-spin-touch-friendly";
    var FIREFOX_CONTROL_KEYS = ["Tab", "Del", "Delete", "Backspace", "Left", "ArrowLeft", "Right", "ArrowRight", "Home", "End", "Enter"];
    var NumberBox = TextEditor.inherit({
        _supportedKeys: function() {
            return $.extend(this.callBase(), {
                upArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this._spinUpChangeHandler(e)
                },
                downArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this._spinDownChangeHandler(e)
                },
                enter: function() {}
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                value: 0,
                min: void 0,
                max: void 0,
                step: 1,
                showSpinButtons: false,
                useTouchSpinButtons: true,
                mode: "text",
                invalidValueMessage: messageLocalization.format("dxNumberBox-invalidValueMessage")
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function(device) {
                    return devices.real().generic && !devices.isSimulator()
                },
                options: {
                    useTouchSpinButtons: false
                }
            }, {
                device: function() {
                    return "generic" !== devices.real().platform
                },
                options: {
                    mode: "number"
                }
            }])
        },
        _render: function() {
            this.callBase();
            if (this.option("isValid")) {
                this._validateValue(this.option("value"))
            }
            this.element().addClass(WIDGET_CLASS);
            this.setAria("role", "spinbutton");
            this._renderMouseWheelHandler()
        },
        _keyPressHandler: function(e) {
            this.callBase(e);
            var ch = String.fromCharCode(e.which),
                validCharRegExp = /[\d.,eE\-+]/,
                isInputCharValid = validCharRegExp.test(ch);
            if (!isInputCharValid) {
                if (e.metaKey || e.ctrlKey || e.key && $.inArray(e.key, FIREFOX_CONTROL_KEYS) >= 0) {
                    return
                }
                e.preventDefault();
                return false
            }
            this._keyPressed = true
        },
        _renderMouseWheelHandler: function(e) {
            var eventName = eventUtils.addNamespace(wheelEvent.name, this.NAME);
            var mouseWheelAction = this._createAction($.proxy(function(e) {
                this._mouseWheelHandler(e.jQueryEvent)
            }, this));
            this._input().off(eventName).on(eventName, function(e) {
                mouseWheelAction({
                    jQueryEvent: e
                })
            })
        },
        _mouseWheelHandler: function(jQueryEvent) {
            if (!this._input().is(":focus")) {
                return
            }
            jQueryEvent.delta > 0 ? this._spinValueChange(1, jQueryEvent) : this._spinValueChange(-1, jQueryEvent);
            jQueryEvent.preventDefault();
            jQueryEvent.stopPropagation()
        },
        _renderValue: function() {
            var inputValue = this._input().val();
            if (!inputValue.length || Number(inputValue) !== this.option("value")) {
                this._forceValueRender();
                this._toggleEmptinessEventHandler()
            }
            var value = this.option("value");
            this._renderInputAddons();
            this.setAria("valuenow", value)
        },
        _renderValueEventName: function() {
            return this.callBase() + " keypress"
        },
        _toggleDisabledState: function(value) {
            if (this._$spinUp) {
                SpinButton.getInstance(this._$spinUp).option("disabled", value)
            }
            if (this._$spinDown) {
                SpinButton.getInstance(this._$spinDown).option("disabled", value)
            }
            this.callBase.apply(this, arguments)
        },
        _forceValueRender: function() {
            var value = this.option("value"),
                number = Number(value),
                valueFormat = this.option("valueFormat"),
                formattedValue = isNaN(number) ? "" : valueFormat(value);
            this._renderDisplayText(formattedValue)
        },
        _renderProps: function() {
            this.callBase();
            this._input().prop({
                min: this.option("min"),
                max: this.option("max"),
                step: this.option("step")
            });
            this.setAria({
                valuemin: this.option("min") || "undefined",
                valuemax: this.option("max") || "undefined"
            })
        },
        _renderInputAddons: function() {
            this.callBase();
            this._renderSpinButtons()
        },
        _renderSpinButtons: function() {
            var spinButtonsVisible = this.option("showSpinButtons");
            this.element().toggleClass(SPIN_CLASS, spinButtonsVisible);
            this._toggleTouchFriendlyClass();
            if (!spinButtonsVisible) {
                this._$spinContainer && this._$spinContainer.remove();
                this._$spinContainer = null;
                return
            }
            if (!this._$spinContainer) {
                this._$spinContainer = this._createSpinButtons()
            }
            this._$spinContainer.prependTo(this._buttonsContainer())
        },
        _toggleTouchFriendlyClass: function() {
            this.element().toggleClass(SPIN_TOUCH_FRIENDLY_CLASS, this.option("showSpinButtons") && this.option("useTouchSpinButtons"))
        },
        _createSpinButtons: function() {
            var eventName = eventUtils.addNamespace(pointerEvents.down, this.NAME);
            var pointerDownAction = this._createAction($.proxy(this._spinButtonsPointerDownHandler, this));
            var $spinContainer = $("<div>").addClass(SPIN_CONTAINER_CLASS).off(eventName).on(eventName, function(e) {
                pointerDownAction({
                    jQueryEvent: e
                })
            });
            this._$spinUp = $("<div>").appendTo($spinContainer);
            this._createComponent(this._$spinUp, SpinButton, {
                direction: "up",
                onChange: $.proxy(this._spinUpChangeHandler, this)
            });
            this._$spinDown = $("<div>").appendTo($spinContainer);
            this._createComponent(this._$spinDown, SpinButton, {
                direction: "down",
                onChange: $.proxy(this._spinDownChangeHandler, this)
            });
            return $spinContainer
        },
        _spinButtonsPointerDownHandler: function(e) {
            var $input = this._input();
            if (!this.option("useTouchSpinButtons") && document.activeElement !== $input[0]) {
                $input.trigger("focus")
            }
        },
        _spinUpChangeHandler: function(e) {
            if (!this.option("readOnly")) {
                this._spinValueChange(1, e.jQueryEvent || e)
            }
        },
        _spinDownChangeHandler: function(e) {
            if (!this.option("readOnly")) {
                this._spinValueChange(-1, e.jQueryEvent || e)
            }
        },
        _spinValueChange: function(sign, jQueryEvent) {
            var value = parseFloat(this._normalizeInputValue()) || 0,
                step = parseFloat(this.option("step"));
            value = this._correctRounding(value, step * sign);
            var min = this.option("min"),
                max = this.option("max");
            if (void 0 !== min) {
                value = Math.max(min, value)
            }
            if (void 0 !== max) {
                value = Math.min(max, value)
            }
            this._saveValueChangeEvent(jQueryEvent);
            this.option("value", value)
        },
        _correctRounding: function(value, step) {
            var regex = /[,.](.*)/;
            var isFloatValue = regex.test(value),
                isFloatStep = regex.test(step);
            if (isFloatValue || isFloatStep) {
                var valueAccuracy = isFloatValue ? regex.exec(value)[0].length : 0,
                    stepAccuracy = isFloatStep ? regex.exec(step)[0].length : 0,
                    accuracy = math.max(valueAccuracy, stepAccuracy);
                value = this._round(value + step, accuracy);
                return value
            }
            return value + step
        },
        _round: function(value, precision) {
            precision = precision || 0;
            var multiplier = Math.pow(10, precision);
            value *= multiplier;
            value = Math.round(value) / multiplier;
            return value
        },
        _renderValueChangeEvent: function() {
            this.callBase();
            this._input().focusout($.proxy(this._forceRefreshInputValue, this))
        },
        _forceRefreshInputValue: function() {
            if ("number" === this.option("mode")) {
                return
            }
            var $input = this._input(),
                valueFormat = this.option("valueFormat");
            $input.val(null);
            $input.val(valueFormat(this.option("value")))
        },
        _valueChangeEventHandler: function(e) {
            var $input = this._input(),
                inputValue = $input.val(),
                value = this._normalizeInputValue(),
                valueFormat = this.option("valueFormat");
            if (this._shouldBeValidated() && !this._validateValue(value)) {
                $input.val(valueFormat(this.option("value")));
                return
            }
            if ("number" === this.option("mode")) {
                this.callBase(e, isNaN(value) ? null : value);
                return
            }
            if ("." === inputValue || "-" === inputValue) {
                return
            }
            this.callBase(e, value);
            if (this._isValueIncomplete(inputValue)) {
                return
            }
            if (commonUtils.isString(inputValue)) {
                inputValue = this._replaceCommaToPoint(inputValue)
            }
            if (Number(inputValue) !== value) {
                $input.val(valueFormat(value))
            }
        },
        _replaceCommaToPoint: function(value) {
            return value.replace(",", ".")
        },
        _inputIsInvalid: function() {
            var isNumberMode = "number" === this.option("mode");
            var validityState = this._input().get(0).validity;
            return isNumberMode && validityState && validityState.badInput
        },
        _renderDisplayText: function(text) {
            if (this._inputIsInvalid()) {
                return
            }
            this.callBase(text)
        },
        _isValueIncomplete: function(value) {
            var incompleteRegex = /^(([+-])|([+-]?(0|[1-9]\d*)?[.,])|([+-]?(0|[1-9]\d*)?([.,]\d+)[eE][+-]?)|([+-]?(0|[1-9]\d*)[eE][+-]?))$/;
            return incompleteRegex.test(value)
        },
        _shouldBeValidated: function() {
            var inputValue = this._normalizeText();
            return !!inputValue && !isNaN(Number(inputValue)) && this._isValueValid()
        },
        _validateValue: function(value) {
            var inputValue = this._normalizeText(),
                isValueValid = this._isValueValid(),
                isValid = true,
                isNumber = /^([-+]?[0-9]*[.,]?[0-9]+([eE][-+]?[0-9]+)?)$/.test(inputValue);
            if (isNaN(Number(value))) {
                isValid = false
            }
            if (!value && isValueValid) {
                isValid = true
            } else {
                if (!isNumber && !isValueValid) {
                    isValid = false
                }
            }
            this.option({
                isValid: isValid,
                validationError: isValid ? null : {
                    editorSpecific: true,
                    message: this.option("invalidValueMessage")
                }
            });
            return isValid
        },
        _normalizeInputValue: function() {
            return this._normalizeValue()
        },
        _normalizeValue: function(value) {
            return this._parseValue(this._normalizeText(value))
        },
        _normalizeText: function(value) {
            value = $.trim(commonUtils.isDefined(value) ? value : this._input().val());
            return this._replaceCommaToPoint(value)
        },
        _parseValue: function(value) {
            if ("" === value) {
                return null
            }
            var number = parseFloat(value);
            if (isNaN(number)) {
                return null
            }
            if (void 0 !== this.option("min")) {
                number = math.max(number, this.option("min"))
            }
            if (void 0 !== this.option("max")) {
                number = math.min(number, this.option("max"))
            }
            return number
        },
        _clean: function() {
            delete this._$spinContainer;
            delete this._$spinUp;
            delete this._$spinDown;
            this.callBase()
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "value":
                    this._validateValue(args.value);
                    this.callBase(args);
                    this._resumeValueChangeAction();
                    break;
                case "step":
                case "min":
                case "max":
                    this._renderProps();
                    break;
                case "showSpinButtons":
                    this._renderInputAddons();
                    break;
                case "useTouchSpinButtons":
                    this._toggleTouchFriendlyClass();
                    break;
                case "invalidValueMessage":
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxNumberBox", NumberBox);
    module.exports = NumberBox
});
