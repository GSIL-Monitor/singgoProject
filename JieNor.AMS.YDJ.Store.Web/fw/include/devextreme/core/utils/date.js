/** 
 * DevExtreme (core/utils/date.js)
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
        commonUtils = require("./common"),
        inflector = require("./inflector"),
        isObject = commonUtils.isObject,
        isString = commonUtils.isString,
        isDate = commonUtils.isDate,
        isDefined = commonUtils.isDefined,
        camelize = inflector.camelize;
    var dateUnitIntervals = ["millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year"];
    var toMilliseconds = function(value) {
        switch (value) {
            case "millisecond":
                return 1;
            case "second":
                return 1e3 * toMilliseconds("millisecond");
            case "minute":
                return 60 * toMilliseconds("second");
            case "hour":
                return 60 * toMilliseconds("minute");
            case "day":
                return 24 * toMilliseconds("hour");
            case "week":
                return 7 * toMilliseconds("day");
            case "month":
                return 30 * toMilliseconds("day");
            case "quarter":
                return 3 * toMilliseconds("month");
            case "year":
                return 365 * toMilliseconds("day");
            default:
                return 0
        }
    };
    var getDatesInterval = function(startDate, endDate, intervalUnit) {
        var delta = endDate.getTime() - startDate.getTime(),
            millisecondCount = toMilliseconds(intervalUnit) || 1;
        return Math.floor(delta / millisecondCount)
    };
    var getNextDateUnit = function(unit, withWeeks) {
        var interval = getDateUnitInterval(unit);
        switch (interval) {
            case "millisecond":
                return "second";
            case "second":
                return "minute";
            case "minute":
                return "hour";
            case "hour":
                return "day";
            case "day":
                return withWeeks ? "week" : "month";
            case "week":
                return "month";
            case "month":
                return "quarter";
            case "quarter":
                return "year";
            case "year":
                return "year";
            default:
                return 0
        }
    };
    var convertMillisecondsToDateUnits = function(value) {
        var i, dateUnitCount, dateUnitInterval, dateUnitIntervals = ["millisecond", "second", "minute", "hour", "day", "month", "year"],
            result = {};
        for (i = dateUnitIntervals.length - 1; i >= 0; i--) {
            dateUnitInterval = dateUnitIntervals[i];
            dateUnitCount = Math.floor(value / toMilliseconds(dateUnitInterval));
            if (dateUnitCount > 0) {
                result[dateUnitInterval + "s"] = dateUnitCount;
                value -= convertDateUnitToMilliseconds(dateUnitInterval, dateUnitCount)
            }
        }
        return result
    };
    var dateToMilliseconds = function(tickInterval) {
        var milliseconds = 0;
        if (isObject(tickInterval)) {
            $.each(tickInterval, function(key, value) {
                milliseconds += convertDateUnitToMilliseconds(key.substr(0, key.length - 1), value)
            })
        }
        if (isString(tickInterval)) {
            milliseconds = convertDateUnitToMilliseconds(tickInterval, 1)
        }
        return milliseconds
    };
    var convertDateUnitToMilliseconds = function(dateUnit, count) {
        return toMilliseconds(dateUnit) * count
    };
    var getDateUnitInterval = function(tickInterval) {
        var i, maxInterval = -1;
        if (isString(tickInterval)) {
            return tickInterval
        }
        if (isObject(tickInterval)) {
            $.each(tickInterval, function(key, value) {
                for (i = 0; i < dateUnitIntervals.length; i++) {
                    if (value && (key === dateUnitIntervals[i] + "s" || key === dateUnitIntervals[i]) && maxInterval < i) {
                        maxInterval = i
                    }
                }
            });
            return dateUnitIntervals[maxInterval]
        }
        return ""
    };
    var tickIntervalToFormatMap = {
        millisecond: "millisecond",
        second: "longtime",
        minute: "shorttime",
        hour: "shorttime",
        day: "day",
        week: "day",
        month: "month",
        quarter: "quarter",
        year: "year"
    };

    function getDateFormatByTickInterval(tickInterval) {
        return tickIntervalToFormatMap[getDateUnitInterval(tickInterval)] || ""
    }
    var getQuarter = function(month) {
        return Math.floor(month / 3)
    };
    var getFirstQuarterMonth = function(month) {
        return 3 * getQuarter(month)
    };
    var correctDateWithUnitBeginning = function(date, dateInterval, withCorrection) {
        date = new Date(date.getTime());
        var firstQuarterMonth, oldDate = new Date(date.getTime()),
            dateUnitInterval = getDateUnitInterval(dateInterval);
        switch (dateUnitInterval) {
            case "second":
                date.setMilliseconds(0);
                break;
            case "minute":
                date.setSeconds(0, 0);
                break;
            case "hour":
                date.setMinutes(0, 0, 0);
                break;
            case "year":
                date.setMonth(0);
            case "month":
                date.setDate(1);
            case "day":
                date.setHours(0, 0, 0, 0);
                break;
            case "week":
                date.setDate(date.getDate() - date.getDay());
                date.setHours(0, 0, 0, 0);
                break;
            case "quarter":
                firstQuarterMonth = getFirstQuarterMonth(date.getMonth());
                if (date.getMonth() !== firstQuarterMonth) {
                    date.setMonth(firstQuarterMonth)
                }
                date.setDate(1);
                date.setHours(0, 0, 0, 0)
        }
        if (withCorrection && "hour" !== dateUnitInterval && "minute" !== dateUnitInterval && "second" !== dateUnitInterval) {
            fixTimezoneGap(oldDate, date)
        }
        return date
    };
    var trimTime = function(date) {
        return dateUtils.correctDateWithUnitBeginning(date, "day")
    };
    var getDatesDifferences = function(date1, date2) {
        var differences, counter = 0;
        differences = {
            year: date1.getFullYear() !== date2.getFullYear(),
            month: date1.getMonth() !== date2.getMonth(),
            day: date1.getDate() !== date2.getDate(),
            hour: date1.getHours() !== date2.getHours(),
            minute: date1.getMinutes() !== date2.getMinutes(),
            second: date1.getSeconds() !== date2.getSeconds()
        };
        $.each(differences, function(key, value) {
            if (value) {
                counter++
            }
        });
        differences.count = counter;
        return differences
    };

    function addDateInterval(value, interval, dir) {
        var result = new Date(value.getTime()),
            intervalObject = isString(interval) ? getDateIntervalByString(interval.toLowerCase()) : interval;
        if (intervalObject.years) {
            result.setFullYear(result.getFullYear() + intervalObject.years * dir)
        }
        if (intervalObject.quarters) {
            result.setMonth(result.getMonth() + 3 * intervalObject.quarters * dir)
        }
        if (intervalObject.months) {
            result.setMonth(result.getMonth() + intervalObject.months * dir)
        }
        if (intervalObject.weeks) {
            result.setDate(result.getDate() + 7 * intervalObject.weeks * dir)
        }
        if (intervalObject.days) {
            result.setDate(result.getDate() + intervalObject.days * dir)
        }
        if (intervalObject.hours) {
            result.setHours(result.getHours() + intervalObject.hours * dir)
        }
        if (intervalObject.minutes) {
            result.setMinutes(result.getMinutes() + intervalObject.minutes * dir)
        }
        if (intervalObject.seconds) {
            result.setSeconds(result.getSeconds() + intervalObject.seconds * dir)
        }
        if (intervalObject.milliseconds) {
            result.setMilliseconds(value.getMilliseconds() + intervalObject.milliseconds * dir)
        }
        return result
    }
    var addInterval = function(value, interval, isNegative) {
        var dir = isNegative ? -1 : 1;
        return isDate(value) ? addDateInterval(value, interval, dir) : value + interval * dir
    };
    var getSequenceByInterval = function(min, max, interval) {
        var cur, intervals = [];
        intervals.push(isDate(min) ? new Date(min.getTime()) : min);
        cur = min;
        while (cur < max) {
            cur = addInterval(cur, interval);
            intervals.push(cur)
        }
        return intervals
    };
    var getViewFirstCellDate = function(viewType, date) {
        if ("month" === viewType) {
            return new Date(date.getFullYear(), date.getMonth(), 1)
        }
        if ("year" === viewType) {
            return new Date(date.getFullYear(), 0, date.getDate())
        }
        if ("decade" === viewType) {
            return new Date(getFirstYearInDecade(date), date.getMonth(), date.getDate())
        }
        if ("century" === viewType) {
            return new Date(getFirstDecadeInCentury(date), date.getMonth(), date.getDate())
        }
    };
    var getViewLastCellDate = function(viewType, date) {
        if ("month" === viewType) {
            return new Date(date.getFullYear(), date.getMonth(), getLastMonthDay(date))
        }
        if ("year" === viewType) {
            return new Date(date.getFullYear(), 11, date.getDate())
        }
        if ("decade" === viewType) {
            return new Date(getFirstYearInDecade(date) + 9, date.getMonth(), date.getDate())
        }
        if ("century" === viewType) {
            return new Date(getFirstDecadeInCentury(date) + 90, date.getMonth(), date.getDate())
        }
    };
    var getViewMinBoundaryDate = function(viewType, date) {
        var resultDate = new Date(date.getFullYear(), date.getMonth(), 1);
        if ("month" === viewType) {
            return resultDate
        }
        resultDate.setMonth(0);
        if ("year" === viewType) {
            return resultDate
        }
        if ("decade" === viewType) {
            resultDate.setFullYear(getFirstYearInDecade(date))
        }
        if ("century" === viewType) {
            resultDate.setFullYear(getFirstDecadeInCentury(date))
        }
        return resultDate
    };
    var getViewMaxBoundaryDate = function(viewType, date) {
        var resultDate = new Date(date.getFullYear(), date.getMonth(), getLastMonthDay(date));
        if ("month" === viewType) {
            return resultDate
        }
        resultDate.setMonth(11);
        resultDate.setDate(getLastMonthDay(resultDate));
        if ("year" === viewType) {
            return resultDate
        }
        if ("decade" === viewType) {
            resultDate.setFullYear(getFirstYearInDecade(date) + 9)
        }
        if ("century" === viewType) {
            resultDate.setFullYear(getFirstDecadeInCentury(date) + 99)
        }
        return resultDate
    };
    var getLastMonthDay = function(date) {
        var resultDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return resultDate.getDate()
    };
    var sameView = function(view, date1, date2) {
        return dateUtils[camelize("same " + view)](date1, date2)
    };
    var getViewUp = function(typeView) {
        switch (typeView) {
            case "month":
                return "year";
            case "year":
                return "decade";
            case "decade":
                return "century"
        }
    };
    var getViewDown = function(typeView) {
        switch (typeView) {
            case "century":
                return "decade";
            case "decade":
                return "year";
            case "year":
                return "month"
        }
    };
    var getDifferenceInMonth = function(typeView) {
        var difference = 1;
        if ("year" === typeView) {
            difference = 12
        }
        if ("decade" === typeView) {
            difference = 120
        }
        if ("century" === typeView) {
            difference = 1200
        }
        return difference
    };
    var getDifferenceInMonthForCells = function(typeView) {
        var difference = 1;
        if ("decade" === typeView) {
            difference = 12
        }
        if ("century" === typeView) {
            difference = 120
        }
        return difference
    };
    var getDateIntervalByString = function(intervalString) {
        var result = {};
        switch (intervalString) {
            case "year":
                result.years = 1;
                break;
            case "month":
                result.months = 1;
                break;
            case "quarter":
                result.months = 3;
                break;
            case "week":
                result.days = 7;
                break;
            case "day":
                result.days = 1;
                break;
            case "hour":
                result.hours = 1;
                break;
            case "minute":
                result.minutes = 1;
                break;
            case "second":
                result.seconds = 1;
                break;
            case "millisecond":
                result.milliseconds = 1
        }
        return result
    };
    var sameDate = function(date1, date2) {
        return sameMonthAndYear(date1, date2) && date1.getDate() === date2.getDate()
    };
    var sameMonthAndYear = function(date1, date2) {
        return sameYear(date1, date2) && date1.getMonth() === date2.getMonth()
    };
    var sameYear = function(date1, date2) {
        return date1 && date2 && date1.getFullYear() === date2.getFullYear()
    };
    var sameDecade = function(date1, date2) {
        if (!isDefined(date1) || !isDefined(date2)) {
            return
        }
        var startDecadeDate1 = date1.getFullYear() - date1.getFullYear() % 10,
            startDecadeDate2 = date2.getFullYear() - date2.getFullYear() % 10;
        return date1 && date2 && startDecadeDate1 === startDecadeDate2
    };
    var sameCentury = function(date1, date2) {
        if (!isDefined(date1) || !isDefined(date2)) {
            return
        }
        var startCenturyDate1 = date1.getFullYear() - date1.getFullYear() % 100,
            startCenturyDate2 = date2.getFullYear() - date2.getFullYear() % 100;
        return date1 && date2 && startCenturyDate1 === startCenturyDate2
    };
    var getFirstDecadeInCentury = function(date) {
        return date && date.getFullYear() - date.getFullYear() % 100
    };
    var getFirstYearInDecade = function(date) {
        return date && date.getFullYear() - date.getFullYear() % 10
    };
    var getShortDateFormat = function() {
        return "yyyy/M/d"
    };
    var getFirstMonthDate = function(date) {
        if (!isDefined(date)) {
            return
        }
        var newDate = new Date(date.getFullYear(), date.getMonth(), 1);
        return newDate
    };
    var getLastMonthDate = function(date) {
        if (!isDefined(date)) {
            return
        }
        var newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return newDate
    };
    var getFirstWeekDate = function(date, firstDayOfWeek) {
        var delta = (date.getDay() - firstDayOfWeek + 7) % 7;
        var result = new Date(date);
        result.setDate(date.getDate() - delta);
        return result
    };
    var normalizeDateByWeek = function(date, currentDate) {
        var differenceInDays = dateUtils.getDatesInterval(date, currentDate, "day"),
            resultDate = new Date(date);
        if (differenceInDays >= 6) {
            resultDate = new Date(resultDate.setDate(resultDate.getDate() + 7))
        }
        return resultDate
    };
    var dateInRange = function(date, min, max, format) {
        if ("date" === format) {
            min = min && new Date(min.getFullYear(), min.getMonth(), min.getDate());
            max = max && new Date(max.getFullYear(), max.getMonth(), max.getDate());
            date = date && new Date(date.getFullYear(), date.getMonth(), date.getDate())
        }
        return normalizeDate(date, min, max) === date
    };
    var normalizeDate = function(date, min, max) {
        var normalizedDate = date;
        if (!isDefined(date)) {
            return date
        }
        if (isDefined(min) && date < min) {
            normalizedDate = min
        }
        if (isDefined(max) && date > max) {
            normalizedDate = max
        }
        return normalizedDate
    };
    var fixTimezoneGap = function(oldDate, newDate) {
        if (!isDefined(oldDate)) {
            return
        }
        var sign, trial, diff = newDate.getHours() - oldDate.getHours();
        if (0 === diff) {
            return
        }
        sign = 1 === diff || diff === -23 ? -1 : 1, trial = new Date(newDate.getTime() + 36e5 * sign);
        if (sign > 0 || trial.getDate() === newDate.getDate()) {
            newDate.setTime(trial.getTime())
        }
    };
    var getTimezonesDifference = function(min, max) {
        return 60 * (max.getTimezoneOffset() - min.getTimezoneOffset()) * 1e3
    };
    var makeDate = function(date) {
        return new Date(date)
    };
    var NUMBER_SERIALIZATION_FORMAT = "number",
        DATE_SERIALIZATION_FORMAT = "yyyy'/'MM'/'dd",
        DATETIME_SERIALIZATION_FORMAT = "yyyy'/'MM'/'dd HH:mm:ss";
    var getDateSerializationFormat = function(value) {
        if (commonUtils.isNumber(value)) {
            return NUMBER_SERIALIZATION_FORMAT
        } else {
            if (commonUtils.isString(value)) {
                if (value.indexOf(":") >= 0) {
                    return DATETIME_SERIALIZATION_FORMAT
                } else {
                    return DATE_SERIALIZATION_FORMAT
                }
            }
        }
    };
    var deserializeDate = function(value, serializationFormat, localizationParseFunc) {
        var parsedValue;
        if (!serializationFormat || serializationFormat === NUMBER_SERIALIZATION_FORMAT || serializationFormat === DATE_SERIALIZATION_FORMAT || serializationFormat === DATETIME_SERIALIZATION_FORMAT) {
            parsedValue = serializationFormat === NUMBER_SERIALIZATION_FORMAT ? value : !isDate(value) && Date.parse(value);
            return parsedValue ? new Date(parsedValue) : value
        }
        if (void 0 !== value) {
            return localizationParseFunc(value, serializationFormat)
        }
    };
    var serializeDate = function(value, serializationFormat, localizationFormatFunc) {
        if (serializationFormat === NUMBER_SERIALIZATION_FORMAT) {
            return value && value.valueOf && value.valueOf()
        }
        if (serializationFormat) {
            return localizationFormatFunc(value, serializationFormat) || null
        }
        return value
    };
    var dateUtils = {
        dateUnitIntervals: dateUnitIntervals,
        convertMillisecondsToDateUnits: convertMillisecondsToDateUnits,
        dateToMilliseconds: dateToMilliseconds,
        getNextDateUnit: getNextDateUnit,
        convertDateUnitToMilliseconds: convertDateUnitToMilliseconds,
        getDateUnitInterval: getDateUnitInterval,
        getDateFormatByTickInterval: getDateFormatByTickInterval,
        getDatesDifferences: getDatesDifferences,
        correctDateWithUnitBeginning: correctDateWithUnitBeginning,
        trimTime: trimTime,
        addDateInterval: addDateInterval,
        addInterval: addInterval,
        getSequenceByInterval: getSequenceByInterval,
        getDateIntervalByString: getDateIntervalByString,
        sameDate: sameDate,
        sameMonthAndYear: sameMonthAndYear,
        sameMonth: sameMonthAndYear,
        sameYear: sameYear,
        sameDecade: sameDecade,
        sameCentury: sameCentury,
        sameView: sameView,
        getDifferenceInMonth: getDifferenceInMonth,
        getDifferenceInMonthForCells: getDifferenceInMonthForCells,
        getFirstYearInDecade: getFirstYearInDecade,
        getFirstDecadeInCentury: getFirstDecadeInCentury,
        getShortDateFormat: getShortDateFormat,
        getViewFirstCellDate: getViewFirstCellDate,
        getViewLastCellDate: getViewLastCellDate,
        getViewDown: getViewDown,
        getViewUp: getViewUp,
        getLastMonthDay: getLastMonthDay,
        getLastMonthDate: getLastMonthDate,
        getFirstMonthDate: getFirstMonthDate,
        getFirstWeekDate: getFirstWeekDate,
        normalizeDateByWeek: normalizeDateByWeek,
        getQuarter: getQuarter,
        getFirstQuarterMonth: getFirstQuarterMonth,
        dateInRange: dateInRange,
        normalizeDate: normalizeDate,
        getViewMinBoundaryDate: getViewMinBoundaryDate,
        getViewMaxBoundaryDate: getViewMaxBoundaryDate,
        fixTimezoneGap: fixTimezoneGap,
        getTimezonesDifference: getTimezonesDifference,
        makeDate: makeDate,
        deserializeDate: deserializeDate,
        serializeDate: serializeDate,
        getDateSerializationFormat: getDateSerializationFormat,
        getDatesInterval: getDatesInterval
    };
    module.exports = dateUtils
});
