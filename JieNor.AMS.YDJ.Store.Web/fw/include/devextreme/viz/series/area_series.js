/** 
 * DevExtreme (viz/series/area_series.js)
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
        objectUtils = require("../../core/utils/object"),
        commonUtils = require("../../core/utils/common"),
        rangeCalculator = require("./helpers/range_data_calculator"),
        Color = require("../../color"),
        scatterSeries = require("./scatter_series").chart,
        lineSeries = require("./line_series"),
        chartLineSeries = lineSeries.chart.line,
        polarLineSeries = lineSeries.polar.line,
        _map = require("../core/utils").map,
        _extend = $.extend,
        HOVER_COLOR_HIGHLIGHTING = 20;
    exports.chart = {};
    exports.polar = {};
    var baseAreaMethods = {
        _createBorderElement: chartLineSeries._createMainElement,
        _createLegendState: function(styleOptions, defaultColor) {
            var legendState = scatterSeries._createLegendState.call(this, styleOptions, defaultColor);
            legendState.opacity = styleOptions.opacity;
            return legendState
        },
        _getSpecialColor: function(color) {
            return this._options._IE8 ? new Color(color).highlight(HOVER_COLOR_HIGHLIGHTING) : color
        },
        _getRangeData: function(zoomArgs, calcIntervalFunction) {
            rangeCalculator.calculateRangeData(this, zoomArgs, calcIntervalFunction);
            rangeCalculator.addLabelPaddings(this);
            rangeCalculator.calculateRangeMinValue(this, zoomArgs);
            return this._rangeData
        },
        _getDefaultSegment: function(segment) {
            var defaultSegment = chartLineSeries._getDefaultSegment(segment);
            defaultSegment.area = defaultSegment.line.concat(defaultSegment.line.slice().reverse());
            return defaultSegment
        },
        _updateElement: function(element, segment, animate, animateParams, complete) {
            var lineParams = {
                    points: segment.line
                },
                areaParams = {
                    points: segment.area
                },
                borderElement = element.line;
            if (animate) {
                borderElement && borderElement.animate(lineParams, animateParams);
                element.area.animate(areaParams, animateParams, complete)
            } else {
                borderElement && borderElement.attr(lineParams);
                element.area.attr(areaParams)
            }
        },
        _removeElement: function(element) {
            element.line && element.line.remove();
            element.area.remove()
        },
        _drawElement: function(segment) {
            return {
                line: this._bordersGroup && this._createBorderElement(segment.line, {
                    "stroke-width": this._styles.normal.border["stroke-width"]
                }).append(this._bordersGroup),
                area: this._createMainElement(segment.area).append(this._elementsGroup)
            }
        },
        _applyStyle: function(style) {
            var that = this;
            that._elementsGroup && that._elementsGroup.attr(style.elements);
            that._bordersGroup && that._bordersGroup.attr(style.border);
            $.each(that._graphics || [], function(_, graphic) {
                graphic.line && graphic.line.attr({
                    "stroke-width": style.border["stroke-width"]
                }).sharp()
            })
        },
        _createPattern: function(color, hatching) {
            if (hatching && commonUtils.isObject(hatching)) {
                var pattern = this._renderer.pattern(color, hatching);
                this._patterns.push(pattern);
                return pattern.id
            }
            return color
        },
        _parseStyle: function(options, defaultColor, defaultBorderColor) {
            var borderOptions = options.border || {},
                borderStyle = chartLineSeries._parseLineOptions(borderOptions, defaultBorderColor);
            borderStyle["stroke-width"] = borderOptions.visible ? borderStyle["stroke-width"] : 0;
            return {
                border: borderStyle,
                elements: {
                    stroke: "none",
                    fill: this._createPattern(options.color || defaultColor, options.hatching),
                    opacity: options.opacity
                }
            }
        },
        _areBordersVisible: function() {
            var options = this._options;
            return options.border.visible || options.hoverStyle.border.visible || options.selectionStyle.border.visible
        },
        _createMainElement: function(points, settings) {
            return this._renderer.path(points, "area").attr(settings)
        },
        _getTrackerSettings: function(segment) {
            return {
                "stroke-width": segment.singlePointSegment ? this._defaultTrackerWidth : 0
            }
        },
        _getMainPointsFromSegment: function(segment) {
            return segment.area
        }
    };
    exports.chart.area = _extend({}, chartLineSeries, baseAreaMethods, {
        _prepareSegment: function(points, rotated) {
            var processedPoints = this._processSinglePointsAreaSegment(points, rotated);
            return {
                line: processedPoints,
                area: _map(processedPoints, function(pt) {
                    return pt.getCoords()
                }).concat(_map(processedPoints.slice().reverse(), function(pt) {
                    return pt.getCoords(true)
                })),
                singlePointSegment: processedPoints !== points
            }
        },
        _processSinglePointsAreaSegment: function(points, rotated) {
            if (1 === points.length) {
                var p = points[0],
                    p1 = objectUtils.clone(p);
                p1[rotated ? "y" : "x"] += 1;
                p1.argument = null;
                return [p, p1]
            }
            return points
        }
    });
    exports.polar.area = _extend({}, polarLineSeries, baseAreaMethods, {
        _prepareSegment: function(points, rotated, lastSegment) {
            lastSegment && polarLineSeries._closeSegment.call(this, points);
            var preparedPoints = exports.chart.area._prepareSegment.call(this, points);
            return preparedPoints
        },
        _processSinglePointsAreaSegment: function(points) {
            return lineSeries.polar.line._prepareSegment.call(this, points).line
        }
    });
    exports.chart.steparea = _extend({}, exports.chart.area, {
        _prepareSegment: function(points, rotated) {
            points = exports.chart.area._processSinglePointsAreaSegment(points, rotated);
            return exports.chart.area._prepareSegment.call(this, lineSeries.chart.stepline._calculateStepLinePoints(points))
        }
    });
    exports.chart.splinearea = _extend({}, exports.chart.area, {
        _areaPointsToSplineAreaPoints: function(areaPoints) {
            var lastFwPoint = areaPoints[areaPoints.length / 2 - 1],
                firstBwPoint = areaPoints[areaPoints.length / 2];
            areaPoints.splice(areaPoints.length / 2, 0, {
                x: lastFwPoint.x,
                y: lastFwPoint.y
            }, {
                x: firstBwPoint.x,
                y: firstBwPoint.y
            })
        },
        _prepareSegment: function(points, rotated) {
            var areaSeries = exports.chart.area,
                processedPoints = areaSeries._processSinglePointsAreaSegment(points, rotated),
                areaSegment = areaSeries._prepareSegment.call(this, lineSeries.chart.spline._calculateBezierPoints(processedPoints, rotated));
            this._areaPointsToSplineAreaPoints(areaSegment.area);
            areaSegment.singlePointSegment = processedPoints !== points;
            return areaSegment
        },
        _getDefaultSegment: function(segment) {
            var areaDefaultSegment = exports.chart.area._getDefaultSegment(segment);
            this._areaPointsToSplineAreaPoints(areaDefaultSegment.area);
            return areaDefaultSegment
        },
        _createMainElement: function(points, settings) {
            return this._renderer.path(points, "bezierarea").attr(settings)
        },
        _createBorderElement: lineSeries.chart.spline._createMainElement
    })
});
