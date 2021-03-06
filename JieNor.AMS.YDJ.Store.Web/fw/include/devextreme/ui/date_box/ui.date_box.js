/** 
 * DevExtreme (ui/date_box/ui.date_box.js)
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
        registerComponent = require("../../core/component_registrator"),
        commonUtils = require("../../core/utils/common"),
        compareVersions = require("../../core/utils/version").compare,
        support = require("../../core/utils/support"),
        devices = require("../../core/devices"),
        dateUtils = require("../../core/utils/date"),
        uiDateUtils = require("./ui.date_utils"),
        DropDownEditor = require("../drop_down_editor/ui.drop_down_editor"),
        dateLocalization = require("../../localization/date"),
        messageLocalization = require("../../localization/message"),
        DATEBOX_CLASS = "dx-datebox",
        DATEBOX_WRAPPER_CLASS = "dx-datebox-wrapper";
    var PICKER_TYPE = {
        calendar: "calendar",
        rollers: "rollers",
        list: "list",
        "native": "native"
    };
    var TYPE = {
        date: "date",
        datetime: "datetime",
        time: "time"
    };
    var STRATEGY_NAME = {
        calendar: "Calendar",
        dateview: "DateView",
        "native": "Native",
        calendarWithTime: "CalendarWithTime",
        list: "List"
    };
    var STRATEGY_CLASSES = {
        Calendar: require("./ui.date_box.strategy.calendar"),
        DateView: require("./ui.date_box.strategy.date_view"),
        Native: require("./ui.date_box.strategy.native"),
        CalendarWithTime: require("./ui.date_box.strategy.calendar_with_time"),
        List: require("./ui.date_box.strategy.list")
    };
    var realWidthSetted = function($element) {
        var explicitWidth = $element[0].style.width;
        if (explicitWidth && "auto" !== explicitWidth && "inherit" !== explicitWidth) {
            return true
        }
        return false
    };
    var calculateWidth = function(value, $input, $element) {
        var IE_ROUNDING_ERROR = 10;
        var NATIVE_BUTTONS_WIDTH = 48;
        var $longestValueElement = $("<div>").text(value).css({
            "font-style": $input.css("font-style"),
            "font-variant": $input.css("font-variant"),
            "font-weight": $input.css("font-weight"),
            "font-size": $input.css("font-size"),
            "font-family": $input.css("font-family"),
            "letter-spacing": $input.css("letter-spacing"),
            "padding-left": $input.css("padding-left"),
            "padding-right": $input.css("padding-right"),
            border: $input.css("border"),
            visibility: "hidden",
            "white-space": "nowrap",
            position: "absolute",
            "float": "left"
        });
        $longestValueElement.appendTo($element);
        var width = $longestValueElement.outerWidth() + IE_ROUNDING_ERROR + ("text" !== $input.prop("type") ? NATIVE_BUTTONS_WIDTH : 0);
        $longestValueElement.remove();
        return width
    };
    var DateBox = DropDownEditor.inherit({
        _supportedKeys: function() {
            return $.extend(this.callBase(), this._strategy.supportedKeys())
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                format: {
                    since: "16.1",
                    alias: "type"
                },
                formatString: {
                    since: "16.1",
                    alias: "displayFormat"
                },
                useNative: {
                    since: "15.1",
                    message: "'useNative' option is deprecated in 15.1. Use the 'pickerType' option instead"
                },
                useCalendar: {
                    since: "15.1",
                    message: "'useCalendar' option is deprecated in 15.1. Use the 'pickerType' option instead"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                type: "date",
                value: null,
                min: void 0,
                max: void 0,
                useCalendar: false,
                displayFormat: null,
                interval: 30,
                maxZoomLevel: "month",
                minZoomLevel: "century",
                useNative: true,
                pickerType: PICKER_TYPE.native,
                invalidDateMessage: messageLocalization.format("dxDateBox-validation-datetime"),
                dateOutOfRangeMessage: messageLocalization.format("validation-range"),
                applyButtonText: messageLocalization.format("Done"),
                adaptivityEnabled: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    platform: "ios"
                },
                options: {
                    showPopupTitle: true
                }
            }, {
                device: function(device) {
                    return "android" === device.platform
                },
                options: {
                    buttonsLocation: "bottom after"
                }
            }, {
                device: function(device) {
                    return "win" === device.platform && device.version && 8 === device.version[0]
                },
                options: {
                    buttonsLocation: "bottom after"
                }
            }, {
                device: function(device) {
                    return "win" === device.platform && device.version && 10 === device.version[0]
                },
                options: {
                    buttonsLocation: "bottom center"
                }
            }, {
                device: function() {
                    var realDevice = devices.real(),
                        platform = realDevice.platform,
                        version = realDevice.version;
                    return "generic" === platform || "win" === platform || "android" === platform && compareVersions(version, [4, 4]) < 0
                },
                options: {
                    pickerType: PICKER_TYPE.rollers
                }
            }, {
                device: {
                    platform: "generic",
                    deviceType: "desktop"
                },
                options: {
                    pickerType: PICKER_TYPE.calendar,
                    buttonsLocation: "bottom after"
                }
            }, {
                device: function() {
                    var realDevice = devices.real(),
                        platform = realDevice.platform,
                        isPhone = realDevice.phone;
                    return "win" === platform && !isPhone
                },
                options: {
                    pickerType: PICKER_TYPE.calendar
                }
            }])
        },
        _initOptions: function(options) {
            this._userOptions = $.extend({}, options);
            this.callBase(options);
            this._updatePickerOptions(this._userOptions)
        },
        _updatePickerOptions: function(userOptions) {
            var pickerType = this._getPickerTypeByDepricatedOptions(userOptions);
            var type = this.option("type");
            if (pickerType === PICKER_TYPE.list && (type === TYPE.datetime || type === TYPE.date)) {
                pickerType = PICKER_TYPE.calendar
            }
            if (type === TYPE.time && pickerType === PICKER_TYPE.calendar) {
                pickerType = PICKER_TYPE.list
            }
            this.option("showDropButton", "generic" !== devices.real().platform || pickerType !== PICKER_TYPE.native);
            this._pickerType = pickerType
        },
        _getPickerTypeByDepricatedOptions: function(userOptions) {
            return userOptions.pickerType ? userOptions.pickerType : commonUtils.isDefined(userOptions.useCalendar) || commonUtils.isDefined(userOptions.useNative) ? this._getPickerType() : this._pickerType || this.option("pickerType")
        },
        _getPickerType: function() {
            if (this.option().useCalendar) {
                return this.option("type") === TYPE.time ? PICKER_TYPE.list : PICKER_TYPE.calendar
            }
            if (this.option().useNative) {
                return PICKER_TYPE.native
            }
            return PICKER_TYPE.rollers
        },
        _init: function() {
            this._initStrategy();
            this.option($.extend({}, this._strategy.getDefaultOptions(), this._userOptions));
            delete this._userOptions;
            this.callBase()
        },
        _toLowerCaseFirstLetter: function(string) {
            return string.charAt(0).toLowerCase() + string.substr(1)
        },
        _initStrategy: function() {
            var strategyName = this._getStrategyName(this._getFormatType()),
                strategy = STRATEGY_CLASSES[strategyName];
            if (!(this._strategy && this._strategy.NAME === strategyName)) {
                this._strategy = new strategy(this)
            }
        },
        _getFormatType: function() {
            var currentType = this.option("type");
            var isTime = /h|m|s/g.test(currentType),
                isDate = /d|M|Y/g.test(currentType);
            var type = "";
            if (isDate) {
                type += TYPE.date
            }
            if (isTime) {
                type += TYPE.time
            }
            return type
        },
        _getStrategyName: function(type) {
            var pickerType = this._pickerType;
            if (pickerType === PICKER_TYPE.rollers) {
                return this.option().useCalendar ? STRATEGY_NAME.calendar : STRATEGY_NAME.dateview
            }
            if (pickerType === PICKER_TYPE.native) {
                return STRATEGY_NAME.native
            }
            if (type === TYPE.date) {
                return STRATEGY_NAME.calendar
            }
            if (type === TYPE.datetime) {
                return STRATEGY_NAME.calendarWithTime
            }
            return STRATEGY_NAME.list
        },
        _render: function() {
            this.element().addClass(DATEBOX_CLASS);
            this._refreshFormatClass();
            this._refreshPickerTypeClass();
            this.callBase();
            this._updateSize();
            this._strategy.renderInputMinMax(this._input())
        },
        _refreshFormatClass: function() {
            var $element = this.element();
            $.each(TYPE, $.proxy(function(_, item) {
                $element.removeClass(DATEBOX_CLASS + "-" + item)
            }, null));
            $element.addClass(DATEBOX_CLASS + "-" + this.option("type"))
        },
        _refreshPickerTypeClass: function() {
            var $element = this.element();
            $.each(PICKER_TYPE, $.proxy(function(_, item) {
                $element.removeClass(DATEBOX_CLASS + "-" + item)
            }, null));
            $element.addClass(DATEBOX_CLASS + "-" + this._pickerType)
        },
        _updateSize: function() {
            var $element = this.element(),
                widthOption = this.option("width"),
                isWidthSet = commonUtils.isDefined(widthOption) || realWidthSetted($element) && !this._isSizeUpdatable,
                isElementVisible = $element.is(":visible"),
                pickerType = this._pickerType,
                shouldCalculateWidth = pickerType !== PICKER_TYPE.rollers && "generic" === devices.current().platform;
            if (isWidthSet || !(shouldCalculateWidth && isElementVisible)) {
                return
            }
            var $input = this._input(),
                format = this._strategy.getDisplayFormat(this.option("displayFormat")),
                longestValue = dateLocalization.format(uiDateUtils.getLongestDate(format, dateLocalization.getMonthNames(), dateLocalization.getDayNames()), format);
            $element.width(calculateWidth(longestValue, $input, this.element()));
            this._isSizeUpdatable = true
        },
        _attachChildKeyboardEvents: function() {
            this._strategy.attachKeyboardEvents(this._keyboardProcessor)
        },
        _renderPopup: function() {
            this.callBase();
            this._popup._wrapper().addClass(DATEBOX_WRAPPER_CLASS);
            this._renderPopupWrapper()
        },
        _popupConfig: function() {
            var popupConfig = this.callBase();
            return $.extend(this._strategy.popupConfig(popupConfig), {
                title: this._getPopupTitle(),
                dragEnabled: false
            })
        },
        _renderPopupWrapper: function() {
            if (!this._popup) {
                return
            }
            var $element = this.element();
            var classPostfixes = $.extend({}, TYPE, PICKER_TYPE);
            $.each(classPostfixes, $.proxy(function(_, item) {
                $element.removeClass(DATEBOX_WRAPPER_CLASS + "-" + item)
            }, this));
            this._popup._wrapper().addClass(DATEBOX_WRAPPER_CLASS + "-" + this.option("type")).addClass(DATEBOX_WRAPPER_CLASS + "-" + this._pickerType)
        },
        _renderPopupContent: function() {
            this.callBase();
            this._strategy.renderPopupContent()
        },
        _getFirstPopupElement: function() {
            return this._strategy.getFirstPopupElement() || this.callBase()
        },
        _getLastPopupElement: function() {
            return this._strategy.getLastPopupElement() || this.callBase()
        },
        _popupShowingHandler: function() {
            this.callBase();
            this._strategy.popupShowingHandler()
        },
        _popupHiddenHandler: function() {
            this.callBase();
            this._strategy.popupHiddenHandler()
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._updateSize()
            }
        },
        _readOnlyPropValue: function() {
            return this.callBase() || this._pickerType === PICKER_TYPE.rollers
        },
        _clearButtonVisibility: function() {
            return this.callBase() && !this._isNativeType()
        },
        _renderValue: function() {
            var value = this.dateOption("value");
            this.option("text", this._getDisplayedText(value));
            this._strategy.renderValue();
            this.callBase()
        },
        _getDisplayedText: function(value) {
            var pattern, displayedText, mode = this.option("mode");
            if ("text" !== mode) {
                pattern = this._getPattern(uiDateUtils.FORMATS_MAP[mode]);
                displayedText = uiDateUtils.toStandardDateFormat(value, mode, pattern)
            } else {
                var displayFormat = this._strategy.getDisplayFormat(this.option("displayFormat"));
                displayedText = dateLocalization.format(value, displayFormat)
            }
            return displayedText
        },
        _getPattern: function(type) {
            return !support.inputType(this.option("mode")) ? dateLocalization.getPatternByFormat(type) : null
        },
        _valueChangeEventHandler: function(e) {
            var displayFormat = this._strategy.getDisplayFormat(this.option("displayFormat")),
                text = this.option("text"),
                date = this._strategy.getParsedText(text, displayFormat),
                value = this.dateOption("value"),
                modelValue = new Date(value && value.valueOf()),
                type = this.option("type"),
                newValue = uiDateUtils.mergeDates(modelValue, date, type) || null;
            if (this._validateValue(date)) {
                var displayedText = this._getDisplayedText(newValue);
                if (value && newValue && value.getTime() === newValue.getTime() && displayedText !== text) {
                    this._renderValue()
                } else {
                    this.dateOption("value", newValue)
                }
            }
            this.validationRequest.fire({
                value: newValue,
                editor: this
            })
        },
        _validateValue: function(value) {
            var text = this.option("text"),
                hasText = !!text && null !== value,
                isDate = !!value && !isNaN(value.getTime()),
                isDateInRange = isDate && dateUtils.dateInRange(value, this.dateOption("min"), this.dateOption("max"), this.option("type")),
                isValid = !hasText || !hasText && !value || isDateInRange,
                validationMessage = "";
            if (!isDate) {
                validationMessage = this.option("invalidDateMessage")
            } else {
                if (!isDateInRange) {
                    validationMessage = this.option("dateOutOfRangeMessage")
                }
            }
            this.option({
                isValid: isValid,
                validationError: isValid ? null : {
                    editorSpecific: true,
                    message: validationMessage
                }
            });
            return isValid
        },
        _renderProps: function() {
            this.callBase();
            this._input().attr("autocomplete", "off")
        },
        _renderOpenedState: function() {
            if (!this._isNativeType()) {
                this.callBase()
            }
            if (this._strategy.isAdaptivityChanged()) {
                this._refreshStrategy()
            }
            this._strategy.renderOpenedState()
        },
        _getPopupTitle: function() {
            var placeholder = this.option("placeholder");
            if (placeholder) {
                return placeholder
            }
            var type = this.option("type");
            if (type === TYPE.time) {
                return messageLocalization.format("dxDateBox-simulatedDataPickerTitleTime")
            }
            if (type === TYPE.date || type === TYPE.datetime) {
                return messageLocalization.format("dxDateBox-simulatedDataPickerTitleDate")
            }
            return ""
        },
        _renderPlaceholder: function() {
            this._popup && this._popup.option("title", this._getPopupTitle());
            this.callBase()
        },
        _refreshStrategy: function() {
            this._strategy.dispose();
            this._initStrategy();
            this.option(this._strategy.getDefaultOptions());
            this._refresh()
        },
        _applyButtonHandler: function() {
            this.dateOption("value", this._strategy.getValue());
            this.callBase()
        },
        _dispose: function() {
            this._strategy && this._strategy.dispose();
            this.callBase()
        },
        _isNativeType: function() {
            return this._pickerType === PICKER_TYPE.native
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "useCalendar":
                    this._updatePickerOptions({
                        useCalendar: args.value
                    });
                    this._refreshStrategy();
                    break;
                case "useNative":
                    this._updatePickerOptions({
                        useNative: args.value
                    });
                    this._refreshStrategy();
                    break;
                case "showClearButton":
                    this.callBase.apply(this, arguments);
                    this._updateSize();
                    break;
                case "pickerType":
                    this._updatePickerOptions({
                        pickerType: args.value
                    });
                    this._refreshStrategy();
                    this._refreshPickerTypeClass();
                    this._invalidate();
                    break;
                case "type":
                    this._updatePickerOptions({
                        format: args.value
                    });
                    this._refreshStrategy();
                    this._refreshFormatClass();
                    this._renderPopupWrapper();
                    this._updateSize();
                    break;
                case "placeholder":
                    this._renderPlaceholder();
                    break;
                case "readOnly":
                case "min":
                case "max":
                case "interval":
                case "minZoomLevel":
                case "maxZoomLevel":
                    this._invalidate();
                    break;
                case "displayFormat":
                    this._updateValue();
                    break;
                case "formatWidthCalculator":
                    break;
                case "closeOnValueChange":
                    var applyValueMode = args.value ? "instantly" : "useButtons";
                    this.option("applyValueMode", applyValueMode);
                    break;
                case "applyValueMode":
                    this._suppressDeprecatedWarnings();
                    this.option("closeOnValueChange", "instantly" === args.value);
                    this._resumeDeprecatedWarnings();
                    this.callBase.apply(this, arguments);
                    break;
                case "text":
                    this._strategy.textChangedHandler(args.value);
                    this.callBase.apply(this, arguments);
                    break;
                case "isValid":
                    this.callBase.apply(this, arguments);
                    this._updateSize();
                    break;
                case "value":
                    this._validateValue(dateUtils.deserializeDate(this.option("value"), this._getSerializationFormat(this.option("value"))));
                    this.callBase.apply(this, arguments);
                    break;
                case "showDropButton":
                case "invalidDateMessage":
                case "dateOutOfRangeMessage":
                case "adaptivityEnabled":
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        _getSerializationFormat: function() {
            var value = this.option("value");
            if (commonUtils.isNumber(value)) {
                return "number"
            }
            if (!commonUtils.isString(value)) {
                return
            }
            return "date" === this.option("type") ? "yyyy'/'MM'/'dd" : "yyyy'/'MM'/'dd HH:mm:ss"
        },
        dateOption: function(optionName, value) {
            var serializationFormat = this._getSerializationFormat();
            if (1 === arguments.length) {
                return dateUtils.deserializeDate(this.option(optionName), serializationFormat, $.proxy(dateLocalization.parse, dateLocalization))
            }
            this.option(optionName, dateUtils.serializeDate(value, serializationFormat, $.proxy(dateLocalization.format, dateLocalization)))
        },
        reset: function() {
            this.callBase();
            this._updateValue()
        }
    });
    registerComponent("dxDateBox", DateBox);
    module.exports = DateBox
});
