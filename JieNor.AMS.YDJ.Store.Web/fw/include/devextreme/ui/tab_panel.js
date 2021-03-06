/** 
 * DevExtreme (ui/tab_panel.js)
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
        support = require("../core/utils/support"),
        devices = require("../core/devices"),
        registerComponent = require("../core/component_registrator"),
        MultiView = require("./multi_view"),
        Tabs = require("./tabs");
    var TABPANEL_CLASS = "dx-tabpanel",
        TABPANEL_TABS_CLASS = "dx-tabpanel-tabs",
        TABPANEL_CONTAINER_CLASS = "dx-tabpanel-container";
    var TabPanel = MultiView.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                itemTitleTemplate: "title",
                hoverStateEnabled: true,
                showNavButtons: false,
                scrollByContent: true,
                scrollingEnabled: true,
                onTitleClick: null,
                onTitleHold: null,
                onTitleRendered: null
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function(device) {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }, {
                device: function(device) {
                    return !support.touch
                },
                options: {
                    swipeEnabled: false
                }
            }, {
                device: {
                    platform: "generic"
                },
                options: {
                    animationEnabled: false
                }
            }])
        },
        _init: function() {
            this.callBase();
            this.element().addClass(TABPANEL_CLASS);
            this.setAria("role", "tabpanel");
            this._renderLayout()
        },
        _renderContent: function() {
            var that = this;
            this.callBase();
            if (this.option("templatesRenderAsynchronously")) {
                this._resizeEventTimer = setTimeout(function() {
                    that._updateLayout()
                }, 0)
            }
        },
        _renderLayout: function() {
            var $element = this.element();
            this._$tabContainer = $("<div>").addClass(TABPANEL_TABS_CLASS).appendTo($element);
            var $tabs = $("<div>").appendTo(this._$tabContainer);
            this._tabs = this._createComponent($tabs, Tabs, this._tabConfig());
            this._$container = $("<div>").addClass(TABPANEL_CONTAINER_CLASS).appendTo($element);
            this._$container.append(this._$wrapper);
            this._updateLayout()
        },
        _updateLayout: function() {
            var tabsHeight = this._$tabContainer.outerHeight();
            this._$container.css({
                "margin-top": -tabsHeight,
                "padding-top": tabsHeight
            })
        },
        _refreshActiveDescendant: function() {
            var tabs = this._tabs,
                tabItems = tabs.itemElements(),
                $activeTab = $(tabItems[tabs.option("selectedIndex")]),
                id = this.getFocusedItemId();
            this.setAria("controls", void 0, $(tabItems));
            this.setAria("controls", id, $activeTab)
        },
        _tabConfig: function() {
            return {
                selectOnFocus: true,
                focusStateEnabled: this.option("focusStateEnabled"),
                hoverStateEnabled: this.option("hoverStateEnabled"),
                tabIndex: this.option("tabIndex"),
                selectedIndex: this.option("selectedIndex"),
                onItemClick: this.option("onTitleClick"),
                onItemHold: this.option("onTitleHold"),
                itemHoldTimeout: this.option("itemHoldTimeout"),
                onSelectionChanged: $.proxy(function(e) {
                    this.option("selectedIndex", e.component.option("selectedIndex"));
                    this._refreshActiveDescendant()
                }, this),
                onItemRendered: this.option("onTitleRendered"),
                itemTemplate: this._getTemplateByOption("itemTitleTemplate"),
                items: this.option("items"),
                noDataText: null,
                scrollingEnabled: this.option("scrollingEnabled"),
                scrollByContent: this.option("scrollByContent"),
                showNavButtons: this.option("showNavButtons"),
                itemTemplateProperty: "tabTemplate",
                loopItemFocus: this.option("loop"),
                selectionRequired: true,
                onOptionChanged: $.proxy(function(args) {
                    var name = args.name,
                        value = args.value;
                    if ("focusedElement" === name) {
                        var id = value ? value.index() : value;
                        var newItem = value ? this._itemElements().eq(id) : value;
                        this.option("focusedElement", newItem)
                    }
                }, this),
                onFocusIn: $.proxy(function(args) {
                    this._focusInHandler(args.jQueryEvent)
                }, this),
                onFocusOut: $.proxy(function(args) {
                    this._focusOutHandler(args.jQueryEvent)
                }, this)
            }
        },
        _renderFocusTarget: function() {
            this._focusTarget().attr("tabindex", -1);
            this._refreshActiveDescendant()
        },
        _updateFocusState: function(e, isFocused) {
            this.callBase(e, isFocused);
            if (e.target === this._tabs._focusTarget().get(0)) {
                this._toggleFocusClass(isFocused, this._focusTarget())
            }
        },
        _setTabsOption: function(name, value) {
            if (this._tabs) {
                this._tabs.option(name, value)
            }
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._tabs._dimensionChanged();
                this._updateLayout()
            }
        },
        _optionChanged: function(args) {
            var name = args.name,
                value = args.value;
            switch (name) {
                case "dataSource":
                    this.callBase(args);
                    break;
                case "items":
                    this._setTabsOption(name, value);
                    this._updateLayout();
                    this.callBase(args);
                    break;
                case "selectedIndex":
                case "selectedItem":
                case "itemHoldTimeout":
                case "focusStateEnabled":
                case "hoverStateEnabled":
                    this._setTabsOption(name, value);
                    this.callBase(args);
                    break;
                case "scrollingEnabled":
                case "scrollByContent":
                case "showNavButtons":
                    this._setTabsOption(name, value);
                    break;
                case "focusedElement":
                    var id = value ? value.index() : value;
                    var newItem = value ? this._tabs._itemElements().eq(id) : value;
                    this._setTabsOption("focusedElement", newItem);
                    this.callBase(args);
                    this._tabs.focus();
                    break;
                case "itemTitleTemplate":
                    this._setTabsOption("itemTemplate", this._getTemplateByOption("itemTitleTemplate"));
                    break;
                case "onTitleClick":
                    this._setTabsOption("onItemClick", value);
                    break;
                case "onTitleHold":
                    this._setTabsOption("onItemHold", value);
                    break;
                case "onTitleRendered":
                    this._setTabsOption("onItemRendered", value);
                    break;
                case "loop":
                    this._setTabsOption("loopItemFocus", value);
                    break;
                default:
                    this.callBase(args)
            }
        },
        _clean: function() {
            clearTimeout(this._resizeEventTimer);
            this.callBase()
        }
    });
    registerComponent("dxTabPanel", TabPanel);
    module.exports = TabPanel
});
