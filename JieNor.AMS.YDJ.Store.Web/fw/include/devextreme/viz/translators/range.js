/** 
 * DevExtreme (viz/translators/range.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var _Range, $ = require("jquery"),
        commonUtils = require("../../core/utils/common"),
        _isDefined = commonUtils.isDefined,
        _isDate = commonUtils.isDate,
        unique = require("../core/utils").unique,
        minSelector = "min",
        maxSelector = "max",
        minVisibleSelector = "minVisible",
        maxVisibleSelector = "maxVisible",
        baseSelector = "base",
        axisTypeSelector = "axisType";

    function otherLessThan(thisValue, otherValue) {
        return otherValue < thisValue
    }

    function otherGreaterThan(thisValue, otherValue) {
        return otherValue > thisValue
    }

    function compareAndReplace(thisValue, otherValue, setValue, compare) {
        var otherValueDefined = _isDefined(otherValue);
        if (_isDefined(thisValue)) {
            if (otherValueDefined && compare(thisValue, otherValue)) {
                setValue(otherValue)
            }
        } else {
            if (otherValueDefined) {
                setValue(otherValue)
            }
        }
    }
    _Range = exports.Range = function(range) {
        range && $.extend(this, range)
    };
    _Range.prototype = {
        constructor: _Range,
        addRange: function(otherRange) {
            var that = this,
                categories = that.categories,
                otherCategories = otherRange.categories;
            var compareAndReplaceByField = function(field, compare) {
                compareAndReplace(that[field], otherRange[field], function(value) {
                    that[field] = value
                }, compare)
            };
            var controlValuesByVisibleBounds = function(valueField, visibleValueField, compare) {
                compareAndReplace(that[valueField], that[visibleValueField], function(value) {
                    _isDefined(that[valueField]) && (that[valueField] = value)
                }, compare)
            };
            var checkField = function(field) {
                that[field] = that[field] || otherRange[field]
            };
            if (commonUtils.isDefined(otherRange.stick)) {
                that.stick = otherRange.stick
            }
            checkField("addSpiderCategory");
            checkField("percentStick");
            checkField("minSpaceCorrection");
            checkField("maxSpaceCorrection");
            checkField("invert");
            checkField(axisTypeSelector);
            checkField("dataType");
            if ("logarithmic" === that[axisTypeSelector]) {
                checkField(baseSelector)
            } else {
                that[baseSelector] = void 0
            }
            compareAndReplaceByField(minSelector, otherLessThan);
            compareAndReplaceByField(maxSelector, otherGreaterThan);
            if ("discrete" === that[axisTypeSelector]) {
                checkField(minVisibleSelector);
                checkField(maxVisibleSelector)
            } else {
                compareAndReplaceByField(minVisibleSelector, otherLessThan);
                compareAndReplaceByField(maxVisibleSelector, otherGreaterThan)
            }
            compareAndReplaceByField("interval", otherLessThan);
            controlValuesByVisibleBounds(minSelector, minVisibleSelector, otherLessThan);
            controlValuesByVisibleBounds(minSelector, maxVisibleSelector, otherLessThan);
            controlValuesByVisibleBounds(maxSelector, maxVisibleSelector, otherGreaterThan);
            controlValuesByVisibleBounds(maxSelector, minVisibleSelector, otherGreaterThan);
            if (void 0 === categories) {
                that.categories = otherCategories
            } else {
                that.categories = otherCategories ? unique(categories.concat(otherCategories)) : categories
            }
            return that
        },
        isDefined: function() {
            return _isDefined(this[minSelector]) && _isDefined(this[maxSelector]) || this.categories && this.categories.length
        },
        setStubData: function(dataType) {
            var that = this,
                year = (new Date).getFullYear() - 1,
                isDate = "datetime" === dataType,
                axisType = that[axisTypeSelector],
                min = "logarithmic" === axisType ? 1 : 0;
            if ("discrete" === axisType) {
                that.categories = ["0", "1", "2"]
            } else {
                that[minSelector] = isDate ? new Date(year, 0, 1) : min;
                that[maxSelector] = isDate ? new Date(year, 11, 31) : 10
            }
            that.stubData = true;
            return that
        },
        correctValueZeroLevel: function() {
            var that = this;
            if ("logarithmic" === that[axisTypeSelector] || _isDate(that[maxSelector]) || _isDate(that[minSelector])) {
                return that
            }

            function setZeroLevel(min, max) {
                that[min] < 0 && that[max] < 0 && (that[max] = 0);
                that[min] > 0 && that[max] > 0 && (that[min] = 0)
            }
            setZeroLevel(minSelector, maxSelector);
            setZeroLevel(minVisibleSelector, maxVisibleSelector);
            return that
        },
        sortCategories: function(arr) {
            var cat = this.categories;
            arr && cat && (this.categories = arr.filter(function(item) {
                return cat.indexOf(item) !== -1
            }))
        },
        checkZeroStick: function() {
            var that = this;
            if (that.min >= 0 && that.max >= 0) {
                that.minStickValue = 0
            } else {
                if (that.min <= 0 && that.max <= 0) {
                    that.maxStickValue = 0
                }
            }
            return that
        }
    }
});
