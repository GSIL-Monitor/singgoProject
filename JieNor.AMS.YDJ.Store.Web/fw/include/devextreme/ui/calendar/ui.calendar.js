/** 
 * DevExtreme (ui/calendar/ui.calendar.js)
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
        Guid = require("../../core/guid"),
        registerComponent = require("../../core/component_registrator"),
        commonUtils = require("../../core/utils/common"),
        Button = require("../button"),
        Editor = require("../editor/editor"),
        Swipeable = require("../../events/gesture/swipeable"),
        Navigator = require("./ui.calendar.navigator"),
        Views = require("./ui.calendar.views"),
        translator = require("../../animation/translator"),
        browser = require("../../core/utils/browser"),
        dateUtils = require("../../core/utils/date"),
        devices = require("../../core/devices"),
        fx = require("../../animation/fx"),
        dateLocalization = require("../../localization/date"),
        config = require("../../core/config"),
        messageLocalization = require("../../localization/message");
    var CALENDAR_CLASS = "dx-calendar",
        CALENDAR_BODY_CLASS = "dx-calendar-body",
        CALENDAR_CELL_CLASS = "dx-calendar-cell",
        CALENDAR_FOOTER_CLASS = "dx-calendar-footer",
        CALENDAR_TODAY_BUTTON_CLASS = "dx-calendar-today-button",
        CALENDAR_HAS_FOOTER_CLASS = "dx-calendar-with-footer",
        CALENDAR_VIEWS_WRAPPER_CLASS = "dx-calendar-views-wrapper",
        CALENDAR_VIEW_CLASS = "dx-calendar-view",
        FOCUSED_STATE_CLASS = "dx-state-focused",
        ANIMATION_DURATION_SHOW_VIEW = 250,
        POP_ANIMATION_FROM = .6,
        POP_ANIMATION_TO = 1,
        CALENDAR_DATE_VALUE_KEY = "dxDateValueKey",
        LEVEL_COMPARE_MAP = {
            month: 3,
            year: 2,
            decade: 1,
            century: 0
        };
    var Calendar = Editor.inherit({
        _activeStateUnit: "." + CALENDAR_CELL_CLASS,
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                hoverStateEnabled: true,
                activeStateEnabled: true,
                currentDate: new Date,
                value: null,
                min: new Date(1e3, 0),
                max: new Date(3e3, 0),
                firstDayOfWeek: void 0,
                zoomLevel: "month",
                maxZoomLevel: "month",
                minZoomLevel: "century",
                showTodayButton: false,
                cellTemplate: "cell",
                onCellClick: null,
                onContouredChanged: null,
                hasFocus: function(element) {
                    return element.hasClass(FOCUSED_STATE_CLASS)
                }
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function() {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }])
        },
        _supportedKeys: function() {
            return $.extend(this.callBase(), {
                rightArrow: function(e) {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this._waitRenderView(1)
                    } else {
                        this._moveCurrentDate(1 * this._getRtlCorrection())
                    }
                },
                leftArrow: function(e) {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this._waitRenderView(-1)
                    } else {
                        this._moveCurrentDate(-1 * this._getRtlCorrection())
                    }
                },
                upArrow: function(e) {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this._navigateUp()
                    } else {
                        if (fx.isAnimating(this._view.element())) {
                            return
                        }
                        this._moveCurrentDate(-1 * this._view.option("colCount"))
                    }
                },
                downArrow: function(e) {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this._navigateDown()
                    } else {
                        if (fx.isAnimating(this._view.element())) {
                            return
                        }
                        this._moveCurrentDate(1 * this._view.option("colCount"))
                    }
                },
                home: function(e) {
                    e.preventDefault();
                    var zoomLevel = this.option("zoomLevel");
                    var currentDate = this.option("currentDate");
                    var min = this._dateOption("min");
                    var date = dateUtils.sameView(zoomLevel, currentDate, min) ? min : dateUtils.getViewFirstCellDate(zoomLevel, currentDate);
                    this.option("currentDate", date)
                },
                end: function(e) {
                    e.preventDefault();
                    var zoomLevel = this.option("zoomLevel");
                    var currentDate = this.option("currentDate");
                    var max = this._dateOption("max");
                    var date = dateUtils.sameView(zoomLevel, currentDate, max) ? max : dateUtils.getViewLastCellDate(zoomLevel, currentDate);
                    this.option("currentDate", date)
                },
                pageUp: function(e) {
                    e.preventDefault();
                    this._waitRenderView(-1)
                },
                pageDown: function(e) {
                    e.preventDefault();
                    this._waitRenderView(1)
                },
                tab: $.noop,
                enter: function(e) {
                    if (!this._isMaxZoomLevel()) {
                        this._navigateDown()
                    } else {
                        var value = this._updateTimeComponent(this.option("currentDate"));
                        this._dateOption("value", value)
                    }
                }
            })
        },
        _getSerializationFormat: function() {
            var value = this.option("value");
            if (commonUtils.isNumber(value)) {
                return "number"
            }
            if (!commonUtils.isString(value)) {
                return
            }
            return dateUtils.getDateSerializationFormat(value)
        },
        _convertToDate: function(value) {
            var serializationFormat = this._getSerializationFormat();
            var date = dateUtils.deserializeDate(value, serializationFormat, $.proxy(dateLocalization.parse, dateLocalization));
            return date
        },
        _dateOption: function(optionName, optionValue) {
            if (1 === arguments.length) {
                return this._convertToDate(this.option(optionName))
            }
            var serializationFormat = this._getSerializationFormat();
            this.option(optionName, dateUtils.serializeDate(optionValue, serializationFormat, $.proxy(dateLocalization.format, dateLocalization)))
        },
        _moveCurrentDate: function(offset) {
            var currentDate = new Date(this.option("currentDate"));
            var newDate = new Date(currentDate);
            var zoomLevel = this.option("zoomLevel");
            switch (zoomLevel) {
                case "month":
                    newDate.setDate(currentDate.getDate() + offset);
                    break;
                case "year":
                    newDate.setMonth(currentDate.getMonth() + offset);
                    break;
                case "decade":
                    newDate.setFullYear(currentDate.getFullYear() + offset);
                    break;
                case "century":
                    newDate.setFullYear(currentDate.getFullYear() + 10 * offset)
            }
            var offsetCorrection = 2 * offset / Math.abs(offset);
            if (Math.abs(offset) > 1 && !dateUtils.sameView(zoomLevel, currentDate, newDate)) {
                if ("decade" === zoomLevel) {
                    newDate.setFullYear(currentDate.getFullYear() + offset - offsetCorrection)
                }
                if ("century" === zoomLevel) {
                    newDate.setFullYear(currentDate.getFullYear() + 10 * (offset - offsetCorrection))
                }
            }
            this.option("currentDate", newDate)
        },
        _init: function() {
            this.callBase();
            this._correctZoomLevel();
            this._initCurrentDate();
            this._initActions()
        },
        _correctZoomLevel: function() {
            var minZoomLevel = this.option("minZoomLevel"),
                maxZoomLevel = this.option("maxZoomLevel"),
                zoomLevel = this.option("zoomLevel");
            if (LEVEL_COMPARE_MAP[maxZoomLevel] < LEVEL_COMPARE_MAP[minZoomLevel]) {
                return
            }
            if (LEVEL_COMPARE_MAP[zoomLevel] > LEVEL_COMPARE_MAP[maxZoomLevel]) {
                this.option("zoomLevel", maxZoomLevel)
            } else {
                if (LEVEL_COMPARE_MAP[zoomLevel] < LEVEL_COMPARE_MAP[minZoomLevel]) {
                    this.option("zoomLevel", minZoomLevel)
                }
            }
        },
        _initCurrentDate: function() {
            var currentDate = this._getNormalizedDate(this._dateOption("value")) || this._getNormalizedDate(this.option("currentDate"));
            this.option("currentDate", currentDate)
        },
        _getNormalizedDate: function(date) {
            date = dateUtils.normalizeDate(date, this._getMinDate(), this._getMaxDate());
            return commonUtils.isDefined(date) ? new Date(date) : date
        },
        _initActions: function() {
            this._cellClickAction = this._createActionByOption("onCellClick");
            this._onContouredChanged = this._createActionByOption("onContouredChanged")
        },
        _updateCurrentDate: function(date) {
            if (fx.isAnimating(this._$viewsWrapper)) {
                fx.stop(this._$viewsWrapper, true)
            }
            var min = this._getMinDate(),
                max = this._getMaxDate();
            if (min > max) {
                this.option("currentDate", new Date);
                return
            }
            var normalizedDate = this._getNormalizedDate(date);
            if (date.getTime() !== normalizedDate.getTime()) {
                this.option("currentDate", new Date(normalizedDate));
                return
            }
            var offset = this._getViewsOffset(this._view.option("date"), normalizedDate);
            if (0 !== offset && !this._isMaxZoomLevel() && this._isOtherViewCellClicked) {
                offset = 0
            }
            if (this._view && 0 !== offset && !this._suppressNavigation) {
                this._navigate(offset, normalizedDate)
            } else {
                this._renderNavigator();
                this._setViewContoured(normalizedDate);
                this._updateAriaId(normalizedDate)
            }
        },
        _setViewContoured: function(date) {
            if (this.option("hasFocus")(this._focusTarget())) {
                this._view.option("contouredDate", date)
            }
        },
        _getMinDate: function() {
            if (this.min) {
                return this.min
            }
            this.min = this._dateOption("min") || new Date(1e3, 0);
            return this.min
        },
        _getMaxDate: function() {
            if (this.max) {
                return this.max
            }
            this.max = this._dateOption("max") || new Date(3e3, 0);
            return this.max
        },
        _getViewsOffset: function(startDate, endDate) {
            var zoomLevel = this.option("zoomLevel");
            if ("month" === zoomLevel) {
                return this._getMonthsOffset(startDate, endDate)
            }
            var zoomCorrection;
            switch (zoomLevel) {
                case "century":
                    zoomCorrection = 100;
                    break;
                case "decade":
                    zoomCorrection = 10;
                    break;
                default:
                    zoomCorrection = 1
            }
            return parseInt(endDate.getFullYear() / zoomCorrection) - parseInt(startDate.getFullYear() / zoomCorrection)
        },
        _getMonthsOffset: function(startDate, endDate) {
            var yearOffset = endDate.getFullYear() - startDate.getFullYear(),
                monthOffset = endDate.getMonth() - startDate.getMonth();
            return 12 * yearOffset + monthOffset
        },
        _waitRenderView: function(offset) {
            if (this._alreadyViewRender) {
                return
            }
            this._alreadyViewRender = true;
            var date = this._getDateByOffset(offset * this._getRtlCorrection());
            this.option("currentDate", date);
            setTimeout($.proxy(function() {
                this._alreadyViewRender = false
            }, this))
        },
        _getRtlCorrection: function() {
            return this.option("rtlEnabled") ? -1 : 1
        },
        _getDateByOffset: function(offset, date) {
            date = new Date(date || this.option("currentDate"));
            var currentDay = date.getDate();
            var difference = dateUtils.getDifferenceInMonth(this.option("zoomLevel")) * offset;
            date.setDate(1);
            date.setMonth(date.getMonth() + difference);
            var lastDay = dateUtils.getLastMonthDate(date).getDate();
            date.setDate(currentDay > lastDay ? lastDay : currentDay);
            return date
        },
        _focusTarget: function() {
            return this.element()
        },
        _render: function() {
            this.callBase();
            this.element().addClass(CALENDAR_CLASS);
            this._renderBody();
            this.element().append(this.$body);
            this._renderViews();
            this._renderNavigator();
            this._renderSwipeable();
            this._renderFooter();
            this.setAria({
                role: "listbox",
                label: messageLocalization.format("dxCalendar-ariaWidgetName")
            });
            this._updateAriaSelected();
            this._updateAriaId();
            this._setViewContoured(this.option("currentDate"));
            this.element().append(this._navigator.element())
        },
        _renderBody: function() {
            if (!this._$viewsWrapper) {
                this.$body = $("<div>").addClass(CALENDAR_BODY_CLASS);
                this._$viewsWrapper = $("<div>").addClass(CALENDAR_VIEWS_WRAPPER_CLASS);
                this.$body.append(this._$viewsWrapper)
            }
        },
        _renderViews: function() {
            this.element().addClass(CALENDAR_VIEW_CLASS + "-" + this.option("zoomLevel"));
            var currentDate = this.option("currentDate");
            this._view = this._renderSpecificView(currentDate);
            this._view.option("_keyboardProcessor", this._viewKeyboardProcessor);
            var beforeDate = this._getDateByOffset(-1, currentDate);
            this._beforeView = this._isViewAvailable(beforeDate) ? this._renderSpecificView(beforeDate) : null;
            var afterDate = this._getDateByOffset(1, currentDate);
            this._afterView = this._isViewAvailable(afterDate) ? this._renderSpecificView(afterDate) : null;
            this._translateViews()
        },
        _renderSpecificView: function(date) {
            var specificView = Views[this.option("zoomLevel")],
                $view = $("<div>").appendTo(this._$viewsWrapper),
                config = this._viewConfig(date);
            return new specificView($view, config)
        },
        _viewConfig: function(date) {
            return {
                date: date,
                min: this._getMinDate(),
                max: this._getMaxDate(),
                firstDayOfWeek: this.option("firstDayOfWeek"),
                value: this._dateOption("value"),
                rtl: this.option("rtlEnabled"),
                disabled: this.option("disabled") || config().designMode,
                tabIndex: void 0,
                focusStateEnabled: this.option("focusStateEnabled"),
                hoverStateEnabled: this.option("hoverStateEnabled"),
                onCellClick: $.proxy(this._cellClickHandler, this),
                cellTemplate: this._getTemplateByOption("cellTemplate"),
                allowValueSelection: this._isMaxZoomLevel()
            }
        },
        _isViewAvailable: function(date) {
            var zoomLevel = this.option("zoomLevel");
            var min = dateUtils.getViewMinBoundaryDate(zoomLevel, this._getMinDate());
            var max = dateUtils.getViewMaxBoundaryDate(zoomLevel, this._getMaxDate());
            return dateUtils.dateInRange(date, min, max)
        },
        _translateViews: function() {
            translator.move(this._view.element(), {
                left: 0,
                top: 0
            });
            this._beforeView && translator.move(this._beforeView.element(), {
                left: this._getViewPosition(-1),
                top: 0
            });
            this._afterView && translator.move(this._afterView.element(), {
                left: this._getViewPosition(1),
                top: 0
            })
        },
        _getViewPosition: function(coefficient) {
            var rtlCorrection = this.option("rtlEnabled") && !(browser.msie && "8" !== browser.version[0]) ? -1 : 1;
            return 100 * coefficient * rtlCorrection + "%"
        },
        _cellClickHandler: function(e) {
            var zoomLevel = this.option("zoomLevel"),
                nextView = dateUtils.getViewDown(zoomLevel);
            var isMaxZoomLevel = this._isMaxZoomLevel();
            if (nextView && !isMaxZoomLevel) {
                this._navigateDown(e.jQueryEvent.currentTarget)
            } else {
                var newValue = this._updateTimeComponent(e.value);
                this._dateOption("value", newValue);
                this._cellClickAction(e)
            }
        },
        _updateTimeComponent: function(date) {
            var result = new Date(date);
            var currentValue = this._dateOption("value");
            if (currentValue) {
                result.setHours(currentValue.getHours());
                result.setMinutes(currentValue.getMinutes());
                result.setSeconds(currentValue.getSeconds());
                result.setMilliseconds(currentValue.getMilliseconds())
            }
            return result
        },
        _isMaxZoomLevel: function() {
            return this.option("zoomLevel") === this.option("maxZoomLevel")
        },
        _navigateDown: function(cell) {
            var zoomLevel = this.option("zoomLevel");
            if (this._isMaxZoomLevel()) {
                return
            }
            var nextView = dateUtils.getViewDown(zoomLevel);
            if (!nextView) {
                return
            }
            var newCurrentDate = this._view.option("contouredDate") || this._view.option("date");
            if (cell) {
                newCurrentDate = $(cell).data(CALENDAR_DATE_VALUE_KEY)
            }
            this._isOtherViewCellClicked = true;
            this.option("currentDate", newCurrentDate);
            this.option("zoomLevel", nextView);
            this._isOtherViewCellClicked = false;
            this._renderNavigator();
            this._animateShowView();
            this._setViewContoured(this._getNormalizedDate(newCurrentDate))
        },
        _renderNavigator: function() {
            if (!this._navigator) {
                this._navigator = new Navigator($("<div>"), this._navigatorConfig())
            }
            this._navigator.option("text", this._view.getNavigatorCaption());
            this._updateButtonsVisibility()
        },
        _navigatorConfig: function() {
            return {
                text: this._view.getNavigatorCaption(),
                onClick: $.proxy(this._navigatorClickHandler, this),
                onCaptionClick: $.proxy(this._navigateUp, this),
                rtlEnabled: this.option("rtlEnabled")
            }
        },
        _navigatorClickHandler: function(e) {
            var currentDate = this._getDateByOffset(e.direction, this.option("currentDate"));
            this.option("currentDate", currentDate);
            this._updateNavigatorCaption(-e.direction * this._getRtlCorrection())
        },
        _navigateUp: function() {
            var zoomLevel = this.option("zoomLevel"),
                nextView = dateUtils.getViewUp(zoomLevel);
            if (!nextView || this._isMinZoomLevel(zoomLevel)) {
                return
            }
            var contouredDate = this._view.option("contouredDate");
            this.option("zoomLevel", nextView);
            this.option("currentDate", contouredDate || this._view.option("date"));
            this._renderNavigator();
            this._animateShowView().done($.proxy(function() {
                this._setViewContoured(contouredDate)
            }, this))
        },
        _isMinZoomLevel: function(zoomLevel) {
            var min = this._getMinDate(),
                max = this._getMaxDate();
            return dateUtils.sameView(zoomLevel, min, max) || this.option("minZoomLevel") === zoomLevel
        },
        _updateButtonsVisibility: function() {
            this._navigator.toggleButton("next", !commonUtils.isDefined(this._getRequiredView("next")));
            this._navigator.toggleButton("prev", !commonUtils.isDefined(this._getRequiredView("prev")))
        },
        _renderSwipeable: function() {
            if (!this._swipeable) {
                this._swipeable = this._createComponent(this.element(), Swipeable, {
                    onStart: $.proxy(this._swipeStartHandler, this),
                    onUpdated: $.proxy(this._swipeUpdateHandler, this),
                    onEnd: $.proxy(this._swipeEndHandler, this),
                    itemSizeFunc: $.proxy(this._viewWidth, this)
                })
            }
        },
        _swipeStartHandler: function(e) {
            fx.stop(this._$viewsWrapper, true);
            e.jQueryEvent.maxLeftOffset = this._getRequiredView("next") ? 1 : 0;
            e.jQueryEvent.maxRightOffset = this._getRequiredView("prev") ? 1 : 0
        },
        _getRequiredView: function(name) {
            var view;
            var isRtl = this.option("rtlEnabled");
            if ("next" === name) {
                view = isRtl ? this._beforeView : this._afterView
            } else {
                if ("prev" === name) {
                    view = isRtl ? this._afterView : this._beforeView
                }
            }
            return view
        },
        _swipeUpdateHandler: function(e) {
            var offset = e.jQueryEvent.offset;
            translator.move(this._$viewsWrapper, {
                left: offset * this._viewWidth(),
                top: 0
            });
            this._updateNavigatorCaption(offset)
        },
        _swipeEndHandler: function(e) {
            var targetOffset = e.jQueryEvent.targetOffset,
                moveOffset = !targetOffset ? 0 : targetOffset / Math.abs(targetOffset);
            if (0 === moveOffset) {
                this._animateWrapper(0, ANIMATION_DURATION_SHOW_VIEW);
                return
            }
            var date = this._getDateByOffset(-moveOffset * this._getRtlCorrection());
            if (this._isDateInInvalidRange(date)) {
                if (moveOffset >= 0) {
                    date = new Date(this._getMinDate())
                } else {
                    date = new Date(this._getMaxDate())
                }
            }
            this.option("currentDate", date)
        },
        _viewWidth: function() {
            if (!this._viewWidthValue) {
                this._viewWidthValue = this.element().width()
            }
            return this._viewWidthValue
        },
        _updateNavigatorCaption: function(offset) {
            offset *= this._getRtlCorrection();
            var view = this._view;
            if (offset > .5 && this._beforeView) {
                view = this._beforeView
            } else {
                if (offset < -.5 && this._afterView) {
                    view = this._afterView
                }
            }
            this._navigator.option("text", view.getNavigatorCaption())
        },
        _isDateInInvalidRange: function(date) {
            if (this._view.isBoundary(date)) {
                return
            }
            var min = this._getMinDate(),
                max = this._getMaxDate(),
                normalizedDate = dateUtils.normalizeDate(date, min, max);
            return normalizedDate === min || normalizedDate === max
        },
        _renderFooter: function() {
            var showTodayButton = this.option("showTodayButton");
            if (showTodayButton) {
                var $todayButton = this._createComponent($("<a>"), Button, {
                    focusStateEnabled: false,
                    text: messageLocalization.format("dxCalendar-todayButtonText"),
                    onClick: $.proxy(function() {
                        this._toTodayView()
                    }, this),
                    _templates: {}
                }).element().addClass(CALENDAR_TODAY_BUTTON_CLASS);
                this._$footer = $("<div>").addClass(CALENDAR_FOOTER_CLASS).append($todayButton);
                this.element().append(this._$footer)
            }
            this.element().toggleClass(CALENDAR_HAS_FOOTER_CLASS, showTodayButton)
        },
        _animateShowView: function() {
            fx.stop(this._view.element(), true);
            return this._popAnimationView(this._view, POP_ANIMATION_FROM, POP_ANIMATION_TO, ANIMATION_DURATION_SHOW_VIEW).promise()
        },
        _popAnimationView: function(view, from, to, duration) {
            return fx.animate(view.element(), {
                type: "pop",
                from: {
                    scale: from,
                    opacity: from
                },
                to: {
                    scale: to,
                    opacity: to
                },
                duration: duration
            })
        },
        _navigate: function(offset, value) {
            if (0 !== offset && 1 !== Math.abs(offset) && this._isViewAvailable(value)) {
                var newView = this._renderSpecificView(value);
                if (offset > 0) {
                    this._afterView && this._afterView.element().remove();
                    this._afterView = newView
                } else {
                    this._beforeView && this._beforeView.element().remove();
                    this._beforeView = newView
                }
                this._translateViews()
            }
            var rtlCorrection = this._getRtlCorrection(),
                offsetSign = offset > 0 ? 1 : offset < 0 ? -1 : 0,
                endPosition = -rtlCorrection * offsetSign * this._viewWidth();
            var viewsWrapperPosition = this._$viewsWrapper.position().left;
            if (viewsWrapperPosition !== endPosition) {
                if (this._preventViewChangeAnimation) {
                    this._wrapperAnimationEndHandler(offset, value)
                } else {
                    this._animateWrapper(endPosition, ANIMATION_DURATION_SHOW_VIEW).done($.proxy(this._wrapperAnimationEndHandler, this, offset, value))
                }
            }
        },
        _animateWrapper: function(to, duration) {
            return fx.animate(this._$viewsWrapper, {
                type: "slide",
                from: {
                    left: this._$viewsWrapper.position().left
                },
                to: {
                    left: to
                },
                duration: duration
            })
        },
        _toTodayView: function() {
            var today = new Date;
            if (this._isMaxZoomLevel()) {
                this._dateOption("value", today);
                return
            }
            this._preventViewChangeAnimation = true;
            this.option("zoomLevel", this.option("maxZoomLevel"));
            this._dateOption("value", today);
            this._animateShowView();
            this._preventViewChangeAnimation = false
        },
        _wrapperAnimationEndHandler: function(offset, newDate) {
            this._rearrangeViews(offset);
            this._translateViews();
            this._resetLocation();
            this._renderNavigator();
            this._setViewContoured(newDate);
            this._updateAriaId(newDate, this.option(""))
        },
        _rearrangeViews: function(offset) {
            if (0 === offset) {
                return
            }
            var viewOffset, viewToCreateKey, viewToRemoveKey;
            if (offset < 0) {
                viewOffset = 1;
                viewToCreateKey = "_beforeView";
                viewToRemoveKey = "_afterView"
            } else {
                viewOffset = -1;
                viewToCreateKey = "_afterView";
                viewToRemoveKey = "_beforeView"
            }
            if (!this[viewToCreateKey]) {
                return
            }
            var destinationDate = this[viewToCreateKey].option("date");
            if (this[viewToRemoveKey]) {
                this[viewToRemoveKey].element().remove()
            }
            if (offset === viewOffset) {
                this[viewToRemoveKey] = this._view
            } else {
                this[viewToRemoveKey] = this._renderSpecificView(this._getDateByOffset(viewOffset, destinationDate));
                this._view.element().remove()
            }
            this._view = this[viewToCreateKey];
            var dateByOffset = this._getDateByOffset(-viewOffset, destinationDate);
            this[viewToCreateKey] = this._isViewAvailable(dateByOffset) ? this._renderSpecificView(dateByOffset) : null
        },
        _resetLocation: function() {
            translator.move(this._$viewsWrapper, {
                left: 0,
                top: 0
            })
        },
        _clean: function() {
            this.callBase();
            this._clearViewWidthCache();
            delete this._$viewsWrapper;
            delete this._navigator;
            delete this._$footer
        },
        _clearViewWidthCache: function() {
            delete this._viewWidthValue
        },
        _disposeViews: function() {
            this._view.element().remove();
            this._beforeView && this._beforeView.element().remove();
            this._afterView && this._afterView.element().remove();
            delete this._view;
            delete this._beforeView;
            delete this._afterView
        },
        _refreshViews: function() {
            this._disposeViews();
            this._renderViews()
        },
        _visibilityChanged: function() {
            this._translateViews()
        },
        _focusInHandler: function() {
            this.callBase.apply(this, arguments);
            this._view.option("contouredDate", this.option("currentDate"))
        },
        _focusOutHandler: function() {
            this.callBase.apply(this, arguments);
            this._view.option("contouredDate", null)
        },
        _updateViewsValue: function(value) {
            var newValue = value ? new Date(value) : null;
            this._view.option("value", newValue);
            this._beforeView && this._beforeView.option("value", newValue);
            this._afterView && this._afterView.option("value", newValue)
        },
        _updateAriaSelected: function(value, previousValue) {
            value = value || this._dateOption("value");
            var $prevSelectedCell = this._view._getCellByDate(previousValue);
            var $selectedCell = this._view._getCellByDate(value);
            this.setAria("selected", void 0, $prevSelectedCell);
            this.setAria("selected", true, $selectedCell);
            if (value && this.option("currentDate").getTime() === value.getTime()) {
                this._updateAriaId(value, previousValue)
            }
        },
        _updateAriaId: function(value, previousValue) {
            value = value || this.option("currentDate");
            var ariaId = new Guid;
            var $newCell = this._view._getCellByDate(value);
            this.setAria("id", ariaId, $newCell);
            this.setAria("activedescendant", ariaId);
            this._onContouredChanged(ariaId)
        },
        _suppressingNavigation: function(callback, args) {
            this._suppressNavigation = true;
            callback.apply(this, args);
            delete this._suppressNavigation
        },
        _optionChanged: function(args) {
            var value = args.value;
            var previousValue = args.previousValue;
            switch (args.name) {
                case "width":
                    this.callBase(args);
                    this._clearViewWidthCache();
                    break;
                case "min":
                case "max":
                    this.min = void 0;
                    this.max = void 0;
                    this._suppressingNavigation(this._updateCurrentDate, [this.option("currentDate")]);
                    this._refreshViews();
                    this._renderNavigator();
                    break;
                case "firstDayOfWeek":
                    this._refreshViews();
                    this._updateButtonsVisibility();
                    break;
                case "currentDate":
                    this.setAria("id", void 0, this._view._getCellByDate(previousValue));
                    this._updateCurrentDate(value);
                    break;
                case "zoomLevel":
                    this.element().removeClass(CALENDAR_VIEW_CLASS + "-" + previousValue);
                    this._correctZoomLevel();
                    this._refreshViews();
                    this._renderNavigator();
                    this._updateAriaId();
                    break;
                case "minZoomLevel":
                case "maxZoomLevel":
                    this._correctZoomLevel();
                    this._updateButtonsVisibility();
                    break;
                case "value":
                    value = this._convertToDate(value);
                    previousValue = this._convertToDate(previousValue);
                    this._updateAriaSelected(value, previousValue);
                    this.option("currentDate", commonUtils.isDefined(value) ? new Date(value) : new Date);
                    this._updateViewsValue(value);
                    this.callBase(args);
                    break;
                case "disabled":
                    this._view.option("disabled", value);
                    this.callBase(args);
                    break;
                case "showTodayButton":
                    this._invalidate();
                    break;
                case "onCellClick":
                    this._view.option("onCellClick", value);
                    break;
                case "onContouredChanged":
                    this._onContouredChanged = this._createActionByOption("onContouredChanged");
                    break;
                case "cellTemplate":
                    this._invalidate();
                    break;
                case "hasFocus":
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxCalendar", Calendar);
    module.exports = Calendar
});
