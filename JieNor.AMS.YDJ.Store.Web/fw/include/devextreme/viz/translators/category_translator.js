/** 
 * DevExtreme (viz/translators/category_translator.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var commonUtils = require("../../core/utils/common"),
        isDefined = commonUtils.isDefined,
        round = Math.round;
    module.exports = {
        translate: function(category, directionOffset) {
            var stickDelta, that = this,
                canvasOptions = that._canvasOptions,
                categoryIndex = that._categoriesToPoints[category],
                specialValue = that.translateSpecialCase(category),
                startPointIndex = canvasOptions.startPointIndex || 0,
                stickInterval = that._businessRange.stick ? 0 : .5;
            if (isDefined(specialValue)) {
                return specialValue
            }
            if (!categoryIndex && 0 !== categoryIndex) {
                return null
            }
            directionOffset = directionOffset || 0;
            stickDelta = categoryIndex + stickInterval - startPointIndex + .5 * directionOffset;
            return round(that._calculateProjection(canvasOptions.interval * stickDelta))
        },
        untranslate: function(pos, directionOffset, enableOutOfCanvas) {
            var that = this,
                canvasOptions = that._canvasOptions,
                startPoint = canvasOptions.startPoint,
                categories = that.visibleCategories || that._categories,
                categoriesLength = categories.length,
                result = 0,
                stickInterval = that._businessRange.stick ? .5 : 0;
            if (!enableOutOfCanvas && (pos < startPoint || pos > canvasOptions.endPoint)) {
                return null
            }
            directionOffset = directionOffset || 0;
            result = round((pos - startPoint) / canvasOptions.interval + stickInterval - .5 - .5 * directionOffset);
            if (categoriesLength === result) {
                result--
            }
            if (result === -1) {
                result = 0
            }
            if (canvasOptions.invert) {
                result = categoriesLength - result - 1
            }
            return categories[result]
        },
        getInterval: function() {
            return this._canvasOptions.interval
        },
        zoom: function(translate, scale) {
            var endCategoryIndex, newVisibleCategories, newInterval, that = this,
                canvasOptions = that._canvasOptions,
                stick = that._businessRange.stick,
                invert = canvasOptions.invert,
                interval = canvasOptions.interval * scale,
                translateCategories = translate / interval,
                startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + translateCategories + .5),
                categoriesLength = parseInt(canvasOptions.canvasLength / interval + (stick ? 1 : 0)) || 1,
                categories = that._categories;
            if (invert) {
                startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + (that.visibleCategories || []).length - translateCategories + .5) - categoriesLength
            }
            if (startCategoryIndex < 0) {
                startCategoryIndex = 0
            }
            endCategoryIndex = startCategoryIndex + categoriesLength;
            if (endCategoryIndex > categories.length) {
                endCategoryIndex = categories.length;
                startCategoryIndex = endCategoryIndex - categoriesLength;
                if (startCategoryIndex < 0) {
                    startCategoryIndex = 0
                }
            }
            newVisibleCategories = categories.slice(parseInt(startCategoryIndex), parseInt(endCategoryIndex));
            newInterval = that._getDiscreteInterval(newVisibleCategories.length, canvasOptions);
            scale = newInterval / canvasOptions.interval;
            translate = that.translate(!invert ? newVisibleCategories[0] : newVisibleCategories[newVisibleCategories.length - 1]) * scale - (canvasOptions.startPoint + (stick ? 0 : newInterval / 2));
            return {
                min: newVisibleCategories[0],
                max: newVisibleCategories[newVisibleCategories.length - 1],
                translate: translate,
                scale: scale
            }
        },
        getMinScale: function(zoom) {
            var that = this,
                canvasOptions = that._canvasOptions,
                categoriesLength = (that.visibleCategories || that._categories).length;
            categoriesLength += (parseInt(.1 * categoriesLength) || 1) * (zoom ? -2 : 2);
            return canvasOptions.canvasLength / (Math.max(categoriesLength, 1) * canvasOptions.interval)
        },
        getScale: function(min, max) {
            var that = this,
                canvasOptions = that._canvasOptions,
                visibleArea = that.getCanvasVisibleArea(),
                stickOffset = !that._businessRange.stick && 1,
                minPoint = that.translate(min, -stickOffset),
                maxPoint = that.translate(max, +stickOffset);
            if (!isDefined(minPoint)) {
                minPoint = canvasOptions.invert ? visibleArea.max : visibleArea.min
            }
            if (!isDefined(maxPoint)) {
                maxPoint = canvasOptions.invert ? visibleArea.min : visibleArea.max
            }
            return that.canvasLength / Math.abs(maxPoint - minPoint)
        },
        isValid: function(value) {
            return this._categoriesToPoints[value] >= 0
        },
        parse: function(value) {
            return value
        },
        to: function(value, direction) {
            var canvasOptions = this._canvasOptions,
                businessRange = this._businessRange,
                categoryIndex = this._categoriesToPoints[value],
                startPointIndex = canvasOptions.startPointIndex || 0,
                stickInterval = businessRange.stick ? 0 : .5,
                stickDelta = categoryIndex + stickInterval - startPointIndex + (businessRange.invert ? -1 : 1) * direction * .5;
            return round(this._calculateProjection(canvasOptions.interval * stickDelta))
        },
        from: function(position, direction) {
            var canvasOptions = this._canvasOptions,
                businessRange = this._businessRange,
                startPoint = canvasOptions.startPoint,
                categories = this._categories,
                categoriesLength = categories.length,
                stickInterval = businessRange.stick ? .5 : 0,
                result = round((position - startPoint) / canvasOptions.interval + stickInterval - .5 - .5 * direction);
            if (categoriesLength === result) {
                result--
            }
            if (result === -1) {
                result = 0
            }
            if (canvasOptions.invert) {
                result = categoriesLength - result - 1
            }
            return categories[result]
        },
        _add: function(value, diff, coeff) {
            return NaN
        },
        isValueProlonged: true
    }
});
