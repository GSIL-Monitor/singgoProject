/** 
 * DevExtreme (ui/tabs.js)
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
        devices = require("../core/devices"),
        registerComponent = require("../core/component_registrator"),
        Button = require("./button"),
        inkRipple = require("./widget/utils.ink_ripple"),
        eventUtils = require("../events/utils"),
        domUtils = require("../core/utils/dom"),
        pointerEvents = require("../events/pointer"),
        themes = require("./themes"),
        holdEvent = require("../events/hold"),
        Scrollable = require("./scroll_view/ui.scrollable").default,
        CollectionWidget = require("./collection/ui.collection_widget.edit");
    var TABS_CLASS = "dx-tabs",
        TABS_WRAPPER_CLASS = "dx-tabs-wrapper",
        TABS_EXPANDED_CLASS = "dx-tabs-expanded",
        TABS_SCROLLABLE_CLASS = "dx-tabs-scrollable",
        TABS_NAV_BUTTONS_CLASS = "dx-tabs-nav-buttons",
        TABS_ITEM_CLASS = "dx-tab",
        TABS_ITEM_SELECTED_CLASS = "dx-tab-selected",
        TABS_NAV_BUTTON_CLASS = "dx-tabs-nav-button",
        TABS_LEFT_NAV_BUTTON_CLASS = "dx-tabs-nav-button-left",
        TABS_RIGHT_NAV_BUTTON_CLASS = "dx-tabs-nav-button-right",
        TABS_ITEM_DATA_KEY = "dxTabData",
        FEEDBACK_HIDE_TIMEOUT = 100,
        FEEDBACK_DURATION_INTERVAL = 5,
        FEEDBACK_SCROLL_TIMEOUT = 300,
        TAB_OFFSET = 30;
    var Tabs = CollectionWidget.inherit({
        _activeStateUnit: "." + TABS_ITEM_CLASS,
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                hoverStateEnabled: true,
                showNavButtons: false,
                scrollByContent: true,
                scrollingEnabled: true,
                selectionMode: "single",
                activeStateEnabled: true,
                selectionRequired: false,
                selectOnFocus: true,
                loopItemFocus: false,
                useInkRipple: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    platform: "generic"
                },
                options: {
                    showNavButtons: true,
                    scrollByContent: false
                }
            }, {
                device: function(device) {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }, {
                device: function() {
                    return /android5/.test(themes.current())
                },
                options: {
                    useInkRipple: true
                }
            }])
        },
        _init: function() {
            this.callBase();
            this.setAria("role", "tablist");
            this.element().addClass(TABS_CLASS);
            this._renderMultiple();
            this._feedbackHideTimeout = FEEDBACK_HIDE_TIMEOUT
        },
        _itemClass: function() {
            return TABS_ITEM_CLASS
        },
        _selectedItemClass: function() {
            return TABS_ITEM_SELECTED_CLASS
        },
        _itemDataKey: function() {
            return TABS_ITEM_DATA_KEY
        },
        _renderContent: function() {
            var that = this;
            this.callBase();
            if (this.option("templatesRenderAsynchronously")) {
                this._resizeEventTimer = setTimeout(function() {
                    domUtils.triggerResizeEvent(that._$content)
                }, 0)
            }
        },
        _render: function() {
            this.callBase();
            this._renderWrapper();
            this._renderScrolling();
            this.setAria("role", "tab", this.itemElements());
            this.option("useInkRipple") && this._renderInkRipple()
        },
        _renderScrolling: function() {
            this.element().removeClass(TABS_EXPANDED_CLASS);
            if (this._allowScrolling() && !this._scrollable) {
                this._renderScrollable();
                this._renderNavButtons();
                this._scrollToItem(this.option("selectedItem"))
            }
            if (!this._allowScrolling()) {
                this._cleanScrolling();
                this.element().removeClass(TABS_NAV_BUTTONS_CLASS).addClass(TABS_EXPANDED_CLASS)
            }
        },
        _cleanNavButtons: function() {
            if (!this._leftButton || !this._rightButton) {
                return
            }
            this._leftButton.element().remove();
            this._rightButton.element().remove();
            this._leftButton = null;
            this._rightButton = null
        },
        _cleanScrolling: function() {
            if (!this._scrollable) {
                return
            }
            this._scrollable.content().children("." + TABS_WRAPPER_CLASS).appendTo(this._itemContainer());
            this._scrollable.element().remove();
            this._scrollable = null;
            this._cleanNavButtons()
        },
        _renderInkRipple: function() {
            this._inkRipple = inkRipple.render()
        },
        _toggleActiveState: function($element, value, e) {
            this.callBase.apply(this, arguments);
            if (!this._inkRipple) {
                return
            }
            var config = {
                element: $element,
                jQueryEvent: e
            };
            if (value) {
                this._inkRipple.showWave(config)
            } else {
                this._inkRipple.hideWave(config)
            }
        },
        _renderMultiple: function() {
            if ("multiple" === this.option("selectionMode")) {
                this.option("selectOnFocus", false)
            }
        },
        _renderWrapper: function() {
            this.element().wrapInner($("<div>").addClass(TABS_WRAPPER_CLASS))
        },
        _renderScrollable: function() {
            var $itemContainer = this.element().wrapInner($("<div>").addClass(TABS_SCROLLABLE_CLASS)).children();
            this._scrollable = this._createComponent($itemContainer, Scrollable, {
                direction: "horizontal",
                showScrollbar: false,
                useKeyboard: false,
                useNative: false,
                scrollByContent: this.option("scrollByContent"),
                onScroll: $.proxy(this._updateNavButtonsVisibility, this)
            });
            this.element().append(this._scrollable.element())
        },
        _scrollToItem: function(itemData) {
            if (!this._scrollable) {
                return
            }
            var $item = this._editStrategy.getItemElement(itemData);
            this._scrollable.scrollToElement($item)
        },
        _allowScrolling: function() {
            if (!this.option("scrollingEnabled")) {
                return false
            }
            var tabItemsWidth = 0;
            this.itemElements().each(function(_, tabItem) {
                tabItemsWidth += $(tabItem).outerWidth(true)
            });
            return tabItemsWidth - 1 > this.element().width()
        },
        _renderNavButtons: function() {
            this.element().toggleClass(TABS_NAV_BUTTONS_CLASS, this.option("showNavButtons"));
            if (!this.option("showNavButtons")) {
                return
            }
            this._leftButton = this._createNavButton(-TAB_OFFSET, "chevronprev");
            var $leftButton = this._leftButton.element();
            $leftButton.addClass(TABS_LEFT_NAV_BUTTON_CLASS);
            this.element().prepend($leftButton);
            this._rightButton = this._createNavButton(TAB_OFFSET, "chevronnext");
            var $rightButton = this._rightButton.element();
            $rightButton.addClass(TABS_RIGHT_NAV_BUTTON_CLASS);
            this.element().append($rightButton);
            this._updateNavButtonsVisibility();
            this._scrollable.update();
            if (this.option("rtlEnabled")) {
                this._scrollable.scrollTo({
                    left: this._scrollable.scrollWidth() - this._scrollable.clientWidth()
                })
            }
        },
        _updateNavButtonsVisibility: function() {
            this._leftButton && this._leftButton.option("disabled", this._scrollable.scrollLeft() <= 0);
            this._rightButton && this._rightButton.option("disabled", this._scrollable.scrollLeft() >= this._scrollable.scrollWidth() - this._scrollable.clientWidth())
        },
        _updateScrollPosition: function(offset, duration) {
            this._scrollable.update();
            this._scrollable.scrollBy(offset / duration)
        },
        _createNavButton: function(offset, icon) {
            var that = this;
            var holdAction = that._createAction(function() {
                    that._holdInterval = setInterval(function() {
                        that._updateScrollPosition(offset, FEEDBACK_DURATION_INTERVAL)
                    }, FEEDBACK_DURATION_INTERVAL)
                }),
                holdEventName = eventUtils.addNamespace(holdEvent.name, "dxNavButton"),
                pointerUpEventName = eventUtils.addNamespace(pointerEvents.up, "dxNavButton"),
                pointerOutEventName = eventUtils.addNamespace(pointerEvents.out, "dxNavButton");
            var navButton = this._createComponent($("<div>").addClass(TABS_NAV_BUTTON_CLASS), Button, {
                focusStateEnabled: false,
                icon: icon,
                onClick: function() {
                    that._updateScrollPosition(offset, 1)
                },
                _templates: {}
            });
            navButton.element().on(holdEventName, {
                timeout: FEEDBACK_SCROLL_TIMEOUT
            }, $.proxy(function(e) {
                holdAction({
                    jQueryEvent: e
                })
            }, this)).on(pointerUpEventName, function() {
                that._clearInterval()
            }).on(pointerOutEventName, function() {
                that._clearInterval()
            });
            return navButton
        },
        _clearInterval: function() {
            if (this._holdInterval) {
                clearInterval(this._holdInterval)
            }
        },
        _renderSelection: function(addedSelection) {
            this._scrollable && this._scrollable.scrollToElement(this.itemElements().eq(addedSelection[0]), {
                left: 1,
                right: 1
            })
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._dimensionChanged()
            }
        },
        _dimensionChanged: function() {
            if (this.option("scrollingEnabled")) {
                this._renderScrolling()
            }
        },
        _itemSelectHandler: function(e) {
            if ("single" === this.option("selectionMode") && this.isItemSelected(e.currentTarget)) {
                return
            }
            this.callBase(e)
        },
        _clean: function() {
            this._scrollable = null;
            clearTimeout(this._resizeEventTimer);
            this.callBase()
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "useInkRipple":
                case "scrollingEnabled":
                case "showNavButtons":
                    this._invalidate();
                    break;
                case "scrollByContent":
                    this._scrollable && this._scrollable.option(args.name, args.value);
                    break;
                case "selectionMode":
                    this._renderMultiple();
                    this.callBase(args);
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxTabs", Tabs);
    module.exports = Tabs
});
