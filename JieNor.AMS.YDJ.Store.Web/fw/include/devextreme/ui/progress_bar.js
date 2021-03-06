/** 
 * DevExtreme (ui/progress_bar.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        TrackBar = require("./track_bar"),
        registerComponent = require("../core/component_registrator");
    var PROGRESSBAR_CLASS = "dx-progressbar",
        PROGRESSBAR_CONTAINER_CLASS = "dx-progressbar-container",
        PROGRESSBAR_RANGE_CONTAINER_CLASS = "dx-progressbar-range-container",
        PROGRESSBAR_RANGE_CLASS = "dx-progressbar-range",
        PROGRESSBAR_WRAPPER_CLASS = "dx-progressbar-wrapper",
        PROGRESSBAR_STATUS_CLASS = "dx-progressbar-status",
        PROGRESSBAR_INDETERMINATE_SEGMENT_CONTAINER = "dx-progressbar-animating-container",
        PROGRESSBAR_INDETERMINATE_SEGMENT = "dx-progressbar-animating-segment";
    var ProgressBar = TrackBar.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                statusFormat: function(ratio, value) {
                    return "Progress: " + Math.round(100 * ratio) + "%"
                },
                showStatus: true,
                onComplete: null,
                activeStateEnabled: false,
                statusPosition: "bottom left",
                _animatingSegmentCount: 0
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    platform: "win"
                },
                options: {
                    _animatingSegmentCount: 5
                }
            }, {
                device: function(device) {
                    return "android" === device.platform
                },
                options: {
                    _animatingSegmentCount: 2
                }
            }])
        },
        _init: function() {
            this.callBase()
        },
        _render: function() {
            this._createCompleteAction();
            this._renderStatus();
            this.callBase();
            this.element().addClass(PROGRESSBAR_CLASS);
            this.setAria("role", "progressbar");
            this._$wrapper.addClass(PROGRESSBAR_WRAPPER_CLASS);
            this._$bar.addClass(PROGRESSBAR_CONTAINER_CLASS);
            $("<div>").addClass(PROGRESSBAR_RANGE_CONTAINER_CLASS).appendTo(this._$wrapper).append(this._$bar);
            this._$range.addClass(PROGRESSBAR_RANGE_CLASS);
            this._toggleStatus(this.option("showStatus"))
        },
        _createCompleteAction: function() {
            this._completeAction = this._createActionByOption("onComplete")
        },
        _renderStatus: function() {
            this._$status = $("<div>").addClass(PROGRESSBAR_STATUS_CLASS)
        },
        _renderIndeterminateState: function() {
            this._$segmentContainer = $("<div>").addClass(PROGRESSBAR_INDETERMINATE_SEGMENT_CONTAINER);
            var segments = this.option("_animatingSegmentCount");
            for (var i = 0; i < segments; i++) {
                $("<div>").addClass(PROGRESSBAR_INDETERMINATE_SEGMENT).addClass(PROGRESSBAR_INDETERMINATE_SEGMENT + "-" + (i + 1)).appendTo(this._$segmentContainer)
            }
            this._$segmentContainer.appendTo(this._$wrapper)
        },
        _toggleStatus: function(value) {
            var splittedPosition = this.option("statusPosition").split(" ");
            if (value) {
                if ("top" === splittedPosition[0] || "left" === splittedPosition[0]) {
                    this._$status.prependTo(this._$wrapper)
                } else {
                    this._$status.appendTo(this._$wrapper)
                }
            } else {
                this._$status.detach()
            }
            this._togglePositionClass()
        },
        _togglePositionClass: function() {
            var position = this.option("statusPosition"),
                splittedPosition = position.split(" ");
            this._$wrapper.removeClass("dx-position-top-left dx-position-top-right dx-position-bottom-left dx-position-bottom-right dx-position-left dx-position-right");
            var positionClass = "dx-position-" + splittedPosition[0];
            if (splittedPosition[1]) {
                positionClass += "-" + splittedPosition[1]
            }
            this._$wrapper.addClass(positionClass)
        },
        _toggleIndeterminateState: function(value) {
            if (value) {
                this._renderIndeterminateState();
                this._$bar.toggle(false)
            } else {
                this._$bar.toggle(true);
                this._$segmentContainer.remove();
                delete this._$segmentContainer
            }
        },
        _renderValue: function() {
            var val = this.option("value"),
                max = this.option("max");
            if (!val && 0 !== val) {
                this._toggleIndeterminateState(true);
                return
            }
            if (this._$segmentContainer) {
                this._toggleIndeterminateState(false)
            }
            if (val === max) {
                this._completeAction()
            }
            this.callBase();
            this._setStatus()
        },
        _setStatus: function() {
            var format = this.option("statusFormat");
            if ($.isFunction(format)) {
                format = $.proxy(format, this)
            } else {
                format = function(value) {
                    return value
                }
            }
            var statusText = format(this._currentRatio, this.option("value"));
            this._$status.text(statusText)
        },
        _dispose: function() {
            this._$status.remove();
            this.callBase()
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "statusFormat":
                    this._setStatus();
                    break;
                case "showStatus":
                    this._toggleStatus(args.value);
                    break;
                case "statusPosition":
                    this._toggleStatus(this.option("showStatus"));
                    break;
                case "onComplete":
                    this._createCompleteAction();
                    break;
                case "_animatingSegmentCount":
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxProgressBar", ProgressBar);
    module.exports = ProgressBar
});
