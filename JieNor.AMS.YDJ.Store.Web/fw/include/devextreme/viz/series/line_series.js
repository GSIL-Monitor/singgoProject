/** 
 * DevExtreme (viz/series/line_series.js)
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
        series = require("./scatter_series"),
        chartScatterSeries = series.chart,
        polarScatterSeries = series.polar,
        objectUtils = require("../../core/utils/object"),
        vizUtils = require("../core/utils"),
        normalizeAngle = vizUtils.normalizeAngle,
        CANVAS_POSITION_START = "canvas_position_start",
        CANVAS_POSITION_TOP = "canvas_position_top",
        DISCRETE = "discrete",
        _map = vizUtils.map,
        _extend = $.extend,
        _each = $.each;
    exports.chart = {};
    exports.polar = {};

    function clonePoint(point, newX, newY, newAngle) {
        var p = objectUtils.clone(point);
        p.x = newX;
        p.y = newY;
        p.angle = newAngle;
        return p
    }

    function getTangentPoint(point, prevPoint, centerPoint, tan, nextStepAngle) {
        var correctAngle = point.angle + nextStepAngle,
            cossin = vizUtils.getCosAndSin(correctAngle),
            x = centerPoint.x + (point.radius + tan * nextStepAngle) * cossin.cos,
            y = centerPoint.y - (point.radius + tan * nextStepAngle) * cossin.sin;
        return clonePoint(prevPoint, x, y, correctAngle)
    }
    var lineMethods = {
        _applyGroupSettings: function(style, settings, group) {
            var that = this;
            settings = _extend(settings, style);
            that._applyElementsClipRect(settings);
            group.attr(settings)
        },
        _setGroupsSettings: function(animationEnabled) {
            var that = this,
                style = that._styles.normal;
            that._applyGroupSettings(style.elements, {
                "class": "dxc-elements"
            }, that._elementsGroup);
            that._bordersGroup && that._applyGroupSettings(style.border, {
                "class": "dxc-borders"
            }, that._bordersGroup);
            chartScatterSeries._setGroupsSettings.call(that, animationEnabled);
            animationEnabled && that._markersGroup && that._markersGroup.attr({
                opacity: .001
            })
        },
        _createGroups: function() {
            var that = this;
            that._createGroup("_elementsGroup", that, that._group);
            that._areBordersVisible() && that._createGroup("_bordersGroup", that, that._group);
            chartScatterSeries._createGroups.call(that)
        },
        _areBordersVisible: function() {
            return false
        },
        _getDefaultSegment: function(segment) {
            return {
                line: _map(segment.line || [], function(pt) {
                    return pt.getDefaultCoords()
                })
            }
        },
        _prepareSegment: function(points) {
            return {
                line: points
            }
        },
        _parseLineOptions: function(options, defaultColor) {
            return {
                stroke: options.color || defaultColor,
                "stroke-width": options.width,
                dashStyle: options.dashStyle || "solid"
            }
        },
        _parseStyle: function(options, defaultColor) {
            return {
                elements: this._parseLineOptions(options, defaultColor)
            }
        },
        _applyStyle: function(style) {
            var that = this;
            that._elementsGroup && that._elementsGroup.attr(style.elements);
            _each(that._graphics || [], function(_, graphic) {
                graphic.line && graphic.line.attr({
                    "stroke-width": style.elements["stroke-width"]
                }).sharp()
            })
        },
        _drawElement: function(segment, group) {
            return {
                line: this._createMainElement(segment.line, {
                    "stroke-width": this._styles.normal.elements["stroke-width"]
                }).append(group)
            }
        },
        _removeElement: function(element) {
            element.line.remove()
        },
        _generateDefaultSegments: function() {
            var that = this;
            return _map(that._segments || [], function(segment) {
                return that._getDefaultSegment(segment)
            })
        },
        _updateElement: function(element, segment, animate, animateParams, complete) {
            var params = {
                    points: segment.line
                },
                lineElement = element.line;
            animate ? lineElement.animate(params, animateParams, complete) : lineElement.attr(params)
        },
        _clearingAnimation: function(translator, drawComplete) {
            var that = this,
                lastIndex = that._graphics.length - 1,
                settings = {
                    opacity: .001
                },
                options = {
                    duration: that._defaultDuration,
                    partitionDuration: .5
                };
            that._labelsGroup && that._labelsGroup.animate(settings, options, function() {
                that._markersGroup && that._markersGroup.animate(settings, options, function() {
                    _each(that._defaultSegments || [], function(i, segment) {
                        that._oldUpdateElement(that._graphics[i], segment, true, {
                            partitionDuration: .5
                        }, i === lastIndex ? drawComplete : void 0)
                    })
                })
            })
        },
        _animateComplete: function() {
            var that = this;
            chartScatterSeries._animateComplete.call(this);
            that._markersGroup && that._markersGroup.animate({
                opacity: 1
            }, {
                duration: that._defaultDuration
            })
        },
        _animate: function() {
            var that = this,
                lastIndex = that._graphics.length - 1;
            _each(that._graphics || [], function(i, elem) {
                that._updateElement(elem, that._segments[i], true, {
                    complete: i === lastIndex ? function() {
                        that._animateComplete()
                    } : void 0
                })
            })
        },
        _drawPoint: function(options) {
            chartScatterSeries._drawPoint.call(this, {
                point: options.point,
                groups: options.groups
            })
        },
        _createMainElement: function(points, settings) {
            return this._renderer.path(points, "line").attr(settings).sharp()
        },
        _drawSegment: function(points, animationEnabled, segmentCount, lastSegment) {
            var that = this,
                segment = that._prepareSegment(points, that._options.rotated, lastSegment);
            that._segments.push(segment);
            if (!that._graphics[segmentCount]) {
                that._graphics[segmentCount] = that._drawElement(animationEnabled ? that._getDefaultSegment(segment) : segment, that._elementsGroup)
            } else {
                if (!animationEnabled) {
                    that._updateElement(that._graphics[segmentCount], segment)
                }
            }
        },
        _getTrackerSettings: function() {
            var that = this,
                defaultTrackerWidth = that._defaultTrackerWidth,
                strokeWidthFromElements = that._styles.normal.elements["stroke-width"];
            return {
                "stroke-width": strokeWidthFromElements > defaultTrackerWidth ? strokeWidthFromElements : defaultTrackerWidth,
                fill: "none"
            }
        },
        _getMainPointsFromSegment: function(segment) {
            return segment.line
        },
        _drawTrackerElement: function(segment) {
            return this._createMainElement(this._getMainPointsFromSegment(segment), this._getTrackerSettings(segment))
        },
        _updateTrackerElement: function(segment, element) {
            var settings = this._getTrackerSettings(segment);
            settings.points = this._getMainPointsFromSegment(segment);
            element.attr(settings)
        }
    };
    exports.chart.line = _extend({}, chartScatterSeries, lineMethods);
    exports.chart.stepline = _extend({}, exports.chart.line, {
        _calculateStepLinePoints: function(points) {
            var segment = [];
            _each(points, function(i, pt) {
                var stepY, point;
                if (!i) {
                    segment.push(pt);
                    return
                }
                stepY = segment[segment.length - 1].y;
                if (stepY !== pt.y) {
                    point = objectUtils.clone(pt);
                    point.y = stepY;
                    segment.push(point)
                }
                segment.push(pt)
            });
            return segment
        },
        _prepareSegment: function(points) {
            return exports.chart.line._prepareSegment(this._calculateStepLinePoints(points))
        }
    });
    exports.chart.spline = _extend({}, exports.chart.line, {
        _calculateBezierPoints: function(src, rotated) {
            var bezierPoints = [],
                pointsCopy = src,
                checkExtr = function(otherPointCoord, pointCoord, controlCoord) {
                    return otherPointCoord > pointCoord && controlCoord > otherPointCoord || otherPointCoord < pointCoord && controlCoord < otherPointCoord ? otherPointCoord : controlCoord
                };
            if (1 !== pointsCopy.length) {
                _each(pointsCopy, function(i, curPoint) {
                    var leftControlX, leftControlY, rightControlX, rightControlY, prevPoint, nextPoint, xCur, yCur, x1, x2, y1, y2, curIsExtremum, leftPoint, rightPoint, a, b, c, xc, yc, shift, lambda = .5;
                    if (!i) {
                        bezierPoints.push(curPoint);
                        bezierPoints.push(curPoint);
                        return
                    }
                    prevPoint = pointsCopy[i - 1];
                    if (i < pointsCopy.length - 1) {
                        nextPoint = pointsCopy[i + 1];
                        xCur = curPoint.x;
                        yCur = curPoint.y;
                        x1 = prevPoint.x;
                        x2 = nextPoint.x;
                        y1 = prevPoint.y;
                        y2 = nextPoint.y;
                        curIsExtremum = !!(!rotated && (yCur <= prevPoint.y && yCur <= nextPoint.y || yCur >= prevPoint.y && yCur >= nextPoint.y) || rotated && (xCur <= prevPoint.x && xCur <= nextPoint.x || xCur >= prevPoint.x && xCur >= nextPoint.x));
                        if (curIsExtremum) {
                            if (!rotated) {
                                rightControlY = leftControlY = yCur;
                                rightControlX = (xCur + nextPoint.x) / 2;
                                leftControlX = (xCur + prevPoint.x) / 2
                            } else {
                                rightControlX = leftControlX = xCur;
                                rightControlY = (yCur + nextPoint.y) / 2;
                                leftControlY = (yCur + prevPoint.y) / 2
                            }
                        } else {
                            a = y2 - y1;
                            b = x1 - x2;
                            c = y1 * x2 - x1 * y2;
                            if (!rotated) {
                                xc = xCur;
                                yc = -1 * (a * xc + c) / b;
                                shift = yc - yCur || 0;
                                y1 -= shift;
                                y2 -= shift
                            } else {
                                yc = yCur;
                                xc = -1 * (b * yc + c) / a;
                                shift = xc - xCur || 0;
                                x1 -= shift;
                                x2 -= shift
                            }
                            rightControlX = (xCur + lambda * x2) / (1 + lambda);
                            rightControlY = (yCur + lambda * y2) / (1 + lambda);
                            leftControlX = (xCur + lambda * x1) / (1 + lambda);
                            leftControlY = (yCur + lambda * y1) / (1 + lambda)
                        }
                        if (!rotated) {
                            leftControlY = checkExtr(prevPoint.y, yCur, leftControlY);
                            rightControlY = checkExtr(nextPoint.y, yCur, rightControlY)
                        } else {
                            leftControlX = checkExtr(prevPoint.x, xCur, leftControlX);
                            rightControlX = checkExtr(nextPoint.x, xCur, rightControlX)
                        }
                        leftPoint = clonePoint(curPoint, leftControlX, leftControlY);
                        rightPoint = clonePoint(curPoint, rightControlX, rightControlY);
                        bezierPoints.push(leftPoint, curPoint, rightPoint)
                    } else {
                        bezierPoints.push(curPoint, curPoint);
                        return
                    }
                })
            } else {
                bezierPoints.push(pointsCopy[0])
            }
            return bezierPoints
        },
        _prepareSegment: function(points, rotated) {
            return exports.chart.line._prepareSegment(this._calculateBezierPoints(points, rotated))
        },
        _createMainElement: function(points, settings) {
            return this._renderer.path(points, "bezier").attr(settings).sharp()
        }
    });
    exports.polar.line = _extend({}, polarScatterSeries, lineMethods, {
        _prepareSegment: function(points, rotated, lastSegment) {
            var i, preparedPoints = [],
                centerPoint = this.translators.translate(CANVAS_POSITION_START, CANVAS_POSITION_TOP);
            lastSegment && this._closeSegment(points);
            if (this.argumentAxisType !== DISCRETE && this.valueAxisType !== DISCRETE) {
                for (i = 1; i < points.length; i++) {
                    preparedPoints = preparedPoints.concat(this._getTangentPoints(points[i], points[i - 1], centerPoint))
                }
                if (!preparedPoints.length) {
                    preparedPoints = points
                }
            } else {
                return exports.chart.line._prepareSegment.apply(this, arguments)
            }
            return {
                line: preparedPoints
            }
        },
        _getRemainingAngle: function(angle) {
            var normAngle = normalizeAngle(angle);
            return angle >= 0 ? 360 - normAngle : -normAngle
        },
        _closeSegment: function(points) {
            var point, differenceAngle;
            if (this._segments.length) {
                point = this._segments[0].line[0]
            } else {
                point = clonePoint(points[0], points[0].x, points[0].y, points[0].angle)
            }
            if (points[points.length - 1].angle !== point.angle) {
                if (normalizeAngle(Math.round(points[points.length - 1].angle)) === normalizeAngle(Math.round(point.angle))) {
                    point.angle = points[points.length - 1].angle
                } else {
                    differenceAngle = points[points.length - 1].angle - point.angle;
                    point.angle = points[points.length - 1].angle + this._getRemainingAngle(differenceAngle)
                }
                points.push(point)
            }
        },
        _getTangentPoints: function(point, prevPoint, centerPoint) {
            var i, tangentPoints = [],
                betweenAngle = Math.round(prevPoint.angle - point.angle),
                tan = (prevPoint.radius - point.radius) / betweenAngle;
            if (0 === betweenAngle) {
                tangentPoints = [prevPoint, point]
            } else {
                if (betweenAngle > 0) {
                    for (i = betweenAngle; i >= 0; i--) {
                        tangentPoints.push(getTangentPoint(point, prevPoint, centerPoint, tan, i))
                    }
                } else {
                    for (i = 0; i >= betweenAngle; i--) {
                        tangentPoints.push(getTangentPoint(point, prevPoint, centerPoint, tan, betweenAngle - i))
                    }
                }
            }
            return tangentPoints
        }
    })
});
