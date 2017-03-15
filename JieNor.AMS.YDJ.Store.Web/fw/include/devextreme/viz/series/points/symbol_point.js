/** 
 * DevExtreme (viz/series/points/symbol_point.js)
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
        commonUtils = require("../../../core/utils/common"),
        labelModule = require("./label"),
        _extend = $.extend,
        _isDefined = commonUtils.isDefined,
        _normalizeEnum = require("../../core/utils").normalizeEnum,
        _math = Math,
        _round = _math.round,
        _floor = _math.floor,
        _ceil = _math.ceil,
        DEFAULT_IMAGE_WIDTH = 20,
        DEFAULT_IMAGE_HEIGHT = 20,
        LABEL_OFFSET = 10,
        CANVAS_POSITION_DEFAULT = "canvas_position_default";

    function getSquareMarkerCoords(radius) {
        return [-radius, -radius, radius, -radius, radius, radius, -radius, radius, -radius, -radius]
    }

    function getPolygonMarkerCoords(radius) {
        var r = _ceil(radius);
        return [-r, 0, 0, -r, r, 0, 0, r, -r, 0]
    }

    function getCrossMarkerCoords(radius) {
        var r = _ceil(radius),
            floorHalfRadius = _floor(r / 2),
            ceilHalfRadius = _ceil(r / 2);
        return [-r, -floorHalfRadius, -floorHalfRadius, -r, 0, -ceilHalfRadius, floorHalfRadius, -r, r, -floorHalfRadius, ceilHalfRadius, 0, r, floorHalfRadius, floorHalfRadius, r, 0, ceilHalfRadius, -floorHalfRadius, r, -r, floorHalfRadius, -ceilHalfRadius, 0]
    }

    function getTriangleDownMarkerCoords(radius) {
        return [-radius, -radius, radius, -radius, 0, radius, -radius, -radius]
    }

    function getTriangleUpMarkerCoords(radius) {
        return [-radius, radius, radius, radius, 0, -radius, -radius, radius]
    }
    module.exports = {
        deleteLabel: function() {
            this._label.dispose();
            this._label = null
        },
        _hasGraphic: function() {
            return this.graphic
        },
        clearVisibility: function() {
            var that = this,
                graphic = that.graphic;
            if (graphic && graphic.attr("visibility")) {
                graphic.attr({
                    visibility: null
                })
            }
            that._label.clearVisibility()
        },
        isVisible: function() {
            return this.inVisibleArea && this.series.isVisible()
        },
        setInvisibility: function() {
            var that = this,
                graphic = that.graphic;
            if (graphic && "hidden" !== graphic.attr("visibility")) {
                graphic.attr({
                    visibility: "hidden"
                })
            }
            that._errorBar && that._errorBar.attr({
                visibility: "hidden"
            });
            that._label.hide()
        },
        clearMarker: function() {
            var graphic = this.graphic;
            graphic && graphic.attr(this._emptySettings)
        },
        _createLabel: function() {
            this._label = new labelModule.Label({
                renderer: this.series._renderer,
                labelsGroup: this.series._labelsGroup,
                point: this
            })
        },
        _updateLabelData: function() {
            this._label.setData(this._getLabelFormatObject())
        },
        _updateLabelOptions: function() {
            !this._label && this._createLabel();
            this._label.setOptions(this._options.label)
        },
        _checkImage: function(image) {
            return _isDefined(image) && ("string" === typeof image || _isDefined(image.url))
        },
        _fillStyle: function() {
            this._styles = this._options.styles
        },
        _checkSymbol: function(oldOptions, newOptions) {
            var oldSymbol = oldOptions.symbol,
                newSymbol = newOptions.symbol,
                symbolChanged = "circle" === oldSymbol && "circle" !== newSymbol || "circle" !== oldSymbol && "circle" === newSymbol,
                imageChanged = this._checkImage(oldOptions.image) !== this._checkImage(newOptions.image);
            return !!(symbolChanged || imageChanged)
        },
        _populatePointShape: function(symbol, radius) {
            switch (symbol) {
                case "square":
                    return getSquareMarkerCoords(radius);
                case "polygon":
                    return getPolygonMarkerCoords(radius);
                case "triangle":
                case "triangleDown":
                    return getTriangleDownMarkerCoords(radius);
                case "triangleUp":
                    return getTriangleUpMarkerCoords(radius);
                case "cross":
                    return getCrossMarkerCoords(radius)
            }
        },
        correctValue: function(correction) {
            var that = this;
            if (that.hasValue()) {
                that.value = that.initialValue + correction;
                that.minValue = correction;
                that.translate()
            }
        },
        resetCorrection: function() {
            this.value = this.initialValue;
            this.minValue = CANVAS_POSITION_DEFAULT
        },
        resetValue: function() {
            var that = this;
            if (that.hasValue()) {
                that.value = that.initialValue = 0;
                that.minValue = 0;
                that.translate();
                that._label.setDataField("value", that.value)
            }
        },
        _getTranslates: function(animationEnabled) {
            var translateX = this.x,
                translateY = this.y;
            if (animationEnabled) {
                if (this._options.rotated) {
                    translateX = this.defaultX
                } else {
                    translateY = this.defaultY
                }
            }
            return {
                x: translateX,
                y: translateY
            }
        },
        _createImageMarker: function(renderer, settings, options) {
            var width = options.width || DEFAULT_IMAGE_WIDTH,
                height = options.height || DEFAULT_IMAGE_HEIGHT;
            return renderer.image(-_round(.5 * width), -_round(.5 * height), width, height, options.url ? options.url.toString() : options.toString(), "center").attr({
                translateX: settings.translateX,
                translateY: settings.translateY,
                visibility: settings.visibility
            })
        },
        _createSymbolMarker: function(renderer, pointSettings) {
            var marker, symbol = this._options.symbol;
            if ("circle" === symbol) {
                delete pointSettings.points;
                marker = renderer.circle().attr(pointSettings)
            } else {
                if ("square" === symbol || "polygon" === symbol || "triangle" === symbol || "triangleDown" === symbol || "triangleUp" === symbol || "cross" === symbol) {
                    marker = renderer.path([], "area").attr(pointSettings).sharp()
                }
            }
            return marker
        },
        _createMarker: function(renderer, group, image, settings, animationEnabled) {
            var that = this,
                marker = that._checkImage(image) ? that._createImageMarker(renderer, settings, image) : that._createSymbolMarker(renderer, settings);
            if (marker) {
                marker.data({
                    "chart-data-point": that
                }).append(group)
            }
            return marker
        },
        _getSymbolBbox: function(x, y, r) {
            return {
                x: x - r,
                y: y - r,
                width: 2 * r,
                height: 2 * r
            }
        },
        _getImageBbox: function(x, y) {
            var image = this._options.image,
                width = image.width || DEFAULT_IMAGE_WIDTH,
                height = image.height || DEFAULT_IMAGE_HEIGHT;
            return {
                x: x - _round(width / 2),
                y: y - _round(height / 2),
                width: width,
                height: height
            }
        },
        _getGraphicBbox: function() {
            var bbox, that = this,
                options = that._options,
                x = that.x,
                y = that.y;
            if (options.visible) {
                bbox = that._checkImage(options.image) ? that._getImageBbox(x, y) : that._getSymbolBbox(x, y, options.styles.normal.r)
            } else {
                bbox = {
                    x: x,
                    y: y,
                    width: 0,
                    height: 0
                }
            }
            return bbox
        },
        _isLabelInsidePoint: $.noop,
        _getShiftLabelCoords: function(label) {
            var coord = this._addLabelAlignmentAndOffset(label, this._getLabelCoords(label));
            return this._checkLabelPosition(label, coord)
        },
        _drawLabel: function() {
            var that = this,
                customVisibility = that._getCustomLabelVisibility(),
                label = that._label;
            if (that._showForZeroValues() && that.hasValue() && false !== customVisibility && (that.series.getLabelVisibility() || customVisibility)) {
                label.show()
            } else {
                label.hide()
            }
        },
        correctLabelPosition: function(label) {
            var coord, that = this;
            if (!that._isLabelInsidePoint(label)) {
                coord = that._getShiftLabelCoords(label);
                label.setFigureToDrawConnector(that._getLabelConnector(label.pointPosition));
                label.shift(_round(coord.x), _round(coord.y))
            }
        },
        _showForZeroValues: function() {
            return true
        },
        _getLabelConnector: function(pointPosition) {
            var bbox = this._getGraphicBbox(pointPosition),
                w2 = bbox.width / 2,
                h2 = bbox.height / 2;
            return {
                x: bbox.x + w2,
                y: bbox.y + h2,
                r: this._options.visible ? Math.max(w2, h2) : 0
            }
        },
        _getPositionFromLocation: function() {
            return {
                x: this.x,
                y: this.y
            }
        },
        _isPointInVisibleArea: function(visibleArea, graphicBbox) {
            return visibleArea.minX <= graphicBbox.x + graphicBbox.width && visibleArea.maxX >= graphicBbox.x && visibleArea.minY <= graphicBbox.y + graphicBbox.height && visibleArea.maxY >= graphicBbox.y
        },
        _checkLabelPosition: function(label, coord) {
            var that = this,
                visibleArea = that._getVisibleArea(),
                labelBbox = label.getBoundingRect(),
                graphicBbox = that._getGraphicBbox(label.pointPosition),
                offset = LABEL_OFFSET;
            if (that._isPointInVisibleArea(visibleArea, graphicBbox)) {
                if (!that._options.rotated) {
                    if (visibleArea.minX > coord.x) {
                        coord.x = visibleArea.minX
                    }
                    if (visibleArea.maxX < coord.x + labelBbox.width) {
                        coord.x = visibleArea.maxX - labelBbox.width
                    }
                    if (visibleArea.minY > coord.y) {
                        coord.y = graphicBbox.y + graphicBbox.height + offset
                    }
                    if (visibleArea.maxY < coord.y + labelBbox.height) {
                        coord.y = graphicBbox.y - labelBbox.height - offset
                    }
                } else {
                    if (visibleArea.minX > coord.x) {
                        coord.x = graphicBbox.x + graphicBbox.width + offset
                    }
                    if (visibleArea.maxX < coord.x + labelBbox.width) {
                        coord.x = graphicBbox.x - offset - labelBbox.width
                    }
                    if (visibleArea.minY > coord.y) {
                        coord.y = visibleArea.minY
                    }
                    if (visibleArea.maxY < coord.y + labelBbox.height) {
                        coord.y = visibleArea.maxY - labelBbox.height
                    }
                }
            }
            return coord
        },
        _addLabelAlignmentAndOffset: function(label, coord) {
            var labelBBox = label.getBoundingRect(),
                labelOptions = label.getLayoutOptions();
            if (!this._options.rotated) {
                if ("left" === labelOptions.alignment) {
                    coord.x += labelBBox.width / 2
                } else {
                    if ("right" === labelOptions.alignment) {
                        coord.x -= labelBBox.width / 2
                    }
                }
            }
            coord.x += labelOptions.horizontalOffset;
            coord.y += labelOptions.verticalOffset;
            return coord
        },
        _getLabelCoords: function(label) {
            return this._getLabelCoordOfPosition(label, this._getLabelPosition(label.pointPosition))
        },
        _getLabelCoordOfPosition: function(label, position) {
            var that = this,
                labelBBox = label.getBoundingRect(),
                graphicBbox = that._getGraphicBbox(label.pointPosition),
                offset = LABEL_OFFSET,
                centerY = graphicBbox.height / 2 - labelBBox.height / 2,
                centerX = graphicBbox.width / 2 - labelBBox.width / 2,
                x = graphicBbox.x,
                y = graphicBbox.y;
            switch (position) {
                case "left":
                    x -= labelBBox.width + offset;
                    y += centerY;
                    break;
                case "right":
                    x += graphicBbox.width + offset;
                    y += centerY;
                    break;
                case "top":
                    x += centerX;
                    y -= labelBBox.height + offset;
                    break;
                case "bottom":
                    x += centerX;
                    y += graphicBbox.height + offset;
                    break;
                case "inside":
                    x += centerX;
                    y += centerY
            }
            return {
                x: x,
                y: y
            }
        },
        _drawMarker: function(renderer, group, animationEnabled) {
            var that = this,
                options = that._options,
                translates = that._getTranslates(animationEnabled),
                style = that._getStyle();
            that.graphic = that._createMarker(renderer, group, options.image, _extend({
                translateX: translates.x,
                translateY: translates.y,
                points: that._populatePointShape(options.symbol, style.r)
            }, style), animationEnabled)
        },
        _getErrorBarSettings: function() {
            return {
                visibility: "visible"
            }
        },
        _drawErrorBar: function(renderer, group) {
            if (!this._options.errorBars) {
                return
            }
            var settings, that = this,
                options = that._options,
                errorBarOptions = options.errorBars,
                points = [],
                pos = that._errorBarPos,
                high = that._highErrorCoord,
                low = that._lowErrorCoord,
                displayMode = _normalizeEnum(errorBarOptions.displayMode),
                isHighDisplayMode = "high" === displayMode,
                isLowDisplayMode = "low" === displayMode,
                edgeLength = _floor(parseInt(errorBarOptions.edgeLength) / 2),
                highErrorOnly = (isHighDisplayMode || !_isDefined(low)) && _isDefined(high) && !isLowDisplayMode,
                lowErrorOnly = (isLowDisplayMode || !_isDefined(high)) && _isDefined(low) && !isHighDisplayMode;
            highErrorOnly && (low = that._baseErrorBarPos);
            lowErrorOnly && (high = that._baseErrorBarPos);
            if ("none" !== displayMode && _isDefined(high) && _isDefined(low) && _isDefined(pos)) {
                !lowErrorOnly && points.push([pos - edgeLength, high, pos + edgeLength, high]);
                points.push([pos, high, pos, low]);
                !highErrorOnly && points.push([pos + edgeLength, low, pos - edgeLength, low]);
                options.rotated && $.each(points, function(_, p) {
                    p.reverse()
                });
                settings = that._getErrorBarSettings(errorBarOptions);
                if (!that._errorBar) {
                    that._errorBar = renderer.path(points, "line").attr(settings).append(group)
                } else {
                    settings.points = points;
                    that._errorBar.attr(settings)
                }
            } else {
                that._errorBar && that._errorBar.attr({
                    visibility: "hidden"
                })
            }
        },
        getTooltipParams: function() {
            var that = this,
                graphic = that.graphic;
            return {
                x: that.x,
                y: that.y,
                offset: graphic ? graphic.getBBox().height / 2 : 0
            }
        },
        setPercentValue: function(total, fullStacked, leftHoleTotal, rightHoleTotal) {
            var that = this,
                valuePercent = that.value / total || 0,
                minValuePercent = that.minValue / total || 0,
                percent = valuePercent - minValuePercent;
            that._label.setDataField("percent", percent);
            that._label.setDataField("total", total);
            if (that.series.isFullStackedSeries() && that.hasValue()) {
                if (that.leftHole) {
                    that.leftHole /= total - leftHoleTotal;
                    that.minLeftHole /= total - leftHoleTotal
                }
                if (that.rightHole) {
                    that.rightHole /= total - rightHoleTotal;
                    that.minRightHole /= total - rightHoleTotal
                }
                that.value = valuePercent;
                that.minValue = !minValuePercent ? that.minValue : minValuePercent;
                that.translate()
            }
        },
        _storeTrackerR: function() {
            var minTrackerSize, that = this,
                navigator = window.navigator,
                r = that._options.styles.normal.r;
            minTrackerSize = "ontouchstart" in window || navigator.msPointerEnabled && navigator.msMaxTouchPoints || navigator.pointerEnabled && navigator.maxTouchPoints ? 20 : 6;
            that._options.trackerR = r < minTrackerSize ? minTrackerSize : r;
            return that._options.trackerR
        },
        _translateErrorBars: function(valueTranslator) {
            var that = this,
                options = that._options,
                rotated = options.rotated,
                errorBars = options.errorBars;
            if (!errorBars) {
                return
            }
            _isDefined(that.lowError) && (that._lowErrorCoord = valueTranslator.translate(that.lowError));
            _isDefined(that.highError) && (that._highErrorCoord = valueTranslator.translate(that.highError));
            that._errorBarPos = _floor(rotated ? that.vy : that.vx);
            that._baseErrorBarPos = "stdDeviation" === errorBars.type ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : rotated ? that.vx : that.vy
        },
        _translate: function(translators) {
            var valueTranslator, that = this;
            if (that._options.rotated) {
                valueTranslator = translators.x;
                that.vx = that.x = valueTranslator.translate(that.value);
                that.vy = that.y = translators.y.translate(that.argument);
                that.minX = valueTranslator.translate(that.minValue);
                that.defaultX = valueTranslator.translate(CANVAS_POSITION_DEFAULT);
                that._translateErrorBars(valueTranslator)
            } else {
                valueTranslator = translators.y;
                that.vy = that.y = valueTranslator.translate(that.value);
                that.vx = that.x = translators.x.translate(that.argument);
                that.minY = valueTranslator.translate(that.minValue);
                that.defaultY = valueTranslator.translate(CANVAS_POSITION_DEFAULT);
                that._translateErrorBars(valueTranslator)
            }
            that._calculateVisibility(that.x, that.y)
        },
        _updateData: function(data) {
            var that = this;
            that.value = that.initialValue = that.originalValue = data.value;
            that.minValue = that.initialMinValue = that.originalMinValue = _isDefined(data.minValue) ? data.minValue : CANVAS_POSITION_DEFAULT
        },
        _getImageSettings: function(image) {
            return {
                href: image.url || image.toString(),
                width: image.width || DEFAULT_IMAGE_WIDTH,
                height: image.height || DEFAULT_IMAGE_HEIGHT
            }
        },
        getCrosshairData: function() {
            var that = this,
                r = that._options.rotated,
                value = that.value,
                argument = that.argument;
            return {
                x: that.vx,
                y: that.vy,
                xValue: r ? value : argument,
                yValue: r ? argument : value,
                axis: that.series.axis
            }
        },
        getPointRadius: function() {
            var extraSpace, style = this._getStyle(),
                options = this._options,
                r = style.r,
                symbol = options.symbol,
                isSquare = "square" === symbol,
                isTriangle = "triangle" === symbol || "triangleDown" === symbol || "triangleUp" === symbol;
            if (options.visible && !options.image && r) {
                extraSpace = style["stroke-width"] / 2;
                return (isSquare || isTriangle ? 1.4 * r : r) + extraSpace
            }
            return 0
        },
        _updateMarker: function(animationEnabled, style) {
            var settings, that = this,
                options = that._options,
                image = options.image,
                visibility = !that.isVisible() ? {
                    visibility: "hidden"
                } : {};
            style = style || that._getStyle();
            if (that._checkImage(image)) {
                settings = _extend({}, {
                    visibility: style.visibility
                }, visibility, that._getImageSettings(image))
            } else {
                settings = _extend({}, style, visibility, {
                    points: that._populatePointShape(options.symbol, style.r)
                })
            }
            if (!animationEnabled) {
                settings.translateX = that.x;
                settings.translateY = that.y
            }
            that.graphic.attr(settings).sharp()
        },
        _getLabelFormatObject: function() {
            var that = this;
            return {
                argument: that.initialArgument,
                value: that.initialValue,
                originalArgument: that.originalArgument,
                originalValue: that.originalValue,
                seriesName: that.series.name,
                lowErrorValue: that.lowError,
                highErrorValue: that.highError,
                point: that
            }
        },
        _getLabelPosition: function() {
            var rotated = this._options.rotated;
            if (this.initialValue > 0) {
                return rotated ? "right" : "top"
            } else {
                return rotated ? "left" : "bottom"
            }
        },
        _getFormatObject: function(tooltip) {
            var that = this,
                labelFormatObject = that._label.getData();
            return _extend({}, labelFormatObject, {
                argumentText: tooltip.formatValue(that.initialArgument, "argument"),
                valueText: tooltip.formatValue(that.initialValue)
            }, _isDefined(labelFormatObject.percent) ? {
                percentText: tooltip.formatValue(labelFormatObject.percent, "percent")
            } : {}, _isDefined(labelFormatObject.total) ? {
                totalText: tooltip.formatValue(labelFormatObject.total)
            } : {})
        },
        _getMarkerVisibility: function() {
            return this._options.visible
        },
        coordsIn: function(x, y) {
            var trackerRadius = this._storeTrackerR();
            return x >= this.x - trackerRadius && x <= this.x + trackerRadius && y >= this.y - trackerRadius && y <= this.y + trackerRadius
        }
    }
});
