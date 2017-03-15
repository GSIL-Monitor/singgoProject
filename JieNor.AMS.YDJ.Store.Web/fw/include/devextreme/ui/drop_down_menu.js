/** 
 * DevExtreme (ui/drop_down_menu.js)
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
        Widget = require("./widget/ui.widget"),
        Button = require("./button"),
        Popover = require("./popover"),
        DataHelperMixin = require("./collection/ui.data_helper"),
        List = require("./list");
    var DROP_DOWN_MENU_CLASS = "dx-dropdownmenu",
        DROP_DOWN_MENU_POPUP_CLASS = "dx-dropdownmenu-popup",
        DROP_DOWN_MENU_POPUP_WRAPPER_CLASS = "dx-dropdownmenu-popup-wrapper",
        DROP_DOWN_MENU_LIST_CLASS = "dx-dropdownmenu-list",
        DROP_DOWN_MENU_BUTTON_CLASS = "dx-dropdownmenu-button";
    var POPUP_OPTION_MAP = {
        popupWidth: "width",
        popupHeight: "height"
    };
    var BUTTON_OPTION_MAP = {
        buttonIcon: "icon",
        buttonText: "text",
        buttonWidth: "width",
        buttonHeight: "height",
        buttonTemplate: "template"
    };
    var DropDownMenu = Widget.inherit({
        _supportedKeys: function() {
            var extension = {};
            if (!this.option("opened") || !this._list.option("focusedElement")) {
                extension = this._button._supportedKeys()
            }
            return $.extend(this.callBase(), extension, {
                tab: function(e) {
                    this._popup.hide()
                }
            })
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                buttonIconSrc: {
                    since: "15.1",
                    alias: "buttonIcon"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                items: [],
                onItemClick: null,
                dataSource: null,
                itemTemplate: "item",
                buttonText: "",
                buttonIcon: "overflow",
                buttonWidth: void 0,
                buttonHeight: void 0,
                buttonTemplate: "content",
                onButtonClick: null,
                usePopover: false,
                popupWidth: "auto",
                popupHeight: "auto",
                activeStateEnabled: true,
                hoverStateEnabled: true,
                opened: false,
                deferRendering: false,
                popupPosition: {
                    my: "top center",
                    at: "bottom center",
                    collision: "fit flip",
                    offset: {
                        v: 1
                    }
                },
                popupAnimation: void 0,
                onItemRendered: null,
                menuWidget: List
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: [{
                    platform: "ios"
                }],
                options: {
                    usePopover: true
                }
            }, {
                device: [{
                    platform: "generic"
                }],
                options: {
                    popupPosition: {
                        offset: {
                            v: 4
                        }
                    }
                }
            }, {
                device: function(device) {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }, {
                device: [{
                    platform: "android"
                }],
                options: {
                    popupPosition: {
                        my: "top " + (this.option("rtlEnabled") ? "left" : "right"),
                        at: "top " + (this.option("rtlEnabled") ? "left" : "right"),
                        collision: "flipfit"
                    },
                    popupAnimation: {
                        show: {
                            type: "pop",
                            duration: 200,
                            from: {
                                scale: 0
                            },
                            to: {
                                scale: 1
                            }
                        },
                        hide: {
                            type: "pop",
                            duration: 200,
                            from: {
                                scale: 1
                            },
                            to: {
                                scale: 0
                            }
                        }
                    }
                }
            }])
        },
        _initOptions: function(options) {
            if ("android" === devices.current().platform) {
                if (!options.popupPosition) {
                    options.popupPosition = {
                        at: (options.usePopover ? "bottom " : "top ") + (options.rtlEnabled ? "left" : "right")
                    }
                }
            }
            this.callBase(options)
        },
        _dataSourceOptions: function() {
            return {
                paginate: false
            }
        },
        _init: function() {
            this.callBase();
            this.element().addClass(DROP_DOWN_MENU_CLASS);
            this._initDataSource();
            this._initItemClickAction();
            this._initButtonClickAction()
        },
        _initItemClickAction: function() {
            this._itemClickAction = this._createActionByOption("onItemClick")
        },
        _initButtonClickAction: function() {
            this._buttonClickAction = this._createActionByOption("onButtonClick")
        },
        _render: function() {
            this._renderButton();
            this.callBase();
            this.setAria({
                role: "menubar",
                haspopup: true,
                expanded: this.option("opened")
            })
        },
        _renderContentImpl: function() {
            if (this.option("opened")) {
                this._renderPopup()
            }
        },
        _clean: function() {
            this._cleanFocusState();
            if (this._popup) {
                this._popup.element().remove();
                delete this._$popup
            }
        },
        _renderButton: function() {
            var $button = this.element().addClass(DROP_DOWN_MENU_BUTTON_CLASS),
                config = this._buttonOptions();
            this._button = this._createComponent($button, Button, config)
        },
        _buttonOptions: function() {
            return {
                text: this.option("buttonText"),
                icon: this.option("buttonIcon"),
                width: this.option("buttonWidth"),
                height: this.option("buttonHeight"),
                template: this.option("buttonTemplate"),
                focusStateEnabled: false,
                onClick: $.proxy(function(e) {
                    this.option("opened", !this.option("opened"));
                    this._buttonClickAction(e)
                }, this)
            }
        },
        _toggleMenuVisibility: function(opened) {
            var state = void 0 === opened ? !this._popup.option("visible") : opened;
            if (opened) {
                this._renderPopup()
            }
            this._popup.toggle(state);
            this.setAria("expanded", state)
        },
        _renderPopup: function() {
            if (this._$popup) {
                return
            }
            var $popup = this._$popup = $("<div>").appendTo(this.element()),
                config = this._popupOptions();
            this._popup = this._createComponent($popup, Popover, config)
        },
        _popupOptions: function() {
            var usePopup = !this.option("usePopover");
            return {
                onInitialized: function(args) {
                    args.component._wrapper().addClass(DROP_DOWN_MENU_POPUP_WRAPPER_CLASS).toggleClass(DROP_DOWN_MENU_POPUP_CLASS, usePopup)
                },
                visible: this.option("opened"),
                onContentReady: $.proxy(this._popupContentReadyHandler, this),
                deferRendering: false,
                position: this.option("popupPosition"),
                animation: this.option("popupAnimation"),
                onOptionChanged: $.proxy(function(args) {
                    if ("visible" === args.name) {
                        this.option("opened", args.value)
                    }
                }, this),
                target: this.element(),
                height: this.option("popupHeight"),
                width: this.option("popupWidth")
            }
        },
        _popupContentReadyHandler: function() {
            var popup = Popover.getInstance(this._$popup);
            this._renderList(popup)
        },
        _renderList: function(instance) {
            var $content = instance.content(),
                listConfig = this._listOptions();
            $content.addClass(DROP_DOWN_MENU_LIST_CLASS);
            this._list = this._createComponent($content, this.option("menuWidget"), listConfig);
            this._list._getAriaTarget = $.proxy(function() {
                return this.element()
            }, this);
            this._setListDataSource();
            var listMaxHeight = .5 * $(window).height();
            if ($content.height() > listMaxHeight) {
                $content.height(listMaxHeight)
            }
        },
        _listOptions: function() {
            return {
                _keyboardProcessor: this._listProcessor,
                pageLoadMode: "scrollBottom",
                indicateLoading: false,
                noDataText: "",
                itemTemplate: this._getTemplateByOption("itemTemplate"),
                onItemClick: $.proxy(function(e) {
                    this.option("opened", false);
                    this._itemClickAction(e)
                }, this),
                tabIndex: -1,
                focusStateEnabled: this.option("focusStateEnabled"),
                activeStateEnabled: this.option("activeStateEnabled"),
                onItemRendered: this.option("onItemRendered"),
                _itemAttributes: {
                    role: "menuitem"
                }
            }
        },
        _setListDataSource: function() {
            if (this._list) {
                this._list.option("dataSource", this._dataSource || this.option("items"))
            }
            delete this._deferRendering
        },
        _attachKeyboardEvents: function() {
            this.callBase.apply(this, arguments);
            this._listProcessor = this._keyboardProcessor.attachChildProcessor();
            if (this._list) {
                this._list.option("_keyboardProcessor", this._listProcessor)
            }
        },
        _cleanFocusState: function() {
            this.callBase.apply(this, arguments);
            delete this._listProcessor
        },
        _toggleVisibility: function(visible) {
            this.callBase(visible);
            this._button.option("visible", visible)
        },
        _optionChanged: function(args) {
            var name = args.name;
            var value = args.value;
            switch (name) {
                case "items":
                case "dataSource":
                    if (this.option("deferRendering") && !this.option("opened")) {
                        this._deferRendering = true
                    } else {
                        this._refreshDataSource();
                        this._setListDataSource()
                    }
                    break;
                case "itemTemplate":
                    if (this._list) {
                        this._list.option(name, this._getTemplate(value))
                    }
                    break;
                case "onItemClick":
                    this._initItemClickAction();
                    break;
                case "onButtonClick":
                    this._buttonClickAction();
                    break;
                case "buttonIcon":
                case "buttonText":
                case "buttonWidth":
                case "buttonHeight":
                case "buttonTemplate":
                    this._button.option(BUTTON_OPTION_MAP[name], value);
                    this._renderPopup();
                    break;
                case "popupWidth":
                case "popupHeight":
                    this._popup.option(POPUP_OPTION_MAP[name], value);
                    break;
                case "usePopover":
                case "menuWidget":
                    this._invalidate();
                    break;
                case "focusStateEnabled":
                case "activeStateEnabled":
                    if (this._list) {
                        this._list.option(name, value)
                    }
                    this.callBase(args);
                    break;
                case "onItemRendered":
                    if (this._list) {
                        this._list.option(name, value)
                    }
                    break;
                case "opened":
                    if (this._deferRendering) {
                        this._refreshDataSource();
                        this._setListDataSource()
                    }
                    this._toggleMenuVisibility(value);
                    break;
                case "deferRendering":
                case "popupPosition":
                    break;
                default:
                    this.callBase(args)
            }
        },
        open: function() {
            this.option("opened", true)
        },
        close: function() {
            this.option("opened", false)
        }
    }).include(DataHelperMixin);
    registerComponent("dxDropDownMenu", DropDownMenu);
    module.exports = DropDownMenu
});
