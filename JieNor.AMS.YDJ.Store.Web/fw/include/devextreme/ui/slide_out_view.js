/** 
 * DevExtreme (ui/slide_out_view.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        fx = require("../animation/fx"),
        clickEvent = require("../events/click"),
        translator = require("../animation/translator"),
        hideTopOverlayCallback = require("../mobile/hide_top_overlay").hideCallback,
        registerComponent = require("../core/component_registrator"),
        Widget = require("./widget/ui.widget"),
        Swipeable = require("../events/gesture/swipeable");
    var SLIDEOUTVIEW_CLASS = "dx-slideoutview",
        SLIDEOUTVIEW_WRAPPER_CLASS = "dx-slideoutview-wrapper",
        SLIDEOUTVIEW_MENU_CONTENT_CLASS = "dx-slideoutview-menu-content",
        SLIDEOUTVIEW_CONTENT_CLASS = "dx-slideoutview-content",
        SLIDEOUTVIEW_SHIELD_CLASS = "dx-slideoutview-shield",
        INVISIBLE_STATE_CLASS = "dx-state-invisible",
        ANONYMOUS_TEMPLATE_NAME = "content",
        ANIMATION_DURATION = 400;
    var animation = {
        moveTo: function($element, position, completeAction) {
            fx.animate($element, {
                type: "slide",
                to: {
                    left: position
                },
                duration: ANIMATION_DURATION,
                complete: completeAction
            })
        },
        complete: function($element) {
            fx.stop($element, true)
        }
    };
    var SlideOutView = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                menuPosition: "normal",
                menuVisible: false,
                swipeEnabled: true,
                menuTemplate: "menu",
                contentTemplate: "content",
                contentOffset: 45
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    android: true
                },
                options: {
                    contentOffset: 54
                }
            }, {
                device: function(device) {
                    return "generic" === device.platform && "desktop" !== device.deviceType
                },
                options: {
                    contentOffset: 56
                }
            }, {
                device: {
                    win: true,
                    phone: false
                },
                options: {
                    contentOffset: 76
                }
            }])
        },
        _getAnonymousTemplateName: function() {
            return ANONYMOUS_TEMPLATE_NAME
        },
        _init: function() {
            this.callBase();
            this.element().addClass(SLIDEOUTVIEW_CLASS);
            this._deferredAnimate = void 0;
            this._initHideTopOverlayHandler()
        },
        _initHideTopOverlayHandler: function() {
            this._hideMenuHandler = $.proxy(this.hideMenu, this)
        },
        _render: function() {
            this.callBase();
            this._renderShield();
            this._toggleMenuPositionClass();
            this._initSwipeHandlers();
            this._dimensionChanged()
        },
        _renderContentImpl: function() {
            this._renderMarkup();
            var menuTemplate = this._getTemplate(this.option("menuTemplate")),
                contentTemplate = this._getTemplate(this.option("contentTemplate"));
            menuTemplate && menuTemplate.render({
                container: this.menuContent()
            });
            contentTemplate && contentTemplate.render({
                container: this.content(),
                noModel: true
            })
        },
        _renderMarkup: function() {
            var $wrapper = $("<div>").addClass(SLIDEOUTVIEW_WRAPPER_CLASS);
            this._$menu = $("<div>").addClass(SLIDEOUTVIEW_MENU_CONTENT_CLASS);
            this._$container = $("<div>").addClass(SLIDEOUTVIEW_CONTENT_CLASS);
            $wrapper.append(this._$menu);
            $wrapper.append(this._$container);
            this.element().append($wrapper);
            this._$container.on("MSPointerDown", $.noop)
        },
        _renderShield: function() {
            this._$shield = this._$shield || $("<div>").addClass(SLIDEOUTVIEW_SHIELD_CLASS);
            this._$shield.appendTo(this.content());
            this._$shield.off(clickEvent.name).on(clickEvent.name, $.proxy(this.hideMenu, this));
            this._toggleShieldVisibility(this.option("menuVisible"))
        },
        _initSwipeHandlers: function() {
            this._createComponent(this.content(), Swipeable, {
                disabled: !this.option("swipeEnabled"),
                elastic: false,
                itemSizeFunc: $.proxy(this._getMenuWidth, this),
                onStart: $.proxy(this._swipeStartHandler, this),
                onUpdated: $.proxy(this._swipeUpdateHandler, this),
                onEnd: $.proxy(this._swipeEndHandler, this)
            })
        },
        _isRightMenuPosition: function() {
            var invertedPosition = "inverted" === this.option("menuPosition"),
                rtl = this.option("rtlEnabled");
            return rtl && !invertedPosition || !rtl && invertedPosition
        },
        _swipeStartHandler: function(e) {
            animation.complete(this.content());
            var event = e.jQueryEvent,
                menuVisible = this.option("menuVisible"),
                rtl = this._isRightMenuPosition();
            event.maxLeftOffset = +(rtl ? !menuVisible : menuVisible);
            event.maxRightOffset = +(rtl ? menuVisible : !menuVisible);
            this._toggleShieldVisibility(true)
        },
        _swipeUpdateHandler: function(e) {
            var event = e.jQueryEvent,
                offset = this.option("menuVisible") ? event.offset + 1 * this._getRTLSignCorrection() : event.offset;
            offset *= this._getRTLSignCorrection();
            this._renderPosition(offset, false)
        },
        _swipeEndHandler: function(e) {
            var targetOffset = e.jQueryEvent.targetOffset * this._getRTLSignCorrection() + this.option("menuVisible"),
                menuVisible = 0 !== targetOffset;
            if (this.option("menuVisible") === menuVisible) {
                this._renderPosition(this.option("menuVisible"), true)
            } else {
                this.option("menuVisible", menuVisible)
            }
        },
        _toggleMenuPositionClass: function() {
            var left = SLIDEOUTVIEW_CLASS + "-left",
                right = SLIDEOUTVIEW_CLASS + "-right",
                menuPosition = this._isRightMenuPosition() ? "right" : "left";
            this._$menu.removeClass(left + " " + right);
            this._$menu.addClass(SLIDEOUTVIEW_CLASS + "-" + menuPosition)
        },
        _renderPosition: function(offset, animate) {
            var pos = this._calculatePixelOffset(offset) * this._getRTLSignCorrection();
            this._toggleHideMenuCallback(offset);
            if (animate) {
                this._toggleShieldVisibility(true);
                animation.moveTo(this.content(), pos, $.proxy(this._animationCompleteHandler, this))
            } else {
                translator.move(this.content(), {
                    left: pos
                })
            }
        },
        _calculatePixelOffset: function(offset) {
            offset = offset || 0;
            return offset * this._getMenuWidth()
        },
        _getMenuWidth: function() {
            if (!this._menuWidth) {
                var maxMenuWidth = this.element().width() - this.option("contentOffset");
                this.menuContent().css("max-width", maxMenuWidth);
                var currentMenuWidth = this.menuContent().width();
                this._menuWidth = Math.min(currentMenuWidth, maxMenuWidth)
            }
            return this._menuWidth
        },
        _animationCompleteHandler: function() {
            this._toggleShieldVisibility(this.option("menuVisible"));
            if (this._deferredAnimate) {
                this._deferredAnimate.resolveWith(this)
            }
        },
        _toggleHideMenuCallback: function(subscribe) {
            if (subscribe) {
                hideTopOverlayCallback.add(this._hideMenuHandler)
            } else {
                hideTopOverlayCallback.remove(this._hideMenuHandler)
            }
        },
        _getRTLSignCorrection: function() {
            return this._isRightMenuPosition() ? -1 : 1
        },
        _dispose: function() {
            animation.complete(this.content());
            this._toggleHideMenuCallback(false);
            this.callBase()
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._dimensionChanged()
            }
        },
        _dimensionChanged: function() {
            delete this._menuWidth;
            this._renderPosition(this.option("menuVisible"), false)
        },
        _toggleShieldVisibility: function(visible) {
            this._$shield.toggleClass(INVISIBLE_STATE_CLASS, !visible)
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "width":
                    this.callBase(args);
                    this._dimensionChanged();
                    break;
                case "contentOffset":
                    this._dimensionChanged();
                    break;
                case "menuVisible":
                    this._renderPosition(args.value, true);
                    break;
                case "menuPosition":
                    this._renderPosition(this.option("menuVisible"), true);
                    this._toggleMenuPositionClass();
                    break;
                case "swipeEnabled":
                    this._initSwipeHandlers();
                    break;
                case "contentTemplate":
                case "menuTemplate":
                    this._invalidate();
                    break;
                default:
                    this.callBase(args)
            }
        },
        menuContent: function() {
            return this._$menu
        },
        content: function() {
            return this._$container
        },
        showMenu: function() {
            return this.toggleMenuVisibility(true)
        },
        hideMenu: function() {
            return this.toggleMenuVisibility(false)
        },
        toggleMenuVisibility: function(showing) {
            showing = void 0 === showing ? !this.option("menuVisible") : showing;
            this._deferredAnimate = $.Deferred();
            this.option("menuVisible", showing);
            return this._deferredAnimate.promise()
        }
    });
    registerComponent("dxSlideOutView", SlideOutView);
    module.exports = SlideOutView
});
