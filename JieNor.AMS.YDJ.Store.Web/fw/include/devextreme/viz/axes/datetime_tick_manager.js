/** 
 * DevExtreme (viz/axes/datetime_tick_manager.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        dateUtils = require("../../core/utils/date"),
        commonUtils = require("../../core/utils/common"),
        tickManagerContinuous = require("./numeric_tick_manager").continuous,
        _isDefined = commonUtils.isDefined,
        _convertDateUnitToMilliseconds = dateUtils.convertDateUnitToMilliseconds,
        _correctDateWithUnitBeginning = dateUtils.correctDateWithUnitBeginning,
        _dateToMilliseconds = dateUtils.dateToMilliseconds,
        _convertMillisecondsToDateUnits = dateUtils.convertMillisecondsToDateUnits,
        _math = Math,
        _abs = _math.abs,
        _ceil = _math.ceil,
        _floor = _math.floor,
        _round = _math.round,
        MINOR_TICKS_COUNT_LIMIT = 50,
        DEFAULT_DATETIME_MULTIPLIERS = {
            millisecond: [1, 2, 5, 10, 25, 100, 250, 300, 500],
            second: [1, 2, 3, 5, 10, 15, 20, 30],
            minute: [1, 2, 3, 5, 10, 15, 20, 30],
            hour: [1, 2, 3, 4, 6, 8, 12],
            day: [1, 2, 3, 5, 7, 10, 14],
            month: [1, 2, 3, 6]
        };

    function correctDate(date, tickInterval, correctionMethod) {
        var interval = _dateToMilliseconds(tickInterval),
            timezoneOffset = 60 * date.getTimezoneOffset() * 1e3;
        return new Date(Math[correctionMethod]((date - 0 - timezoneOffset) / interval) * interval + timezoneOffset)
    }
    exports.datetime = $.extend({}, tickManagerContinuous, {
        _correctInterval: function(step) {
            var tickIntervalInMs = _dateToMilliseconds(this._tickInterval);
            this._tickInterval = _convertMillisecondsToDateUnits(tickIntervalInMs * step)
        },
        _correctMax: function(tickInterval) {
            this._max = correctDate(this._max, tickInterval, "ceil")
        },
        _correctMin: function(tickInterval) {
            this._min = correctDate(this._min, tickInterval, "floor");
            if (this._options.setTicksAtUnitBeginning) {
                this._min = _correctDateWithUnitBeginning(this._min, tickInterval)
            }
        },
        _findTickIntervalForCustomTicks: function() {
            return _convertMillisecondsToDateUnits(_abs(this._customTicks[1] - this._customTicks[0]))
        },
        _getBoundInterval: function() {
            var that = this,
                interval = that._tickInterval,
                intervalInMs = _dateToMilliseconds(interval),
                boundCoef = that._options.boundCoef,
                boundIntervalInMs = _isDefined(boundCoef) && isFinite(boundCoef) ? intervalInMs * _abs(boundCoef) : intervalInMs / 2;
            return _convertMillisecondsToDateUnits(boundIntervalInMs)
        },
        _getInterval: function(deltaCoef) {
            var factor, i, key, specificMultipliers, yearsCount, interval = deltaCoef || this._getDeltaCoef(this._screenDelta, this._businessDelta, this._options.gridSpacingFactor),
                multipliers = this._options.numberMultipliers,
                result = {};
            if (interval > 0 && interval < 1) {
                return {
                    milliseconds: 1
                }
            }
            if (0 === interval) {
                return 0
            }
            for (key in DEFAULT_DATETIME_MULTIPLIERS) {
                if (DEFAULT_DATETIME_MULTIPLIERS.hasOwnProperty(key)) {
                    specificMultipliers = DEFAULT_DATETIME_MULTIPLIERS[key];
                    for (i = 0; i < specificMultipliers.length; i++) {
                        if (interval <= _convertDateUnitToMilliseconds(key, specificMultipliers[i])) {
                            result[key + "s"] = specificMultipliers[i];
                            return result
                        }
                    }
                }
            }
            for (factor = 1;; factor *= 10) {
                for (i = 0; i < multipliers.length; i++) {
                    yearsCount = factor * multipliers[i];
                    if (interval <= _convertDateUnitToMilliseconds("year", yearsCount)) {
                        return {
                            years: yearsCount
                        }
                    }
                }
            }
            return 0
        },
        _getMarginValue: function(min, max, margin) {
            return _convertMillisecondsToDateUnits(_round(_abs(max - min) * margin))
        },
        _getMinorInterval: function(screenDelta, businessDelta) {
            var interval, intervalInMs, intervalsCount, count, that = this,
                options = that._options;
            if (_isDefined(options.minorTickInterval) && that._isTickIntervalCorrect(options.minorTickInterval, MINOR_TICKS_COUNT_LIMIT, businessDelta)) {
                interval = options.minorTickInterval;
                intervalInMs = _dateToMilliseconds(interval);
                count = intervalInMs < businessDelta ? _ceil(businessDelta / intervalInMs) - 1 : 0
            } else {
                intervalsCount = _isDefined(options.minorTickCount) ? options.minorTickCount + 1 : _floor(screenDelta / options.minorGridSpacingFactor);
                count = intervalsCount - 1;
                interval = count > 0 ? _convertMillisecondsToDateUnits(businessDelta / intervalsCount) : 0
            }
            that._minorTickInterval = interval;
            that._minorTickCount = count
        },
        _getNextTickValue: function(value, tickInterval, isTickIntervalNegative, isTickIntervalWithPow, withCorrection) {
            var newValue = dateUtils.addInterval(value, tickInterval, isTickIntervalNegative);
            if (this._options.setTicksAtUnitBeginning && false !== withCorrection) {
                newValue = _correctDateWithUnitBeginning(newValue, tickInterval, true)
            }
            return newValue
        },
        _getUnitBeginningMinorTicks: function(minorTicks) {
            var that = this,
                ticks = that._ticks,
                tickInterval = that._findMinorTickInterval(ticks[1], ticks[2]),
                isTickIntervalNegative = true,
                isTickIntervalWithPow = false,
                needCorrectTick = false,
                startTick = that._getNextTickValue(ticks[1], tickInterval, isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick);
            if (that._isTickIntervalValid(tickInterval)) {
                minorTicks = that._createTicks(minorTicks, tickInterval, startTick, ticks[0], isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick)
            }
            return minorTicks
        },
        _hasUnitBeginningTickCorrection: function() {
            var ticks = this._ticks;
            if (ticks.length < 3) {
                return false
            }
            return ticks[1] - ticks[0] !== ticks[2] - ticks[1] && this._options.setTicksAtUnitBeginning && this._options.minorTickCount
        },
        _isTickIntervalValid: function(tickInterval) {
            return _isDefined(tickInterval) && 0 !== _dateToMilliseconds(tickInterval)
        },
        _checkBoundedDatesOverlapping: function() {
            var dates = this._ticks,
                overlappingBehavior = this.getOverlappingBehavior();
            return dates.length > 2 && "stagger" !== overlappingBehavior.mode && "ignore" !== overlappingBehavior.mode && !this._areDisplayValuesValid(dates[0], dates[1])
        }
    })
});
