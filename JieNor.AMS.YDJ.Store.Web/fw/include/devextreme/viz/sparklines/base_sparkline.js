/** 
 * DevExtreme (viz/sparklines/base_sparkline.js)
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
        BaseWidget = require("../core/base_widget"),
        DEFAULT_LINE_SPACING = 2,
        DEFAULT_EVENTS_DELAY = 200,
        TOUCH_EVENTS_DELAY = 1e3,
        eventUtils = require("../../events/utils"),
        wheelEvent = require("../../events/core/wheel"),
        baseThemeManagerModule = require("../core/base_theme_manager"),
        translator2DModule = require("../translators/translator2d"),
        _abs = Math.abs,
        _extend = $.extend,
        _noop = $.noop;

    function generateDefaultCustomizeTooltipCallback(fontOptions, rtlEnabled) {
        var lineSpacing = fontOptions.lineSpacing,
            lineHeight = (void 0 !== lineSpacing && null !== lineSpacing ? lineSpacing : DEFAULT_LINE_SPACING) + fontOptions.size;
        return function(customizeObject) {
            var html = "",
                vt = customizeObject.valueText;
            for (var i = 0; i < vt.length; i += 2) {
                html += "<tr><td>" + vt[i] + "</td><td style='width: 15px'></td><td style='text-align: " + (rtlEnabled ? "left" : "right") + "'>" + vt[i + 1] + "</td></tr>"
            }
            return {
                html: "<table style='border-spacing:0px; line-height: " + lineHeight + "px'>" + html + "</table>"
            }
        }
    }

    function generateCustomizeTooltipCallback(customizeTooltip, fontOptions, rtlEnabled) {
        var defaultCustomizeTooltip = generateDefaultCustomizeTooltipCallback(fontOptions, rtlEnabled);
        if ($.isFunction(customizeTooltip)) {
            return function(customizeObject) {
                var res = customizeTooltip.call(customizeObject, customizeObject);
                if (!("html" in res) && !("text" in res)) {
                    _extend(res, defaultCustomizeTooltip.call(customizeObject, customizeObject))
                }
                return res
            }
        } else {
            return defaultCustomizeTooltip
        }
    }
    var BaseSparkline = BaseWidget.inherit({
        _setDeprecatedOptions: function() {
            this.callBase();
            _extend(this._deprecatedOptions, {
                "tooltip.verticalAlignment": {
                    since: "15.1",
                    message: "Now tootips are aligned automatically"
                },
                "tooltip.horizontalAlignment": {
                    since: "15.1",
                    message: "Now tootips are aligned automatically"
                }
            })
        },
        _getLayoutItems: _noop,
        _useLinks: false,
        _themeDependentChanges: ["OPTIONS"],
        _initCore: function() {
            var that = this;
            that._tooltipTracker = that._renderer.root;
            that._tooltipTracker.attr({
                "pointer-events": "visible"
            });
            that._createHtmlElements();
            that._initTooltipEvents()
        },
        _getDefaultSize: function() {
            return this._defaultSize
        },
        _disposeCore: function() {
            this._disposeWidgetElements();
            this._disposeTooltipEvents();
            this._ranges = null
        },
        _optionChangesOrder: ["OPTIONS"],
        _change_OPTIONS: function() {
            this._prepareOptions();
            this._change(["UPDATE"])
        },
        _customChangesOrder: ["UPDATE"],
        _change_UPDATE: function() {
            this._update()
        },
        _update: function() {
            var that = this;
            if (that._tooltipShown) {
                that._tooltipShown = false;
                that._tooltip.hide()
            }
            that._cleanWidgetElements();
            that._cleanTranslators();
            that._updateWidgetElements();
            that._drawWidgetElements()
        },
        _updateWidgetElements: function() {
            this._updateRange();
            this._updateTranslator()
        },
        _applySize: function(rect) {
            this._allOptions.size = {
                width: rect[2] - rect[0],
                height: rect[3] - rect[1]
            };
            this._change(["UPDATE"])
        },
        _cleanTranslators: function() {
            this._translatorX = null;
            this._translatorY = null
        },
        _setupResizeHandler: _noop,
        _prepareOptions: function() {
            return _extend(true, {}, this._themeManager.theme(), this.option())
        },
        _createThemeManager: function() {
            var themeManager = new baseThemeManagerModule.BaseThemeManager;
            themeManager._themeSection = this._widgetType;
            themeManager._fontFields = ["tooltip.font"];
            return themeManager
        },
        _getTooltipCoords: function() {
            var canvas = this._canvas,
                rootOffset = this._renderer.getRootOffset();
            return {
                x: canvas.width / 2 + rootOffset.left,
                y: canvas.height / 2 + rootOffset.top
            }
        },
        _initTooltipEvents: function() {
            var that = this,
                data = {
                    widget: that
                };
            that._showTooltipCallback = function() {
                var tooltip;
                that._showTooltipTimeout = null;
                if (!that._tooltipShown) {
                    that._tooltipShown = true;
                    tooltip = that._getTooltip();
                    tooltip.isEnabled() && that._tooltip.show(that._getTooltipData(), that._getTooltipCoords(), {})
                }
            };
            that._hideTooltipCallback = function() {
                that._hideTooltipTimeout = null;
                if (that._tooltipShown) {
                    that._tooltipShown = false;
                    that._tooltip.hide()
                }
            };
            that._disposeCallbacks = function() {
                that = that._showTooltipCallback = that._hideTooltipCallback = that._disposeCallbacks = null
            };
            that._tooltipTracker.on(mouseEvents, data).on(touchEvents, data).on(mouseWheelEvents, data);
            that._tooltipTracker.on(menuEvents)
        },
        _disposeTooltipEvents: function() {
            var that = this;
            clearTimeout(that._showTooltipTimeout);
            clearTimeout(that._hideTooltipTimeout);
            that._tooltipTracker.off();
            that._disposeCallbacks()
        },
        _updateTranslator: function() {
            var that = this,
                canvas = this._canvas,
                ranges = this._ranges;
            that._translatorX = new translator2DModule.Translator2D(ranges.arg, canvas, {
                isHorizontal: true
            });
            that._translatorY = new translator2DModule.Translator2D(ranges.val, canvas)
        },
        _getTooltip: function() {
            var that = this;
            if (!that._tooltip) {
                _initTooltip.apply(this, arguments);
                that._setTooltipRendererOptions(that._tooltipRendererOptions);
                that._tooltipRendererOptions = null;
                that._setTooltipOptions()
            }
            return that._tooltip
        }
    });
    var menuEvents = {
        "contextmenu.sparkline-tooltip": function(event) {
            if (eventUtils.isTouchEvent(event) || eventUtils.isPointerEvent(event)) {
                event.preventDefault()
            }
        },
        "MSHoldVisual.sparkline-tooltip": function(event) {
            event.preventDefault()
        }
    };
    var mouseEvents = {
        "mouseover.sparkline-tooltip": function(event) {
            isPointerDownCalled = false;
            var widget = event.data.widget;
            widget._x = event.pageX;
            widget._y = event.pageY;
            widget._tooltipTracker.off(mouseMoveEvents).on(mouseMoveEvents, event.data);
            widget._showTooltip(DEFAULT_EVENTS_DELAY)
        },
        "mouseout.sparkline-tooltip": function(event) {
            if (isPointerDownCalled) {
                return
            }
            var widget = event.data.widget;
            widget._tooltipTracker.off(mouseMoveEvents);
            widget._hideTooltip(DEFAULT_EVENTS_DELAY)
        }
    };
    var mouseWheelEvents = {};
    mouseWheelEvents[wheelEvent.name + ".sparkline-tooltip"] = function(event) {
        event.data.widget._hideTooltip()
    };
    var mouseMoveEvents = {
        "mousemove.sparkline-tooltip": function(event) {
            var widget = event.data.widget;
            if (widget._showTooltipTimeout && (_abs(widget._x - event.pageX) > 3 || _abs(widget._y - event.pageY) > 3)) {
                widget._x = event.pageX;
                widget._y = event.pageY;
                widget._showTooltip(DEFAULT_EVENTS_DELAY)
            }
        }
    };
    var active_touch_tooltip_widget = null,
        touchstartTooltipProcessing = function(event) {
            event.preventDefault();
            var widget = active_touch_tooltip_widget;
            if (widget && widget !== event.data.widget) {
                widget._hideTooltip(DEFAULT_EVENTS_DELAY)
            }
            widget = active_touch_tooltip_widget = event.data.widget;
            widget._showTooltip(TOUCH_EVENTS_DELAY);
            widget._touch = true
        },
        touchstartDocumentProcessing = function() {
            var widget = active_touch_tooltip_widget;
            if (widget) {
                if (!widget._touch) {
                    widget._hideTooltip(DEFAULT_EVENTS_DELAY);
                    active_touch_tooltip_widget = null
                }
                widget._touch = null
            }
        },
        touchendDocumentProcessing = function() {
            var widget = active_touch_tooltip_widget;
            if (widget) {
                if (widget._showTooltipTimeout) {
                    widget._hideTooltip(DEFAULT_EVENTS_DELAY);
                    active_touch_tooltip_widget = null
                }
            }
        },
        isPointerDownCalled = false;
    var touchEvents = {
        "pointerdown.sparkline-tooltip": touchstartTooltipProcessing,
        "touchstart.sparkline-tooltip": touchstartTooltipProcessing
    };
    $(document).on({
        "pointerdown.sparkline-tooltip": function() {
            isPointerDownCalled = true;
            touchstartDocumentProcessing()
        },
        "touchstart.sparkline-tooltip": touchstartDocumentProcessing,
        "pointerup.sparkline-tooltip": touchendDocumentProcessing,
        "touchend.sparkline-tooltip": touchendDocumentProcessing
    });
    module.exports = BaseSparkline;
    BaseSparkline.addPlugin(require("../core/tooltip").plugin);
    var _initTooltip = BaseSparkline.prototype._initTooltip;
    BaseSparkline.prototype._initTooltip = _noop;
    var _disposeTooltip = BaseSparkline.prototype._disposeTooltip;
    BaseSparkline.prototype._disposeTooltip = function() {
        if (this._tooltip) {
            _disposeTooltip.apply(this, arguments)
        }
    };
    BaseSparkline.prototype._setTooltipRendererOptions = function() {
        var options = this._getRendererOptions();
        if (this._tooltip) {
            this._tooltip.setRendererOptions(options)
        } else {
            this._tooltipRendererOptions = options
        }
    };
    BaseSparkline.prototype._setTooltipOptions = function() {
        var tooltip = this._tooltip,
            options = tooltip && this._getOption("tooltip");
        tooltip && tooltip.update(_extend({}, options, {
            customizeTooltip: generateCustomizeTooltipCallback(options.customizeTooltip, options.font, this.option("rtlEnabled")),
            enabled: options.enabled && this._isTooltipEnabled()
        }))
    };
    BaseSparkline.prototype._showTooltip = function(delay) {
        var that = this;
        clearTimeout(that._hideTooltipTimeout);
        that._hideTooltipTimeout = null;
        clearTimeout(that._showTooltipTimeout);
        that._showTooltipTimeout = setTimeout(that._showTooltipCallback, delay)
    };
    BaseSparkline.prototype._hideTooltip = function(delay) {
        var that = this;
        clearTimeout(that._showTooltipTimeout);
        that._showTooltipTimeout = null;
        clearTimeout(that._hideTooltipTimeout);
        if (delay) {
            that._hideTooltipTimeout = setTimeout(that._hideTooltipCallback, delay)
        } else {
            that._hideTooltipCallback()
        }
    };
    var exportPlugin = $.extend(true, {}, require("../core/export").plugin, {
        init: _noop,
        dispose: _noop,
        customize: null,
        members: {
            _getExportMenuOptions: null
        }
    });
    BaseSparkline.addPlugin(exportPlugin)
});
