/** 
 * DevExtreme (viz/series/bubble_series.js)
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
        lineSeries = require("./line_series").chart.line,
        scatterSeries = require("./scatter_series").chart,
        areaSeries = require("./area_series").chart.area,
        barSeries = require("./bar_series"),
        chartBarSeries = barSeries.chart.bar,
        polarBarSeries = barSeries.polar.bar,
        commonUtils = require("../../core/utils/common"),
        _isDefined = commonUtils.isDefined,
        _extend = $.extend,
        _each = $.each,
        _noop = $.noop;
    exports.chart = {};
    exports.chart.bubble = _extend({}, scatterSeries, {
        _fillErrorBars: _noop,
        getErrorBarRangeCorrector: _noop,
        _calculateErrorBars: _noop,
        _getMainColor: chartBarSeries._getMainColor,
        _createPointStyles: chartBarSeries._createPointStyles,
        _createPattern: chartBarSeries._createPattern,
        _updatePointsVisibility: chartBarSeries._updatePointsVisibility,
        _getOptionsForPoint: chartBarSeries._getOptionsForPoint,
        _getSpecialColor: chartBarSeries._getSpecialColor,
        _applyMarkerClipRect: lineSeries._applyElementsClipRect,
        _parsePointStyle: polarBarSeries._parsePointStyle,
        _createLegendState: areaSeries._createLegendState,
        _setMarkerGroupSettings: polarBarSeries._setMarkerGroupSettings,
        areErrorBarsVisible: _noop,
        _createErrorBarGroup: _noop,
        _checkData: function(data) {
            return _isDefined(data.argument) && _isDefined(data.size) && void 0 !== data.value
        },
        _getPointData: function(data, options) {
            var pointData = scatterSeries._getPointData.call(this, data, options);
            pointData.size = data[options.sizeField || "size"];
            return pointData
        },
        _fusionPoints: function(fusionPoints, tick) {
            var calcMedianValue = scatterSeries._calcMedianValue;
            return {
                size: calcMedianValue.call(this, fusionPoints, "size"),
                value: calcMedianValue.call(this, fusionPoints, "value"),
                argument: tick,
                tag: null
            }
        },
        getValueFields: function() {
            return [this._options.valueField || "val"]
        },
        getSizeField: function() {
            return this._options.sizeField || "size"
        },
        updateTemplateFieldNames: function() {
            var that = this,
                options = that._options,
                name = that.name;
            options.valueField = that.getValueFields()[0] + name;
            options.sizeField = that.getSizeField() + name;
            options.tagField = that.getTagField() + name
        },
        _clearingAnimation: function(translators, drawComplete) {
            var that = this,
                partitionDuration = .5,
                lastPointIndex = that._drawnPoints.length - 1,
                labelsGroup = that._labelsGroup;
            labelsGroup && labelsGroup.animate({
                opacity: .001
            }, {
                duration: that._defaultDuration,
                partitionDuration: partitionDuration
            }, function() {
                _each(that._drawnPoints || [], function(i, p) {
                    p.animate(i === lastPointIndex ? drawComplete : void 0, {
                        r: 0
                    }, partitionDuration)
                })
            })
        },
        _animate: function() {
            var that = this,
                lastPointIndex = that._drawnPoints.length - 1,
                labelsGroup = that._labelsGroup,
                labelAnimFunc = function() {
                    labelsGroup && labelsGroup.animate({
                        opacity: 1
                    }, {
                        duration: that._defaultDuration
                    })
                };
            _each(that._drawnPoints || [], function(i, p) {
                p.animate(i === lastPointIndex ? labelAnimFunc : void 0, {
                    r: p.bubbleSize,
                    translateX: p.x,
                    translateY: p.y
                })
            })
        },
        _beginUpdateData: chartBarSeries._beginUpdateData
    })
});
