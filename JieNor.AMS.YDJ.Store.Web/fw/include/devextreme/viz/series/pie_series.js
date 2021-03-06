/** 
 * DevExtreme (viz/series/pie_series.js)
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
        scatterSeries = require("./scatter_series"),
        vizUtils = require("../core/utils"),
        chartScatterSeries = scatterSeries.chart,
        barSeries = require("./bar_series").chart.bar,
        _extend = $.extend,
        _each = $.each,
        _noop = $.noop,
        _map = vizUtils.map,
        _isFinite = isFinite,
        _max = Math.max,
        INSIDE = "inside";
    exports.pie = _extend({}, barSeries, {
        _setGroupsSettings: chartScatterSeries._setGroupsSettings,
        _createErrorBarGroup: _noop,
        _drawPoint: function(options) {
            var point = options.point,
                legendCallback = options.legendCallback;
            chartScatterSeries._drawPoint.call(this, options);
            !point.isVisible() && point.setInvisibility();
            legendCallback && point.isSelected() && legendCallback(point)("applySelected")
        },
        adjustLabels: function() {
            var maxLabelLength, that = this,
                points = that._points || [],
                labelsBBoxes = [];
            _each(points, function(_, point) {
                if (point._label.isVisible()) {
                    point.setLabelTrackerData();
                    if (point._label.getLayoutOptions().position !== INSIDE) {
                        point.setLabelEllipsis();
                        labelsBBoxes.push(point._label.getBoundingRect().width)
                    }
                }
            });
            if (labelsBBoxes.length) {
                maxLabelLength = _max.apply(null, labelsBBoxes)
            }
            _each(points, function(_, point) {
                if (point._label.isVisible() && point._label.getLayoutOptions().position !== INSIDE) {
                    point.setMaxLabelLength(maxLabelLength);
                    point.updateLabelCoord()
                }
            })
        },
        _processRange: _noop,
        _applyElementsClipRect: _noop,
        getColor: _noop,
        areErrorBarsVisible: _noop,
        _prepareSeriesToDrawing: _noop,
        _endUpdateData: function() {
            this._arrayArguments = {};
            chartScatterSeries._prepareSeriesToDrawing.call(this)
        },
        drawLabelsWOPoints: function(translators) {
            var that = this,
                options = that._options,
                points = that._points || [];
            if (options.label.position === INSIDE) {
                return false
            }
            that._labelsGroup.append(that._extGroups.labelsGroup);
            _each(points, function(_, point) {
                point.drawLabel(translators)
            });
            return true
        },
        _getCreatingPointOptions: function(data) {
            return this._getPointOptions(data)
        },
        _updateOptions: function(options) {
            this.labelSpace = 0;
            this.innerRadius = "pie" === this.type ? 0 : options.innerRadius
        },
        _checkData: function(data) {
            var base = barSeries._checkData(data);
            return this._options.paintNullPoints ? base : base && null !== data.value
        },
        _createGroups: chartScatterSeries._createGroups,
        _setMarkerGroupSettings: function() {
            var that = this;
            that._markersGroup.attr({
                "class": "dxc-markers"
            })
        },
        _getMainColor: function(data) {
            var that = this,
                arr = that._arrayArguments || {},
                argument = data.argument;
            arr[argument] = ++arr[argument] || 0;
            that._arrayArguments = arr;
            return that._options.mainSeriesColor(argument, arr[argument])
        },
        _getPointOptions: function(data) {
            return this._parsePointOptions(this._preparePointOptions(), this._options.label, data)
        },
        _getRangeData: function() {
            return this._rangeData
        },
        _getArrangeTotal: function(points) {
            var total = 0;
            _each(points, function(_, point) {
                if (point.isVisible()) {
                    total += point.initialValue
                }
            });
            return total
        },
        _createPointStyles: function(pointOptions, data) {
            var that = this,
                mainColor = pointOptions.color || that._getMainColor(data),
                specialMainColor = that._getSpecialColor(mainColor);
            return {
                normal: that._parsePointStyle(pointOptions, mainColor, mainColor),
                hover: that._parsePointStyle(pointOptions.hoverStyle, specialMainColor, mainColor),
                selection: that._parsePointStyle(pointOptions.selectionStyle, specialMainColor, mainColor),
                legendStyles: {
                    normal: that._createLegendState(pointOptions, mainColor),
                    hover: that._createLegendState(pointOptions.hoverStyle, specialMainColor),
                    selection: that._createLegendState(pointOptions.selectionStyle, specialMainColor)
                }
            }
        },
        _getArrangeMinShownValue: function(points, total) {
            var minSegmentSize = this._options.minSegmentSize,
                totalMinSegmentSize = 0,
                totalNotMinValues = 0;
            total = total || points.length;
            _each(points, function(_, point) {
                if (point.isVisible()) {
                    if (point.initialValue < minSegmentSize * total / 360) {
                        totalMinSegmentSize += minSegmentSize
                    } else {
                        totalNotMinValues += point.initialValue
                    }
                }
            });
            return totalMinSegmentSize < 360 ? minSegmentSize * totalNotMinValues / (360 - totalMinSegmentSize) : 0
        },
        _applyArrangeCorrection: function(points, minShownValue, total) {
            var percent, options = this._options,
                isClockWise = "anticlockwise" !== options.segmentsDirection,
                shiftedAngle = _isFinite(options.startAngle) ? vizUtils.normalizeAngle(options.startAngle) : 0,
                minSegmentSize = options.minSegmentSize,
                correction = 0,
                zeroTotalCorrection = 0;
            if (0 === total) {
                total = points.filter(function(el) {
                    return el.isVisible()
                }).length;
                zeroTotalCorrection = 1
            }
            _each(isClockWise ? points : points.concat([]).reverse(), function(_, point) {
                var updatedZeroValue, val = point.isVisible() ? zeroTotalCorrection || point.initialValue : 0;
                if (minSegmentSize && point.isVisible() && val < minShownValue) {
                    updatedZeroValue = minShownValue
                }
                percent = val / total;
                point.correctValue(correction, percent, zeroTotalCorrection + (updatedZeroValue || 0));
                point.shiftedAngle = shiftedAngle;
                correction += updatedZeroValue || val
            });
            this._rangeData = {
                val: {
                    min: 0,
                    max: correction
                }
            }
        },
        arrangePoints: function() {
            var minShownValue, total, points, that = this,
                originalPoints = that._originalPoints || [],
                minSegmentSize = that._options.minSegmentSize,
                isAllPointsNegative = true,
                i = 0,
                len = originalPoints.length;
            while (i < len && isAllPointsNegative) {
                isAllPointsNegative = originalPoints[i].value <= 0;
                i++
            }
            points = that._originalPoints = that._points = _map(originalPoints, function(point) {
                if (null === point.value || !isAllPointsNegative && point.value < 0) {
                    point.dispose();
                    return null
                } else {
                    return point
                }
            });
            total = that._getArrangeTotal(points);
            if (minSegmentSize) {
                minShownValue = this._getArrangeMinShownValue(points, total)
            }
            that._applyArrangeCorrection(points, minShownValue, total)
        },
        correctPosition: function(correction) {
            _each(this._points, function(_, point) {
                point.correctPosition(correction)
            });
            this.setVisibleArea(correction.canvas)
        },
        correctRadius: function(correction) {
            _each(this._points, function(_, point) {
                point.correctRadius(correction)
            })
        },
        correctLabelRadius: function(labelRadius) {
            _each(this._points, function(_, point) {
                point.correctLabelRadius(labelRadius)
            })
        },
        setVisibleArea: function(canvas) {
            this._visibleArea = {
                minX: canvas.left,
                maxX: canvas.width - canvas.right,
                minY: canvas.top,
                maxY: canvas.height - canvas.bottom
            }
        },
        _applyVisibleArea: _noop,
        _animate: function(firstDrawing) {
            var that = this,
                index = 0,
                timeThreshold = .2,
                points = that._points,
                pointsCount = points && points.length,
                duration = 1 / (timeThreshold * (pointsCount - 1) + 1),
                completeFunc = function() {
                    that._animateComplete()
                },
                animateP = function() {
                    points[index] && points[index].animate(index === pointsCount - 1 ? completeFunc : void 0, duration, stepFunc);
                    index++
                },
                stepFunc = function(_, progress) {
                    if (progress >= timeThreshold) {
                        this.step = null;
                        animateP()
                    }
                };
            if (firstDrawing) {
                animateP()
            } else {
                $.each(points, function(i, p) {
                    p.animate(i === pointsCount - 1 ? completeFunc : void 0)
                })
            }
        },
        getVisiblePoints: function() {
            return _map(this._points, function(p) {
                return p.isVisible() ? p : null
            })
        },
        _beginUpdateData: function() {
            this._deletePatterns()
        }
    });
    exports.doughnut = exports.donut = exports.pie
});
