/** 
 * DevExtreme (localization/number.js)
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
        dependencyInjector = require("../core/utils/dependency_injector"),
        errors = require("../core/errors");
    var MAX_LARGE_NUMBER_POWER = 4,
        DECIMAL_BASE = 10;
    var NUMERIC_FORMATS = ["currency", "fixedpoint", "exponential", "percent", "decimal"];
    var LargeNumberFormatPostfixes = {
        1: "K",
        2: "M",
        3: "B",
        4: "T"
    };
    var LargeNumberFormatPowers = {
        largenumber: "auto",
        thousands: 1,
        millions: 2,
        billions: 3,
        trillions: 4
    };
    var numberLocalization = dependencyInjector({
        numericFormats: NUMERIC_FORMATS,
        defaultLargeNumberFormatPostfixes: LargeNumberFormatPostfixes,
        _parseNumberFormatString: function(formatType) {
            var formatList, formatObject = {};
            if (!formatType || "string" !== typeof formatType) {
                return
            }
            formatList = formatType.split(" ");
            $.each(formatList, function(index, value) {
                if ($.inArray(value, NUMERIC_FORMATS) > -1) {
                    formatObject.formatType = value
                } else {
                    if (value in LargeNumberFormatPowers) {
                        formatObject.power = LargeNumberFormatPowers[value]
                    }
                }
            });
            if (formatObject.power && !formatObject.formatType) {
                formatObject.formatType = "fixedpoint"
            }
            if (formatObject.formatType) {
                return formatObject
            }
        },
        _calculateNumberPower: function(value, base, minPower, maxPower) {
            var number = Math.abs(value),
                power = 0;
            if (number > 1) {
                while (number && number >= base && (void 0 === maxPower || power < maxPower)) {
                    power++;
                    number /= base
                }
            } else {
                if (number > 0 && number < 1) {
                    while (number < 1 && (void 0 === minPower || power > minPower)) {
                        power--;
                        number *= base
                    }
                }
            }
            return power
        },
        _getNumberByPower: function(number, power, base) {
            var result = number;
            while (power > 0) {
                result /= base;
                power--
            }
            while (power < 0) {
                result *= base;
                power++
            }
            return result
        },
        _formatNumber: function(value, formatObject, formatConfig) {
            var powerPostfix;
            if ("auto" === formatObject.power) {
                formatObject.power = this._calculateNumberPower(value, 1e3, 0, MAX_LARGE_NUMBER_POWER)
            }
            if (formatObject.power) {
                value = this._getNumberByPower(value, formatObject.power, 1e3)
            }
            powerPostfix = this.defaultLargeNumberFormatPostfixes[formatObject.power] || "";
            return this._formatNumberCore(value, formatObject.formatType, formatConfig) + powerPostfix
        },
        _formatNumberExponential: function(value, formatConfig) {
            var powString, power = this._calculateNumberPower(value, DECIMAL_BASE),
                number = this._getNumberByPower(value, power, DECIMAL_BASE);
            if (void 0 === formatConfig.precision) {
                formatConfig.precision = 1
            }
            if (number.toFixed(formatConfig.precision || 0) >= DECIMAL_BASE) {
                power++;
                number /= DECIMAL_BASE
            }
            powString = (power >= 0 ? "+" : "") + power.toString();
            return this._formatNumberCore(number, "fixedpoint", formatConfig) + "E" + powString
        },
        _addZeroes: function(value, precision) {
            var multiplier = Math.pow(10, precision);
            value = (value * multiplier >>> 0) / multiplier;
            var result = value.toString();
            while (result.length < precision) {
                result = "0" + result
            }
            return result
        },
        _addGroupSeparators: function(value) {
            var parts = value.toString().split(".");
            return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "")
        },
        _formatNumberCore: function(value, format, formatConfig) {
            if ("exponential" === format) {
                return this._formatNumberExponential(value, formatConfig)
            }
            if ("decimal" !== format) {
                formatConfig.precision = formatConfig.precision || 0
            }
            if ("percent" === format) {
                value = 100 * value
            }
            if (void 0 !== formatConfig.precision) {
                if ("decimal" === format) {
                    value = this._addZeroes(value, formatConfig.precision)
                } else {
                    value = value.toFixed(formatConfig.precision)
                }
            }
            if ("decimal" !== format) {
                value = this._addGroupSeparators(value)
            }
            if ("percent" === format) {
                value += "%"
            }
            return value.toString()
        },
        _normalizeFormat: function(format) {
            if (!format) {
                return {}
            }
            if ("function" === typeof format) {
                return format
            }
            if (!$.isPlainObject(format)) {
                format = {
                    type: format
                }
            }
            if (format.type) {
                format.type = format.type.toLowerCase()
            }
            return format
        },
        format: function(value, format) {
            if ("number" !== typeof value) {
                return value
            }
            if ("number" === typeof format) {
                return value
            }
            format = format && format.formatter || format;
            if ("function" === typeof format) {
                return format(value)
            }
            format = this._normalizeFormat(format);
            if (!format.type) {
                format.type = "decimal"
            }
            var numberConfig = this._parseNumberFormatString(format.type);
            if (!numberConfig) {
                return
            }
            return this._formatNumber(value, numberConfig, format)
        },
        parse: function(text, format) {
            if (!text) {
                return
            }
            if (format && format.parser) {
                return format.parser(text)
            }
            if (format) {
                errors.log("W0011")
            }
            return parseFloat(text.replace(/^\D+|,+/g, ""))
        }
    });
    module.exports = numberLocalization
});
