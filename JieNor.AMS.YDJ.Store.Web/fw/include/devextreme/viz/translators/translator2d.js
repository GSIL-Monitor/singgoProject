/** 
 * DevExtreme (viz/translators/translator2d.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var _Translator2d, $ = require("jquery"),
        numericTranslator = require("./numeric_translator"),
        categoryTranslator = require("./category_translator"),
        intervalTranslator = require("./interval_translator"),
        datetimeTranslator = require("./datetime_translator"),
        logarithmicTranslator = require("./logarithmic_translator"),
        vizUtils = require("../core/utils"),
        commonUtils = require("../../core/utils/common"),
        getLog = vizUtils.getLog,
        getPower = vizUtils.getPower,
        isDefined = commonUtils.isDefined,
        _abs = Math.abs,
        CANVAS_PROP = ["width", "height", "left", "top", "bottom", "right"],
        NUMBER_EQUALITY_CORRECTION = 1,
        DATETIME_EQUALITY_CORRECTION = 6e4,
        _noop = $.noop,
        addInterval = require("../../core/utils/date").addInterval;
    var validateCanvas = function(canvas) {
        $.each(CANVAS_PROP, function(_, prop) {
            canvas[prop] = parseInt(canvas[prop]) || 0
        });
        return canvas
    };
    var makeCategoriesToPoints = function(categories) {
        var categoriesToPoints = {},
            length = categories.length,
            i = 0;
        for (; i < length; i++) {
            categoriesToPoints[categories[i]] = i
        }
        return categoriesToPoints
    };
    var validateBusinessRange = function(businessRange) {
        function validate(valueSelector, baseValueSelector) {
            if (!isDefined(businessRange[valueSelector]) && isDefined(businessRange[baseValueSelector])) {
                businessRange[valueSelector] = businessRange[baseValueSelector]
            }
        }
        validate("minVisible", "min");
        validate("maxVisible", "max");
        return businessRange
    };

    function valuesIsDefinedAndEqual(val1, val2) {
        return isDefined(val1) && isDefined(val2) && val1.valueOf() === val2.valueOf()
    }

    function getCanvasBounds(range) {
        var newMin, newMax, min = range.min,
            max = range.max,
            minVisible = range.minVisible,
            maxVisible = range.maxVisible,
            base = range.base,
            isDateTime = commonUtils.isDate(max) || commonUtils.isDate(min),
            correction = isDateTime ? DATETIME_EQUALITY_CORRECTION : NUMBER_EQUALITY_CORRECTION,
            isLogarithmic = "logarithmic" === range.axisType;
        if (isLogarithmic) {
            maxVisible = getLog(maxVisible, base);
            minVisible = getLog(minVisible, base);
            min = getLog(min, base);
            max = getLog(max, base)
        }
        if (valuesIsDefinedAndEqual(min, max)) {
            newMin = min.valueOf() - correction;
            newMax = max.valueOf() + correction;
            if (isDateTime) {
                min = new Date(newMin);
                max = new Date(newMax)
            } else {
                min = 0 !== min || isLogarithmic ? newMin : 0;
                max = newMax
            }
        }
        if (valuesIsDefinedAndEqual(minVisible, maxVisible)) {
            newMin = minVisible.valueOf() - correction;
            newMax = maxVisible.valueOf() + correction;
            if (isDateTime) {
                minVisible = newMin < min.valueOf() ? min : new Date(newMin);
                maxVisible = newMax > max.valueOf() ? max : new Date(newMax)
            } else {
                if (0 !== minVisible || isLogarithmic) {
                    minVisible = newMin < min ? min : newMin
                }
                maxVisible = newMax > max ? max : newMax
            }
        }
        return {
            base: base,
            rangeMin: min,
            rangeMax: max,
            rangeMinVisible: minVisible,
            rangeMaxVisible: maxVisible
        }
    }
    exports.Translator2D = _Translator2d = function(businessRange, canvas, options) {
        this.update(businessRange, canvas, options)
    };
    _Translator2d.prototype = {
        constructor: _Translator2d,
        reinit: function() {
            var that = this,
                range = that._businessRange,
                categories = range.categories || [],
                script = {},
                canvasOptions = that._prepareCanvasOptions(),
                visibleCategories = vizUtils.getCategoriesInfo(categories, range.minVisible, range.maxVisible).categories,
                categoriesLength = (visibleCategories || categories).length;
            switch (range.axisType) {
                case "logarithmic":
                    script = logarithmicTranslator;
                    break;
                case "semidiscrete":
                    script = intervalTranslator;
                    canvasOptions.ratioOfCanvasRange = canvasOptions.canvasLength / (addInterval(canvasOptions.rangeMaxVisible, that._options.interval) - canvasOptions.rangeMinVisible);
                    break;
                case "discrete":
                    script = categoryTranslator;
                    that._categories = categories;
                    canvasOptions.interval = that._getDiscreteInterval(range.addSpiderCategory ? categoriesLength + 1 : categoriesLength, canvasOptions);
                    that._categoriesToPoints = makeCategoriesToPoints(categories, canvasOptions.invert);
                    if (visibleCategories && categoriesLength) {
                        canvasOptions.startPointIndex = that._categoriesToPoints[visibleCategories[0]];
                        that.visibleCategories = visibleCategories
                    }
                    break;
                default:
                    if ("datetime" === range.dataType) {
                        script = datetimeTranslator
                    } else {
                        script = numericTranslator
                    }
            }
            $.extend(that, script);
            that._conversionValue = that._options.conversionValue ? function(value) {
                return value
            } : function(value) {
                return Math.round(value)
            };
            that._calculateSpecialValues()
        },
        _getDiscreteInterval: function(categoriesLength, canvasOptions) {
            var correctedCategoriesCount = categoriesLength - (this._businessRange.stick ? 1 : 0);
            return correctedCategoriesCount > 0 ? canvasOptions.canvasLength / correctedCategoriesCount : canvasOptions.canvasLength
        },
        _prepareCanvasOptions: function() {
            var length, that = this,
                businessRange = that._businessRange,
                canvasOptions = that._canvasOptions = getCanvasBounds(businessRange),
                canvas = that._canvas;
            if (that._options.isHorizontal) {
                canvasOptions.startPoint = canvas.left;
                length = canvas.width;
                canvasOptions.endPoint = canvas.width - canvas.right;
                canvasOptions.invert = businessRange.invert
            } else {
                canvasOptions.startPoint = canvas.top;
                length = canvas.height;
                canvasOptions.endPoint = canvas.height - canvas.bottom;
                canvasOptions.invert = !businessRange.invert
            }
            that.canvasLength = canvasOptions.canvasLength = canvasOptions.endPoint - canvasOptions.startPoint;
            canvasOptions.rangeDoubleError = Math.pow(10, getPower(canvasOptions.rangeMax - canvasOptions.rangeMin) - getPower(length) - 2);
            canvasOptions.ratioOfCanvasRange = canvasOptions.canvasLength / (canvasOptions.rangeMaxVisible - canvasOptions.rangeMinVisible);
            return canvasOptions
        },
        updateCanvas: function(canvas) {
            this._canvas = validateCanvas(canvas);
            this.reinit()
        },
        updateBusinessRange: function(businessRange) {
            this._businessRange = validateBusinessRange(businessRange);
            this.reinit()
        },
        update: function(businessRange, canvas, options) {
            var that = this;
            that._options = $.extend(that._options || {}, options);
            that._canvas = validateCanvas(canvas);
            that.updateBusinessRange(businessRange)
        },
        getBusinessRange: function() {
            return this._businessRange
        },
        getCanvasVisibleArea: function() {
            return {
                min: this._canvasOptions.startPoint,
                max: this._canvasOptions.endPoint
            }
        },
        _calculateSpecialValues: function() {
            var invert, canvas_position_default, canvas_position_center_middle, that = this,
                canvasOptions = that._canvasOptions,
                startPoint = canvasOptions.startPoint,
                endPoint = canvasOptions.endPoint,
                range = that._businessRange,
                minVisible = range.minVisible,
                maxVisible = range.maxVisible;
            if (minVisible <= 0 && maxVisible >= 0) {
                that.sc = {};
                canvas_position_default = that.translate(0)
            } else {
                invert = range.invert ^ (minVisible <= 0 && maxVisible <= 0);
                if (that._options.isHorizontal) {
                    canvas_position_default = invert ? endPoint : startPoint
                } else {
                    canvas_position_default = invert ? startPoint : endPoint
                }
            }
            canvas_position_center_middle = startPoint + canvasOptions.canvasLength / 2;
            that.sc = {
                canvas_position_default: canvas_position_default,
                canvas_position_left: startPoint,
                canvas_position_top: startPoint,
                canvas_position_center: canvas_position_center_middle,
                canvas_position_middle: canvas_position_center_middle,
                canvas_position_right: endPoint,
                canvas_position_bottom: endPoint,
                canvas_position_start: canvasOptions.invert ? endPoint : startPoint,
                canvas_position_end: canvasOptions.invert ? startPoint : endPoint
            }
        },
        translateSpecialCase: function(value) {
            return this.sc[value]
        },
        _calculateProjection: function(distance) {
            var canvasOptions = this._canvasOptions;
            return canvasOptions.invert ? canvasOptions.endPoint - distance : canvasOptions.startPoint + distance
        },
        _calculateUnProjection: function(distance) {
            var canvasOptions = this._canvasOptions;
            return canvasOptions.invert ? canvasOptions.rangeMaxVisible.valueOf() - distance : canvasOptions.rangeMinVisible.valueOf() + distance
        },
        getVisibleCategories: function() {
            return this.visibleCategories
        },
        getMinBarSize: function(minBarSize) {
            var visibleArea = this.getCanvasVisibleArea(),
                minValue = this.untranslate(visibleArea.min + minBarSize);
            return _abs(this.untranslate(visibleArea.min) - (!isDefined(minValue) ? this.untranslate(visibleArea.max) : minValue))
        },
        translate: _noop,
        untranslate: _noop,
        getInterval: _noop,
        zoom: _noop,
        getMinScale: _noop,
        getRange: function() {
            return [this.untranslate(this._canvasOptions.startPoint, -1), this.untranslate(this._canvasOptions.endPoint, 1)]
        },
        isEmptyValueRange: function() {
            return this._businessRange.stubData
        },
        getScreenRange: function() {
            return [this._canvasOptions.startPoint, this._canvasOptions.endPoint]
        },
        add: function(value, diff, dir) {
            return this._add(value, diff, (this._businessRange.invert ? -1 : 1) * dir)
        }
    }
});
