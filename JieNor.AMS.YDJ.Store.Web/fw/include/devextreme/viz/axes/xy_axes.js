/** 
 * DevExtreme (viz/axes/xy_axes.js)
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
        formatHelper = require("../../format_helper"),
        dateUtils = require("../../core/utils/date"),
        getNextDateUnit = dateUtils.getNextDateUnit,
        correctDateWithUnitBeginning = dateUtils.correctDateWithUnitBeginning,
        commonUtils = require("../../core/utils/common"),
        vizUtils = require("../core/utils"),
        _isDefined = commonUtils.isDefined,
        constants = require("./axes_constants"),
        _extend = $.extend,
        CANVAS_POSITION_PREFIX = constants.canvasPositionPrefix,
        TOP = constants.top,
        BOTTOM = constants.bottom,
        LEFT = constants.left,
        RIGHT = constants.right,
        CENTER = constants.center;

    function prepareDatesDifferences(datesDifferences, tickInterval) {
        var dateUnitInterval, i;
        if ("week" === tickInterval) {
            tickInterval = "day"
        }
        if ("quarter" === tickInterval) {
            tickInterval = "month"
        }
        if (datesDifferences[tickInterval]) {
            for (i = 0; i < dateUtils.dateUnitIntervals.length; i++) {
                dateUnitInterval = dateUtils.dateUnitIntervals[i];
                if (datesDifferences[dateUnitInterval]) {
                    datesDifferences[dateUnitInterval] = false;
                    datesDifferences.count--
                }
                if (dateUnitInterval === tickInterval) {
                    break
                }
            }
        }
    }

    function getMarkerDates(min, max, markerInterval) {
        var dates, origMin = min;
        min = correctDateWithUnitBeginning(min, markerInterval);
        max = correctDateWithUnitBeginning(max, markerInterval);
        dates = dateUtils.getSequenceByInterval(min, max, markerInterval);
        if (dates.length && origMin > dates[0]) {
            dates = dates.slice(1)
        }
        return dates
    }

    function getMarkerInterval(tickInterval) {
        var markerInterval = getNextDateUnit(tickInterval);
        if ("quarter" === markerInterval) {
            markerInterval = getNextDateUnit(markerInterval)
        }
        return markerInterval
    }

    function getMarkerFormat(curDate, prevDate, tickInterval, markerInterval) {
        var format = markerInterval,
            datesDifferences = prevDate && dateUtils.getDatesDifferences(prevDate, curDate);
        if (prevDate && "year" !== tickInterval) {
            prepareDatesDifferences(datesDifferences, tickInterval);
            format = formatHelper.getDateFormatByDifferences(datesDifferences)
        }
        return format
    }
    module.exports = {
        linear: {
            measureLabels: function() {
                return this._tickManager.getMaxLabelParams()
            },
            getMarkerTrackers: function() {
                return this._markerTrackers
            },
            _getSharpParam: function(opposite) {
                return this._isHorizontal ^ opposite ? "h" : "v"
            },
            _createAxisElement: function() {
                var axisCoord = this._axisPosition,
                    canvas = this._getCanvasStartEnd(),
                    points = this._isHorizontal ? [canvas.start, axisCoord, canvas.end, axisCoord] : [axisCoord, canvas.start, axisCoord, canvas.end];
                return this._renderer.path(points, "line")
            },
            _getTranslatedCoord: function(value, offset) {
                return this._translator.translate(value, offset)
            },
            _getCanvasStartEnd: function() {
                return {
                    start: this._translator.translateSpecialCase(constants.canvasPositionStart),
                    end: this._translator.translateSpecialCase(constants.canvasPositionEnd)
                }
            },
            _getScreenDelta: function() {
                return Math.abs(this._translator.translateSpecialCase(constants.canvasPositionStart) - this._translator.translateSpecialCase(constants.canvasPositionEnd))
            },
            _initAxisPositions: function() {
                var that = this,
                    position = that._options.position,
                    delta = 0;
                if (that.delta) {
                    delta = that.delta[position] || 0
                }
                that._axisPosition = that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + position) + delta
            },
            _getTickCoord: function(tick) {
                var coords, corrections = {
                        top: -1,
                        middle: -.5,
                        bottom: 0,
                        left: -1,
                        center: -.5,
                        right: 0
                    },
                    tickCorrection = corrections[this._options.tickOrientation || "center"];
                if (_isDefined(tick.posX) && _isDefined(tick.posY)) {
                    coords = {
                        x1: tick.posX,
                        y1: tick.posY + tickCorrection * tick.length,
                        x2: tick.posX,
                        y2: tick.posY + tickCorrection * tick.length + tick.length
                    }
                } else {
                    coords = null
                }
                return coords
            },
            _drawTitle: function() {
                var that = this,
                    options = that._options,
                    titleOptions = options.title,
                    attr = {
                        opacity: titleOptions.opacity,
                        align: CENTER
                    };
                if (!titleOptions.text || !that._axisTitleGroup) {
                    return
                }
                that._title = that._renderer.text(titleOptions.text, 0, 0).css(vizUtils.patchFontOptions(titleOptions.font)).attr(attr).append(that._axisTitleGroup)
            },
            _drawDateMarker: function(date, options) {
                var labelPosX, labelPosY, textElement, text, textSize, textIndent, pathElement, that = this,
                    markerOptions = that._options.marker;
                if (null === options.x) {
                    return
                }
                if (!options.withoutStick) {
                    pathElement = that._renderer.path([options.x, options.y, options.x, options.y + markerOptions.separatorHeight], "line").attr({
                        "stroke-width": markerOptions.width,
                        stroke: markerOptions.color,
                        "stroke-opacity": markerOptions.opacity,
                        sharp: "h"
                    }).append(that._axisElementsGroup)
                }
                text = String(constants.formatLabel(date, options.labelFormat));
                textElement = that._renderer.text(text, 0, 0).attr({
                    align: "left"
                }).css(vizUtils.patchFontOptions(markerOptions.label.font)).append(that._axisElementsGroup);
                textSize = textElement.getBBox();
                textIndent = markerOptions.width + markerOptions.textLeftIndent;
                labelPosX = this._translator.getBusinessRange().invert ? options.x - textIndent - textSize.width : options.x + textIndent;
                labelPosY = options.y + markerOptions.textTopIndent + textSize.height / 2;
                textElement.move(labelPosX, labelPosY);
                return {
                    labelStartPosX: labelPosX - textIndent,
                    labelEndPosX: labelPosX + textSize.width,
                    date: date,
                    dateMarkerStartPosX: options.x,
                    setTitle: function() {
                        this.title = text
                    },
                    dispose: function(onlyLabel) {
                        if (!onlyLabel && pathElement) {
                            pathElement.dispose();
                            pathElement = null
                        }
                        textElement.dispose();
                        textElement = null
                    }
                }
            },
            _drawDateMarkers: function() {
                var tickInterval, markerInterval, markerDates, prevDateMarker, markersAreaTop, dateMarker, curDate, that = this,
                    options = that._options,
                    translator = that._translator,
                    minBound = that._minBound,
                    dateMarkers = [],
                    invert = translator.getBusinessRange().invert,
                    xBound = translator.translateSpecialCase("canvas_position_end"),
                    i = 1;

                function draw(markerDate, format, withoutStick) {
                    return that._drawDateMarker(markerDate, {
                        x: translator.translate(markerDate),
                        y: markersAreaTop,
                        labelFormat: that._getLabelFormatOptions(format),
                        withoutStick: withoutStick
                    })
                }
                if ("datetime" !== options.argumentType || "discrete" === options.type || that._majorTicks.length <= 1) {
                    return
                }
                markersAreaTop = that._axisPosition + this._axisElementsGroup.getBBox().height + options.label.indentFromAxis + options.marker.topIndent;
                tickInterval = dateUtils.getDateUnitInterval(this._tickManager.getTickInterval());
                markerInterval = getMarkerInterval(tickInterval);
                markerDates = getMarkerDates(minBound, that._maxBound, markerInterval);
                if (markerDates.length > 1 || 1 === markerDates.length && minBound < markerDates[0]) {
                    for (i = 0; i < markerDates.length; i++) {
                        curDate = markerDates[i];
                        dateMarker = draw(curDate, getMarkerFormat(curDate, markerDates[i - 1] || minBound < curDate && minBound, tickInterval, markerInterval));
                        if (dateMarker) {
                            if (invert ? dateMarker.labelStartPosX < xBound : dateMarker.labelEndPosX > xBound) {
                                dateMarkers.push(dateMarker);
                                dateMarker.dispose(true);
                                dateMarker.setTitle()
                            } else {
                                if (that._checkMarkersPosition(dateMarker, prevDateMarker)) {
                                    dateMarkers.push(dateMarker);
                                    prevDateMarker = dateMarker
                                } else {
                                    dateMarker.dispose()
                                }
                            }
                        }
                    }
                    if (minBound < markerDates[0]) {
                        dateMarker = draw(minBound, getMarkerFormat(minBound, markerDates[0], tickInterval, markerInterval), true);
                        if (dateMarker) {
                            if (!that._checkMarkersPosition(dateMarker, dateMarkers[0])) {
                                dateMarker.dispose();
                                dateMarker.setTitle()
                            }
                            dateMarkers.unshift(dateMarker)
                        }
                    }
                }
                that._initializeMarkersTrackers(dateMarkers, that._axisElementsGroup, that._axisGroup.getBBox().width, markersAreaTop)
            },
            _initializeMarkersTrackers: function(dateMarkers, group, axisWidth, markersAreaTop) {
                var markerTracker, nextMarker, i, x, currentMarker, that = this,
                    separatorHeight = that._options.marker.separatorHeight,
                    renderer = that._renderer,
                    businessRange = this._translator.getBusinessRange();
                that._markerTrackers = [];
                for (i = 0; i < dateMarkers.length; i++) {
                    currentMarker = dateMarkers[i];
                    nextMarker = dateMarkers[i + 1] || {
                        dateMarkerStartPosX: businessRange.invert ? this._translator.translateSpecialCase("canvas_position_end") : axisWidth,
                        date: businessRange.max
                    };
                    x = currentMarker.dateMarkerStartPosX;
                    markerTracker = renderer.path([x, markersAreaTop, x, markersAreaTop + separatorHeight, nextMarker.dateMarkerStartPosX, markersAreaTop + separatorHeight, nextMarker.dateMarkerStartPosX, markersAreaTop, x, markersAreaTop]).attr({
                        "stroke-width": 1,
                        stroke: "grey",
                        fill: "grey",
                        "fill-opacity": 1e-4,
                        "stroke-opacity": 1e-4
                    }).append(group);
                    markerTracker.data("range", {
                        startValue: currentMarker.date,
                        endValue: nextMarker.date
                    });
                    if (currentMarker.title) {
                        markerTracker.setTitle(currentMarker.title)
                    }
                    that._markerTrackers.push(markerTracker)
                }
            },
            _checkMarkersPosition: function(dateMarker, prevDateMarker) {
                return void 0 === prevDateMarker || dateMarker.labelStartPosX > prevDateMarker.labelEndPosX || dateMarker.labelEndPosX < prevDateMarker.labelStartPosX
            },
            _getLabelFormatOptions: function(formatString) {
                var that = this,
                    markerLabelOptions = that._markerLabelOptions;
                if (!markerLabelOptions) {
                    that._markerLabelOptions = markerLabelOptions = _extend(true, {}, that._options.marker.label)
                }
                if (!_isDefined(that._options.marker.label.format)) {
                    markerLabelOptions.format = formatString
                }
                return markerLabelOptions
            },
            _adjustConstantLineLabels: function() {
                var label, line, lineBox, linesOptions, labelOptions, box, x, y, i, paddingTopBottom, paddingLeftRight, labelVerticalAlignment, labelHorizontalAlignment, labelIsInside, labelHeight, labelWidth, that = this,
                    options = that._options,
                    isHorizontal = that._isHorizontal,
                    lines = that._constantLines,
                    labels = that._constantLineLabels,
                    padding = isHorizontal ? {
                        top: 0,
                        bottom: 0
                    } : {
                        left: 0,
                        right: 0
                    },
                    delta = 0;
                if (void 0 === labels && void 0 === lines) {
                    return
                }
                for (i = 0; i < labels.length; i++) {
                    x = y = 0;
                    linesOptions = options.constantLines[i];
                    paddingTopBottom = linesOptions.paddingTopBottom;
                    paddingLeftRight = linesOptions.paddingLeftRight;
                    labelOptions = linesOptions.label;
                    labelVerticalAlignment = labelOptions.verticalAlignment;
                    labelHorizontalAlignment = labelOptions.horizontalAlignment;
                    labelIsInside = "inside" === labelOptions.position;
                    label = labels[i];
                    if (null !== label) {
                        line = lines[i];
                        box = label.getBBox();
                        lineBox = line.getBBox();
                        labelHeight = box.height;
                        labelWidth = box.width;
                        if (isHorizontal) {
                            if (labelIsInside) {
                                if (labelHorizontalAlignment === LEFT) {
                                    x -= paddingLeftRight
                                } else {
                                    x += paddingLeftRight
                                }
                                switch (labelVerticalAlignment) {
                                    case CENTER:
                                        y += lineBox.y + lineBox.height / 2 - box.y - labelHeight / 2;
                                        break;
                                    case BOTTOM:
                                        y += lineBox.y + lineBox.height - box.y - labelHeight - paddingTopBottom;
                                        break;
                                    default:
                                        y += lineBox.y - box.y + paddingTopBottom
                                }
                            } else {
                                if (labelVerticalAlignment === BOTTOM) {
                                    delta = that.delta && that.delta[BOTTOM] || 0;
                                    y += paddingTopBottom - box.y + that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + BOTTOM) + delta;
                                    if (padding[BOTTOM] < labelHeight + paddingTopBottom) {
                                        padding[BOTTOM] = labelHeight + paddingTopBottom
                                    }
                                } else {
                                    delta = that.delta && that.delta[TOP] || 0;
                                    y -= paddingTopBottom + box.y + labelHeight - that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + TOP) - delta;
                                    if (padding[TOP] < paddingTopBottom + labelHeight) {
                                        padding[TOP] = paddingTopBottom + labelHeight
                                    }
                                }
                            }
                        } else {
                            if (labelIsInside) {
                                switch (labelHorizontalAlignment) {
                                    case CENTER:
                                        x += lineBox.x + lineBox.width / 2 - box.x - labelWidth / 2;
                                        break;
                                    case RIGHT:
                                        x -= paddingLeftRight;
                                        break;
                                    default:
                                        x += paddingLeftRight
                                }
                                if (labelVerticalAlignment === BOTTOM) {
                                    y += lineBox.y - box.y + paddingTopBottom
                                } else {
                                    y += lineBox.y - box.y - labelHeight - paddingTopBottom
                                }
                            } else {
                                y += lineBox.y + lineBox.height / 2 - box.y - labelHeight / 2;
                                if (labelHorizontalAlignment === RIGHT) {
                                    x += paddingLeftRight;
                                    if (padding[RIGHT] < paddingLeftRight + labelWidth) {
                                        padding[RIGHT] = paddingLeftRight + labelWidth
                                    }
                                } else {
                                    x -= paddingLeftRight;
                                    if (padding[LEFT] < paddingLeftRight + labelWidth) {
                                        padding[LEFT] = paddingLeftRight + labelWidth
                                    }
                                }
                            }
                        }
                        label.move(x, y)
                    }
                }
                that.padding = padding
            },
            _checkAlignmentConstantLineLabels: function(labelOptions) {
                var position = labelOptions.position,
                    verticalAlignment = (labelOptions.verticalAlignment || "").toLowerCase(),
                    horizontalAlignment = (labelOptions.horizontalAlignment || "").toLowerCase();
                if (this._isHorizontal) {
                    if ("outside" === position) {
                        verticalAlignment = verticalAlignment === BOTTOM ? BOTTOM : TOP;
                        horizontalAlignment = CENTER
                    } else {
                        verticalAlignment = verticalAlignment === CENTER ? CENTER : verticalAlignment === BOTTOM ? BOTTOM : TOP;
                        horizontalAlignment = horizontalAlignment === LEFT ? LEFT : RIGHT
                    }
                } else {
                    if ("outside" === position) {
                        verticalAlignment = CENTER;
                        horizontalAlignment = horizontalAlignment === LEFT ? LEFT : RIGHT
                    } else {
                        verticalAlignment = verticalAlignment === BOTTOM ? BOTTOM : TOP;
                        horizontalAlignment = horizontalAlignment === RIGHT ? RIGHT : horizontalAlignment === CENTER ? CENTER : LEFT
                    }
                }
                labelOptions.verticalAlignment = verticalAlignment;
                labelOptions.horizontalAlignment = horizontalAlignment
            },
            _getConstantLineLabelsCoords: function(value, lineLabelOptions) {
                var that = this,
                    additionalTranslator = that._additionalTranslator,
                    align = CENTER,
                    x = value,
                    y = value;
                if (that._isHorizontal) {
                    y = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.verticalAlignment)
                } else {
                    x = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.horizontalAlignment)
                }
                switch (lineLabelOptions.horizontalAlignment) {
                    case LEFT:
                        align = !that._isHorizontal && "inside" === lineLabelOptions.position ? LEFT : RIGHT;
                        break;
                    case CENTER:
                        align = CENTER;
                        break;
                    case RIGHT:
                        align = !that._isHorizontal && "inside" === lineLabelOptions.position ? RIGHT : LEFT
                }
                return {
                    x: x,
                    y: y,
                    align: align
                }
            },
            _getAdjustedStripLabelCoords: function(strip) {
                var x = 0,
                    y = 0,
                    stripOptions = strip.options,
                    horizontalAlignment = stripOptions.label.horizontalAlignment,
                    verticalAlignment = stripOptions.label.verticalAlignment,
                    box = strip.label.getBBox(),
                    rectBox = strip.rect.getBBox();
                if (horizontalAlignment === LEFT) {
                    x += stripOptions.paddingLeftRight
                } else {
                    if (horizontalAlignment === RIGHT) {
                        x -= stripOptions.paddingLeftRight
                    }
                }
                if (verticalAlignment === TOP) {
                    y += rectBox.y - box.y + stripOptions.paddingTopBottom
                } else {
                    if (verticalAlignment === CENTER) {
                        y += rectBox.y + rectBox.height / 2 - box.y - box.height / 2
                    } else {
                        if (verticalAlignment === BOTTOM) {
                            y -= stripOptions.paddingTopBottom
                        }
                    }
                }
                return {
                    x: x,
                    y: y
                }
            },
            _adjustTitle: function() {
                var boxGroup, boxTitle, params, heightTitle, noLabels, that = this,
                    options = that._options,
                    position = options.position,
                    title = that._title,
                    margin = options.title.margin,
                    centerPosition = that._translator.translateSpecialCase(CANVAS_POSITION_PREFIX + CENTER),
                    axisElementsGroup = that._axisElementsGroup,
                    axisPosition = that._axisPosition;
                if (!title || !axisElementsGroup) {
                    return
                }
                boxTitle = title.getBBox();
                boxGroup = axisElementsGroup.getBBox();
                noLabels = boxGroup.isEmpty;
                heightTitle = boxTitle.height;
                if (that._isHorizontal) {
                    if (position === BOTTOM) {
                        params = {
                            y: (noLabels ? axisPosition : boxGroup.y + boxGroup.height) - boxTitle.y + margin,
                            x: centerPosition
                        }
                    } else {
                        params = {
                            y: (noLabels ? axisPosition : boxGroup.y) - heightTitle - boxTitle.y - margin,
                            x: centerPosition
                        }
                    }
                } else {
                    if (position === LEFT) {
                        params = {
                            x: (noLabels ? axisPosition : boxGroup.x) - heightTitle - boxTitle.y - margin,
                            y: centerPosition
                        }
                    } else {
                        params = {
                            x: (noLabels ? axisPosition : boxGroup.x + boxGroup.width) + heightTitle + boxTitle.y + margin,
                            y: centerPosition
                        }
                    }
                    params.rotate = options.position === LEFT ? 270 : 90
                }
                title.attr(params)
            },
            coordsIn: function(x, y) {
                var rect = this.getBoundingRect();
                return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
            },
            _boundaryTicksVisibility: {
                min: true,
                max: true
            },
            _getOverlappingBehaviorOptions: function() {
                var that = this,
                    options = that._options,
                    getText = function() {
                        return ""
                    },
                    overlappingBehavior = options.label.overlappingBehavior ? _extend({}, options.label.overlappingBehavior) : null;
                if (overlappingBehavior) {
                    if (!that._isHorizontal) {
                        overlappingBehavior.mode = constants.validateOverlappingMode(overlappingBehavior.mode)
                    }
                    if ("rotate" !== overlappingBehavior.mode) {
                        overlappingBehavior.rotationAngle = 0
                    }
                }
                if (!that._translator.getBusinessRange().stubData) {
                    getText = function(value, labelOptions) {
                        return constants.formatLabel(value, labelOptions, {
                            min: options.min,
                            max: options.max
                        })
                    }
                }
                return {
                    hasLabelFormat: that._hasLabelFormat,
                    labelOptions: options.label,
                    isMarkersVisible: "discrete" === options.type ? false : options.marker.visible,
                    overlappingBehavior: overlappingBehavior,
                    isHorizontal: that._isHorizontal,
                    textOptions: that._textOptions,
                    textFontStyles: that._textFontStyles,
                    textSpacing: options.label.minSpacing,
                    getText: getText,
                    renderText: function(text, x, y, options) {
                        return that._renderer.text(text, x, y, options).append(that._renderer.root)
                    },
                    translate: function(value, useAdditionalTranslator) {
                        return useAdditionalTranslator ? that._additionalTranslator.translate(value) : that._translator.translate(value)
                    },
                    addMinMax: options.showCustomBoundaryTicks ? that._boundaryTicksVisibility : void 0
                }
            },
            _getMinMax: function() {
                return {
                    min: this._options.min,
                    max: this._options.max
                }
            },
            _getStick: function() {
                return !this._options.valueMarginsEnabled
            },
            _getStripLabelCoords: function(stripLabelOptions, stripFrom, stripTo) {
                var x, y, that = this,
                    additionalTranslator = that._additionalTranslator,
                    isHorizontal = that._isHorizontal,
                    align = isHorizontal ? CENTER : LEFT;
                if (isHorizontal) {
                    if (stripLabelOptions.horizontalAlignment === CENTER) {
                        x = stripFrom + (stripTo - stripFrom) / 2;
                        align = CENTER
                    } else {
                        if (stripLabelOptions.horizontalAlignment === LEFT) {
                            x = stripFrom;
                            align = LEFT
                        } else {
                            if (stripLabelOptions.horizontalAlignment === RIGHT) {
                                x = stripTo;
                                align = RIGHT
                            }
                        }
                    }
                    y = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.verticalAlignment)
                } else {
                    x = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.horizontalAlignment);
                    align = stripLabelOptions.horizontalAlignment;
                    if (stripLabelOptions.verticalAlignment === TOP) {
                        y = stripFrom
                    } else {
                        if (stripLabelOptions.verticalAlignment === CENTER) {
                            y = stripTo + (stripFrom - stripTo) / 2
                        } else {
                            if (stripLabelOptions.verticalAlignment === BOTTOM) {
                                y = stripTo
                            }
                        }
                    }
                }
                return {
                    x: x,
                    y: y,
                    align: align
                }
            },
            _getTranslatedValue: function(value, y, offset) {
                return {
                    x: this._translator.translate(value, offset, "semidiscrete" === this._options.type && this._options.tickInterval),
                    y: y
                }
            },
            _getSkippedCategory: function() {
                var skippedCategory, categories = this._translator.getVisibleCategories() || this._translator.getBusinessRange().categories;
                if (categories && categories.length && !!this._tickOffset) {
                    skippedCategory = categories[categories.length - 1]
                }
                return skippedCategory
            },
            _getSpiderCategoryOption: $.noop
        }
    }
});
