/** 
 * DevExtreme (ui/scroll_view/ui.scrollable.js)
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
        support = require("../../core/utils/support"),
        browser = require("../../core/utils/browser"),
        commonUtils = require("../../core/utils/common"),
        devices = require("../../core/devices"),
        registerComponent = require("../../core/component_registrator"),
        DOMComponent = require("../../core/dom_component"),
        selectors = require("../widget/jquery.selectors"),
        eventUtils = require("../../events/utils"),
        scrollEvents = require("./ui.events.emitter.gesture.scroll"),
        simulatedStrategy = require("./ui.scrollable.simulated"),
        NativeStrategy = require("./ui.scrollable.native");
    var SCROLLABLE = "dxScrollable",
        SCROLLABLE_STRATEGY = "dxScrollableStrategy",
        SCROLLABLE_CLASS = "dx-scrollable",
        SCROLLABLE_DISABLED_CLASS = "dx-scrollable-disabled",
        SCROLLABLE_CONTAINER_CLASS = "dx-scrollable-container",
        SCROLLABLE_CONTENT_CLASS = "dx-scrollable-content",
        VERTICAL = "vertical",
        HORIZONTAL = "horizontal",
        BOTH = "both";
    var beforeActivateExists = void 0 !== document.onbeforeactivate;
    var deviceDependentOptions = function() {
        return [{
            device: function(device) {
                return !support.nativeScrolling
            },
            options: {
                useNative: false
            }
        }, {
            device: function(device) {
                return !support.nativeScrolling && !devices.isSimulator() && "generic" === devices.real().platform && "generic" === device.platform
            },
            options: {
                bounceEnabled: false,
                scrollByThumb: true,
                scrollByContent: support.touch,
                showScrollbar: "onHover"
            }
        }]
    };
    var Scrollable = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                disabled: false,
                onScroll: null,
                direction: VERTICAL,
                showScrollbar: "onScroll",
                useNative: true,
                bounceEnabled: true,
                scrollByContent: true,
                scrollByThumb: false,
                onUpdated: null,
                onStart: null,
                onEnd: null,
                onBounce: null,
                onStop: null,
                useSimulatedScrollbar: false,
                useKeyboard: true,
                inertiaEnabled: true,
                pushBackValue: 0,
                updateManually: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat(deviceDependentOptions(), [{
                device: function(device) {
                    return support.nativeScrolling && "android" === devices.real().platform
                },
                options: {
                    useSimulatedScrollbar: true
                }
            }, {
                device: function(device) {
                    return "ios" === devices.real().platform
                },
                options: {
                    pushBackValue: 1
                }
            }])
        },
        _initOptions: function(options) {
            this.callBase(options);
            if (!("useSimulatedScrollbar" in options)) {
                this._setUseSimulatedScrollbar()
            }
        },
        _setUseSimulatedScrollbar: function() {
            if (!this.initialOption("useSimulatedScrollbar")) {
                this.option("useSimulatedScrollbar", !this.option("useNative"))
            }
        },
        _init: function() {
            this.callBase();
            this._initMarkup();
            this._attachNativeScrollbarsCustomizationCss();
            this._locked = false
        },
        _visibilityChanged: function(visible) {
            if (this.element().is(":hidden")) {
                return
            }
            if (visible) {
                this.update();
                this._toggleRTLDirection(this.option("rtlEnabled"));
                this._savedScrollOffset && this.scrollTo(this._savedScrollOffset);
                delete this._savedScrollOffset
            } else {
                this._savedScrollOffset = this.scrollOffset()
            }
        },
        _initMarkup: function() {
            var $element = this.element().addClass(SCROLLABLE_CLASS),
                $container = this._$container = $("<div>").addClass(SCROLLABLE_CONTAINER_CLASS),
                $content = this._$content = $("<div>").addClass(SCROLLABLE_CONTENT_CLASS);
            if (beforeActivateExists) {
                $element.on(eventUtils.addNamespace("beforeactivate", SCROLLABLE), function(e) {
                    if (!$(e.target).is(selectors.focusable)) {
                        e.preventDefault()
                    }
                })
            }
            $content.append($element.contents()).appendTo($container);
            $container.appendTo($element)
        },
        _dimensionChanged: function() {
            this.update()
        },
        _attachNativeScrollbarsCustomizationCss: function() {
            if (!(navigator.platform.indexOf("Mac") > -1 && browser.webkit)) {
                this.element().addClass("dx-scrollable-customizable-scrollbars")
            }
        },
        _render: function() {
            this._renderPushBackOffset();
            this._renderDirection();
            this._renderStrategy();
            this._attachEventHandlers();
            this._renderDisabledState();
            this._createActions();
            this.update();
            this.callBase()
        },
        _renderPushBackOffset: function() {
            var pushBackValue = this.option("pushBackValue");
            if (!pushBackValue && !this._lastPushBackValue) {
                return
            }
            this._$content.css({
                paddingTop: pushBackValue,
                paddingBottom: pushBackValue
            });
            this._lastPushBackValue = pushBackValue
        },
        _toggleRTLDirection: function(rtl) {
            var that = this;
            this.callBase(rtl);
            if (rtl && this.option("direction") !== VERTICAL) {
                commonUtils.deferUpdate(function() {
                    var left = that.scrollWidth() - that.clientWidth();
                    commonUtils.deferRender(function() {
                        that.scrollTo({
                            left: left
                        })
                    })
                })
            }
        },
        _attachEventHandlers: function() {
            var strategy = this._strategy;
            var initEventData = {
                getDirection: $.proxy(strategy.getDirection, strategy),
                validate: $.proxy(this._validate, this),
                isNative: this.option("useNative")
            };
            this._$container.off("." + SCROLLABLE).on(eventUtils.addNamespace("scroll", SCROLLABLE), $.proxy(strategy.handleScroll, strategy)).on(eventUtils.addNamespace(scrollEvents.init, SCROLLABLE), initEventData, $.proxy(this._initHandler, this)).on(eventUtils.addNamespace(scrollEvents.start, SCROLLABLE), $.proxy(strategy.handleStart, strategy)).on(eventUtils.addNamespace(scrollEvents.move, SCROLLABLE), $.proxy(strategy.handleMove, strategy)).on(eventUtils.addNamespace(scrollEvents.end, SCROLLABLE), $.proxy(strategy.handleEnd, strategy)).on(eventUtils.addNamespace(scrollEvents.cancel, SCROLLABLE), $.proxy(strategy.handleCancel, strategy)).on(eventUtils.addNamespace(scrollEvents.stop, SCROLLABLE), $.proxy(strategy.handleStop, strategy))
        },
        _validate: function(e) {
            if (this._isLocked()) {
                return false
            }
            this._updateIfNeed();
            return this._strategy.validate(e)
        },
        _initHandler: function() {
            var strategy = this._strategy;
            strategy.handleInit.apply(strategy, arguments)
        },
        _renderDisabledState: function() {
            this.element().toggleClass(SCROLLABLE_DISABLED_CLASS, this.option("disabled"));
            if (this.option("disabled")) {
                this._lock()
            } else {
                this._unlock()
            }
        },
        _renderDirection: function() {
            this.element().removeClass("dx-scrollable-" + HORIZONTAL).removeClass("dx-scrollable-" + VERTICAL).removeClass("dx-scrollable-" + BOTH).addClass("dx-scrollable-" + this.option("direction"))
        },
        _renderStrategy: function() {
            this._createStrategy();
            this._strategy.render();
            this.element().data(SCROLLABLE_STRATEGY, this._strategy)
        },
        _createStrategy: function() {
            this._strategy = this.option("useNative") ? new NativeStrategy(this) : new simulatedStrategy.SimulatedStrategy(this)
        },
        _createActions: function() {
            this._strategy.createActions()
        },
        _clean: function() {
            this._strategy.dispose()
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "onStart":
                case "onEnd":
                case "onStop":
                case "onUpdated":
                case "onScroll":
                case "onBounce":
                    this._createActions();
                    break;
                case "direction":
                    this._resetInactiveDirection();
                    this._invalidate();
                    break;
                case "useNative":
                    this._setUseSimulatedScrollbar();
                    this._invalidate();
                    break;
                case "inertiaEnabled":
                case "bounceEnabled":
                case "scrollByContent":
                case "scrollByThumb":
                case "bounceEnabled":
                case "useKeyboard":
                case "showScrollbar":
                case "useSimulatedScrollbar":
                case "pushBackValue":
                    this._invalidate();
                    break;
                case "disabled":
                    this._renderDisabledState();
                    break;
                case "updateManually":
                    break;
                default:
                    this.callBase(args)
            }
        },
        _resetInactiveDirection: function() {
            var inactiveProp = this._getInactiveProp();
            if (!inactiveProp) {
                return
            }
            var scrollOffset = this.scrollOffset();
            scrollOffset[inactiveProp] = 0;
            this.scrollTo(scrollOffset)
        },
        _getInactiveProp: function() {
            var direction = this.option("direction");
            if (direction === VERTICAL) {
                return "left"
            }
            if (direction === HORIZONTAL) {
                return "top"
            }
        },
        _location: function() {
            return this._strategy.location()
        },
        _normalizeLocation: function(location) {
            if ($.isPlainObject(location)) {
                var left = commonUtils.ensureDefined(location.left, location.x);
                var top = commonUtils.ensureDefined(location.top, location.y);
                return {
                    left: commonUtils.isDefined(left) ? -left : void 0,
                    top: commonUtils.isDefined(top) ? -top : void 0
                }
            } else {
                var direction = this.option("direction");
                return {
                    left: direction !== VERTICAL ? -location : void 0,
                    top: direction !== HORIZONTAL ? -location : void 0
                }
            }
        },
        _isLocked: function() {
            return this._locked
        },
        _lock: function() {
            this._locked = true
        },
        _unlock: function() {
            if (!this.option("disabled")) {
                this._locked = false
            }
        },
        _isDirection: function(direction) {
            var current = this.option("direction");
            if (direction === VERTICAL) {
                return current !== HORIZONTAL
            }
            if (direction === HORIZONTAL) {
                return current !== VERTICAL
            }
            return current === direction
        },
        _updateAllowedDirection: function() {
            var allowedDirections = this._strategy._allowedDirections();
            if (this._isDirection(BOTH) && allowedDirections.vertical && allowedDirections.horizontal) {
                this._allowedDirectionValue = BOTH
            } else {
                if (this._isDirection(HORIZONTAL) && allowedDirections.horizontal) {
                    this._allowedDirectionValue = HORIZONTAL
                } else {
                    if (this._isDirection(VERTICAL) && allowedDirections.vertical) {
                        this._allowedDirectionValue = VERTICAL
                    } else {
                        this._allowedDirectionValue = null
                    }
                }
            }
        },
        _allowedDirection: function() {
            return this._allowedDirectionValue
        },
        _container: function() {
            return this._$container
        },
        content: function() {
            return this._$content
        },
        scrollOffset: function() {
            var location = this._location();
            return {
                top: -location.top,
                left: -location.left
            }
        },
        scrollTop: function() {
            return this.scrollOffset().top
        },
        scrollLeft: function() {
            return this.scrollOffset().left
        },
        clientHeight: function() {
            return this._$container.height()
        },
        scrollHeight: function() {
            return this.content().outerHeight() - 2 * this.option("pushBackValue")
        },
        clientWidth: function() {
            return this._$container.width()
        },
        scrollWidth: function() {
            return this.content().outerWidth()
        },
        update: function() {
            var that = this;
            return $.when(that._strategy.update()).done(function() {
                that._updateAllowedDirection()
            })
        },
        scrollBy: function(distance) {
            distance = this._normalizeLocation(distance);
            if (!distance.top && !distance.left) {
                return
            }
            this._updateIfNeed();
            this._strategy.scrollBy(distance)
        },
        scrollTo: function(targetLocation) {
            targetLocation = this._normalizeLocation(targetLocation);
            this._updateIfNeed();
            var location = this._location();
            var distance = this._normalizeLocation({
                left: location.left - commonUtils.ensureDefined(targetLocation.left, location.left),
                top: location.top - commonUtils.ensureDefined(targetLocation.top, location.top)
            });
            if (!distance.top && !distance.left) {
                return
            }
            this._strategy.scrollBy(distance)
        },
        scrollToElement: function(element, offset) {
            offset = offset || {};
            var $element = $(element);
            var elementInsideContent = this.content().find(element).length;
            var elementIsInsideContent = $element.parents("." + SCROLLABLE_CLASS).length - $element.parents("." + SCROLLABLE_CONTENT_CLASS).length === 0;
            if (!elementInsideContent || !elementIsInsideContent) {
                return
            }
            var scrollPosition = {
                top: 0,
                left: 0
            };
            var direction = this.option("direction");
            if (direction !== VERTICAL) {
                scrollPosition.left = this._scrollToElementPosition($element, HORIZONTAL, offset)
            }
            if (direction !== HORIZONTAL) {
                scrollPosition.top = this._scrollToElementPosition($element, VERTICAL, offset)
            }
            this.scrollTo(scrollPosition)
        },
        _scrollToElementPosition: function($element, direction, offset) {
            var isVertical = direction === VERTICAL;
            var startOffset = (isVertical ? offset.top : offset.left) || 0;
            var endOffset = (isVertical ? offset.bottom : offset.right) || 0;
            var pushBackOffset = isVertical ? this.option("pushBackValue") : 0;
            var elementPositionRelativeToContent = this._elementPositionRelativeToContent($element, isVertical ? "top" : "left");
            var elementPosition = elementPositionRelativeToContent - pushBackOffset;
            var elementSize = $element[isVertical ? "outerHeight" : "outerWidth"]();
            var scrollLocation = isVertical ? this.scrollTop() : this.scrollLeft();
            var clientSize = isVertical ? this.clientHeight() : this.clientWidth();
            var startDistance = scrollLocation - elementPosition + startOffset;
            var endDistance = scrollLocation - elementPosition - elementSize + clientSize - endOffset;
            if (startDistance <= 0 && endDistance >= 0) {
                return scrollLocation
            }
            return scrollLocation - (Math.abs(startDistance) > Math.abs(endDistance) ? endDistance : startDistance)
        },
        _elementPositionRelativeToContent: function($element, prop) {
            var result = 0;
            while (this._hasScrollContent($element)) {
                result += $element.position()[prop];
                $element = $element.offsetParent()
            }
            return result
        },
        _hasScrollContent: function($element) {
            var $content = this.content();
            return $element.closest($content).length && !$element.is($content)
        },
        _updateIfNeed: function() {
            if (!this.option("updateManually")) {
                this.update()
            }
        }
    });
    registerComponent(SCROLLABLE, Scrollable);
    exports.default = Scrollable;
    exports.deviceDependentOptions = deviceDependentOptions
});
