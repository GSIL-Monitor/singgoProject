/** 
 * DevExtreme (viz/gauges/circular_indicators.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var baseIndicatorsModule = require("./base_indicators"),
        BaseIndicator = baseIndicatorsModule.BaseIndicator,
        BaseTextCloudMarker = baseIndicatorsModule.BaseTextCloudMarker,
        BaseRangeBar = baseIndicatorsModule.BaseRangeBar,
        vizUtils = require("../core/utils"),
        _Number = Number,
        _getCosAndSin = vizUtils.getCosAndSin,
        _convertAngleToRendererSpace = vizUtils.convertAngleToRendererSpace;
    var SimpleIndicator = BaseIndicator.inherit({
        _move: function() {
            var that = this,
                options = that._options,
                angle = _convertAngleToRendererSpace(that._actualPosition);
            that._rootElement.rotate(angle, options.x, options.y);
            that._trackerElement && that._trackerElement.rotate(angle, options.x, options.y)
        },
        _isEnabled: function() {
            return this._options.width > 0
        },
        _isVisible: function(layout) {
            return layout.radius - _Number(this._options.indentFromCenter) > 0
        },
        _getTrackerSettings: function() {
            var options = this._options,
                x = options.x,
                y = options.y - (options.radius + _Number(options.indentFromCenter)) / 2,
                width = options.width / 2,
                length = (options.radius - _Number(options.indentFromCenter)) / 2;
            width > 10 || (width = 10);
            length > 10 || (length = 10);
            return {
                points: [x - width, y - length, x - width, y + length, x + width, y + length, x + width, y - length]
            }
        },
        _renderSpindle: function() {
            var gapSize, that = this,
                options = that._options;
            if (options.spindleSize > 0) {
                gapSize = _Number(options.spindleGapSize) || 0;
                if (gapSize > 0) {
                    gapSize = gapSize <= options.spindleSize ? gapSize : _Number(options.spindleSize)
                }
                that._spindleOuter = that._spindleOuter || that._renderer.circle().append(that._rootElement);
                that._spindleInner = that._spindleInner || that._renderer.circle().append(that._rootElement);
                that._spindleOuter.attr({
                    "class": "dxg-spindle-border",
                    cx: options.x,
                    cy: options.y,
                    r: options.spindleSize / 2
                });
                that._spindleInner.attr({
                    "class": "dxg-spindle-hole",
                    cx: options.x,
                    cy: options.y,
                    r: gapSize / 2,
                    fill: options.containerBackgroundColor
                })
            }
        },
        _render: function() {
            var that = this;
            that._renderPointer();
            that._renderSpindle()
        },
        _clearSpindle: function() {
            delete this._spindleOuter;
            delete this._spindleInner
        },
        _clearPointer: function() {
            delete this._element
        },
        _clear: function() {
            this._clearPointer();
            this._clearSpindle()
        },
        measure: function(layout) {
            var result = {
                max: layout.radius
            };
            if (this._options.indentFromCenter < 0) {
                result.inverseHorizontalOffset = result.inverseVerticalOffset = -_Number(this._options.indentFromCenter)
            }
            return result
        },
        getTooltipParameters: function() {
            var options = this._options,
                cossin = _getCosAndSin(this._actualPosition),
                r = (options.radius + _Number(options.indentFromCenter)) / 2;
            return {
                x: options.x + cossin.cos * r,
                y: options.y - cossin.sin * r,
                value: this._currentValue,
                color: options.color,
                offset: options.width / 2
            }
        }
    });
    var rectangleneedle = SimpleIndicator.inherit({
        _renderPointer: function() {
            var that = this,
                options = that._options,
                y2 = options.y - options.radius,
                y1 = options.y - _Number(options.indentFromCenter),
                x1 = options.x - options.width / 2,
                x2 = x1 + _Number(options.width);
            that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
            that._element.attr({
                points: [x1, y1, x1, y2, x2, y2, x2, y1]
            })
        }
    });
    var triangleneedle = SimpleIndicator.inherit({
        _renderPointer: function() {
            var that = this,
                options = that._options,
                y2 = options.y - options.radius,
                y1 = options.y - _Number(options.indentFromCenter),
                x1 = options.x - options.width / 2,
                x2 = options.x + options.width / 2;
            that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
            that._element.attr({
                points: [x1, y1, options.x, y2, x2, y1]
            })
        }
    });
    var twocolorneedle = SimpleIndicator.inherit({
        _renderPointer: function() {
            var y2, y3, that = this,
                options = that._options,
                x1 = options.x - options.width / 2,
                x2 = options.x + options.width / 2,
                y4 = options.y - options.radius,
                y1 = options.y - _Number(options.indentFromCenter),
                fraction = _Number(options.secondFraction) || 0;
            if (fraction >= 1) {
                y2 = y3 = y1
            } else {
                if (fraction <= 0) {
                    y2 = y3 = y4
                } else {
                    y3 = y4 + (y1 - y4) * fraction;
                    y2 = y3 + _Number(options.space)
                }
            }
            that._firstElement = that._firstElement || that._renderer.path([], "area").append(that._rootElement);
            that._spaceElement = that._spaceElement || that._renderer.path([], "area").append(that._rootElement);
            that._secondElement = that._secondElement || that._renderer.path([], "area").append(that._rootElement);
            that._firstElement.attr({
                points: [x1, y1, x1, y2, x2, y2, x2, y1]
            });
            that._spaceElement.attr({
                points: [x1, y2, x1, y3, x2, y3, x2, y2],
                "class": "dxg-hole",
                fill: options.containerBackgroundColor
            });
            that._secondElement.attr({
                points: [x1, y3, x1, y4, x2, y4, x2, y3],
                "class": "dxg-part",
                fill: options.secondColor
            })
        },
        _clearPointer: function() {
            delete this._firstElement;
            delete this._secondElement;
            delete this._spaceElement
        }
    });
    var trianglemarker = SimpleIndicator.inherit({
        _isEnabled: function() {
            return this._options.length > 0 && this._options.width > 0
        },
        _isVisible: function(layout) {
            return layout.radius > 0
        },
        _render: function() {
            var settings, that = this,
                options = that._options,
                x = options.x,
                y1 = options.y - options.radius,
                dx = options.width / 2 || 0,
                y2 = y1 - _Number(options.length);
            that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
            settings = {
                points: [x, y1, x - dx, y2, x + dx, y2],
                stroke: "none",
                "stroke-width": 0,
                "stroke-linecap": "square"
            };
            if (options.space > 0) {
                settings["stroke-width"] = Math.min(options.space, options.width / 4) || 0;
                settings.stroke = settings["stroke-width"] > 0 ? options.containerBackgroundColor || "none" : "none"
            }
            that._element.attr(settings).sharp()
        },
        _clear: function() {
            delete this._element
        },
        _getTrackerSettings: function() {
            var options = this._options,
                x = options.x,
                y = options.y - options.radius - options.length / 2,
                width = options.width / 2,
                length = options.length / 2;
            width > 10 || (width = 10);
            length > 10 || (length = 10);
            return {
                points: [x - width, y - length, x - width, y + length, x + width, y + length, x + width, y - length]
            }
        },
        measure: function(layout) {
            return {
                min: layout.radius,
                max: layout.radius + _Number(this._options.length)
            }
        },
        getTooltipParameters: function() {
            var options = this._options,
                cossin = _getCosAndSin(this._actualPosition),
                r = options.radius + options.length / 2,
                parameters = this.callBase();
            parameters.x = options.x + cossin.cos * r;
            parameters.y = options.y - cossin.sin * r;
            parameters.offset = options.length / 2;
            return parameters
        }
    });
    var textcloud = BaseTextCloudMarker.inherit({
        _isEnabled: function() {
            return true
        },
        _isVisible: function(layout) {
            return layout.radius > 0
        },
        _getTextCloudOptions: function() {
            var that = this,
                cossin = _getCosAndSin(that._actualPosition),
                nangle = vizUtils.normalizeAngle(that._actualPosition);
            return {
                x: that._options.x + cossin.cos * that._options.radius,
                y: that._options.y - cossin.sin * that._options.radius,
                type: nangle > 270 ? "left-top" : nangle > 180 ? "top-right" : nangle > 90 ? "right-bottom" : "bottom-left"
            }
        },
        measure: function(layout) {
            var verticalOffset, horizontalOffset, that = this,
                arrowLength = _Number(that._options.arrowLength) || 0;
            that._measureText();
            verticalOffset = that._textFullHeight + arrowLength;
            horizontalOffset = that._textFullWidth + arrowLength;
            return {
                min: layout.radius,
                max: layout.radius,
                horizontalOffset: horizontalOffset,
                verticalOffset: verticalOffset,
                inverseHorizontalOffset: horizontalOffset,
                inverseVerticalOffset: verticalOffset
            }
        }
    });
    var rangebar = BaseRangeBar.inherit({
        _isEnabled: function() {
            return this._options.size > 0
        },
        _isVisible: function(layout) {
            return layout.radius - _Number(this._options.size) > 0
        },
        _createBarItem: function() {
            return this._renderer.arc().attr({
                "stroke-linejoin": "round"
            }).append(this._rootElement)
        },
        _createTracker: function() {
            return this._renderer.arc().attr({
                "stroke-linejoin": "round"
            })
        },
        _setBarSides: function() {
            var that = this;
            that._maxSide = that._options.radius;
            that._minSide = that._maxSide - _Number(that._options.size)
        },
        _getSpace: function() {
            var options = this._options;
            return options.space > 0 ? 180 * options.space / options.radius / Math.PI : 0
        },
        _isTextVisible: function() {
            var options = this._options.text || {};
            return options.indent > 0
        },
        _setTextItemsSides: function() {
            var that = this,
                options = that._options,
                indent = _Number(options.text.indent);
            that._lineFrom = options.y - options.radius;
            that._lineTo = that._lineFrom - indent;
            that._textRadius = options.radius + indent
        },
        _getPositions: function() {
            var mainPosition1, mainPosition2, that = this,
                basePosition = that._basePosition,
                actualPosition = that._actualPosition;
            if (basePosition >= actualPosition) {
                mainPosition1 = basePosition;
                mainPosition2 = actualPosition
            } else {
                mainPosition1 = actualPosition;
                mainPosition2 = basePosition
            }
            return {
                start: that._startPosition,
                end: that._endPosition,
                main1: mainPosition1,
                main2: mainPosition2,
                back1: Math.min(mainPosition1 + that._space, that._startPosition),
                back2: Math.max(mainPosition2 - that._space, that._endPosition)
            }
        },
        _buildItemSettings: function(from, to) {
            var that = this;
            return {
                x: that._options.x,
                y: that._options.y,
                innerRadius: that._minSide,
                outerRadius: that._maxSide,
                startAngle: to,
                endAngle: from
            }
        },
        _updateTextPosition: function() {
            var that = this,
                cossin = _getCosAndSin(that._actualPosition),
                x = that._options.x + that._textRadius * cossin.cos,
                y = that._options.y - that._textRadius * cossin.sin;
            x += cossin.cos * that._textWidth * .6;
            y -= cossin.sin * that._textHeight * .6;
            that._text.attr({
                x: x,
                y: y + that._textVerticalOffset
            })
        },
        _updateLinePosition: function() {
            var x1, x2, that = this,
                x = that._options.x;
            if (that._basePosition > that._actualPosition) {
                x1 = x - 2;
                x2 = x
            } else {
                if (that._basePosition < that._actualPosition) {
                    x1 = x;
                    x2 = x + 2
                } else {
                    x1 = x - 1;
                    x2 = x + 1
                }
            }
            that._line.attr({
                points: [x1, that._lineFrom, x1, that._lineTo, x2, that._lineTo, x2, that._lineFrom]
            }).rotate(_convertAngleToRendererSpace(that._actualPosition), x, that._options.y).sharp()
        },
        _getTooltipPosition: function() {
            var that = this,
                cossin = _getCosAndSin((that._basePosition + that._actualPosition) / 2),
                r = (that._minSide + that._maxSide) / 2;
            return {
                x: that._options.x + cossin.cos * r,
                y: that._options.y - cossin.sin * r
            }
        },
        measure: function(layout) {
            var that = this,
                result = {
                    min: layout.radius - _Number(that._options.size),
                    max: layout.radius
                };
            that._measureText();
            if (that._hasText) {
                result.max += _Number(that._options.text.indent);
                result.horizontalOffset = that._textWidth;
                result.verticalOffset = that._textHeight
            }
            return result
        }
    });
    exports._default = rectangleneedle;
    exports.rectangleneedle = rectangleneedle;
    exports.triangleneedle = triangleneedle;
    exports.twocolorneedle = twocolorneedle;
    exports.trianglemarker = trianglemarker;
    exports.textcloud = textcloud;
    exports.rangebar = rangebar
});
