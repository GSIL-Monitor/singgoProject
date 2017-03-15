/** 
 * DevExtreme (ui/action_sheet.js)
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
        messageLocalization = require("../localization/message"),
        registerComponent = require("../core/component_registrator"),
        Button = require("./button"),
        CollectionWidget = require("./collection/ui.collection_widget.edit"),
        Popup = require("./popup"),
        Popover = require("./popover");
    var ACTION_SHEET_CLASS = "dx-actionsheet",
        ACTION_SHEET_CONTAINER_CLASS = "dx-actionsheet-container",
        ACTION_SHEET_POPUP_WRAPPER_CLASS = "dx-actionsheet-popup-wrapper",
        ACTION_SHEET_POPOVER_WRAPPER_CLASS = "dx-actionsheet-popover-wrapper",
        ACTION_SHEET_CANCEL_BUTTON_CLASS = "dx-actionsheet-cancel",
        ACTION_SHEET_ITEM_CLASS = "dx-actionsheet-item",
        ACTION_SHEET_ITEM_DATA_KEY = "dxActionSheetItemData",
        ACTION_SHEET_WITHOUT_TITLE_CLASS = "dx-actionsheet-without-title";
    var ActionSheet = CollectionWidget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                usePopover: false,
                target: null,
                title: "",
                showTitle: true,
                showCancelButton: true,
                cancelText: messageLocalization.format("Cancel"),
                onCancelClick: null,
                visible: false,
                noDataText: "",
                focusStateEnabled: false,
                selectionByClick: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    platform: "ios",
                    tablet: true
                },
                options: {
                    usePopover: true
                }
            }])
        },
        _itemContainer: function() {
            return this._$itemContainer
        },
        _itemClass: function() {
            return ACTION_SHEET_ITEM_CLASS
        },
        _itemDataKey: function() {
            return ACTION_SHEET_ITEM_DATA_KEY
        },
        _toggleVisibility: $.noop,
        _renderDimensions: $.noop,
        _render: function() {
            this.element().addClass(ACTION_SHEET_CLASS);
            this._createItemContainer();
            this._renderPopup()
        },
        _createItemContainer: function() {
            this._$itemContainer = $("<div>").addClass(ACTION_SHEET_CONTAINER_CLASS);
            this._renderDisabled()
        },
        _renderDisabled: function() {
            this._$itemContainer.toggleClass("dx-state-disabled", this.option("disabled"))
        },
        _renderPopup: function() {
            this._$popup = $("<div>").appendTo(this.element());
            this._isPopoverMode() ? this._createPopover() : this._createPopup();
            this._renderPopupTitle();
            this._mapPopupOption("visible")
        },
        _mapPopupOption: function(optionName) {
            this._popup.option(optionName, this.option(optionName))
        },
        _isPopoverMode: function() {
            return this.option("usePopover") && this.option("target")
        },
        _renderPopupTitle: function() {
            this._mapPopupOption("showTitle");
            this._popup._wrapper().toggleClass(ACTION_SHEET_WITHOUT_TITLE_CLASS, !this.option("showTitle"))
        },
        _clean: function() {
            if (this._$popup) {
                this._$popup.remove()
            }
            this.callBase()
        },
        _overlayConfig: function() {
            return {
                onInitialized: $.proxy(function(args) {
                    this._popup = args.component
                }, this),
                disabled: false,
                showTitle: true,
                title: this.option("title"),
                deferRendering: !window.angular,
                onContentReady: $.proxy(this._popupContentReadyAction, this),
                onHidden: $.proxy(this.hide, this)
            }
        },
        _createPopover: function() {
            this._createComponent(this._$popup, Popover, $.extend(this._overlayConfig(), {
                width: this.option("width") || 200,
                height: this.option("height") || "auto",
                target: this.option("target")
            }));
            this._popup._wrapper().addClass(ACTION_SHEET_POPOVER_WRAPPER_CLASS)
        },
        _createPopup: function() {
            this._createComponent(this._$popup, Popup, $.extend(this._overlayConfig(), {
                dragEnabled: false,
                width: this.option("width") || "100%",
                height: this.option("height") || "auto",
                showCloseButton: false,
                position: {
                    my: "bottom",
                    at: "bottom",
                    of: window
                },
                animation: {
                    show: {
                        type: "slide",
                        duration: 400,
                        from: {
                            position: {
                                my: "top",
                                at: "bottom",
                                of: window
                            }
                        },
                        to: {
                            position: {
                                my: "bottom",
                                at: "bottom",
                                of: window
                            }
                        }
                    },
                    hide: {
                        type: "slide",
                        duration: 400,
                        from: {
                            position: {
                                my: "bottom",
                                at: "bottom",
                                of: window
                            }
                        },
                        to: {
                            position: {
                                my: "top",
                                at: "bottom",
                                of: window
                            }
                        }
                    }
                }
            }));
            this._popup._wrapper().addClass(ACTION_SHEET_POPUP_WRAPPER_CLASS)
        },
        _popupContentReadyAction: function() {
            this._popup.content().append(this._$itemContainer);
            this._attachClickEvent();
            this._attachHoldEvent();
            this._renderContent();
            this._renderCancelButton()
        },
        _renderCancelButton: function() {
            if (this._isPopoverMode()) {
                return
            }
            if (this._$cancelButton) {
                this._$cancelButton.remove()
            }
            if (this.option("showCancelButton")) {
                var cancelClickAction = this._createActionByOption("onCancelClick") || $.noop,
                    that = this;
                this._$cancelButton = $("<div>").addClass(ACTION_SHEET_CANCEL_BUTTON_CLASS).appendTo(this._popup.content());
                this._createComponent(this._$cancelButton, Button, {
                    disabled: false,
                    text: this.option("cancelText"),
                    onClick: function(e) {
                        var hidingArgs = {
                            jQueryEvent: e,
                            cancel: false
                        };
                        cancelClickAction(hidingArgs);
                        if (!hidingArgs.cancel) {
                            that.hide()
                        }
                    },
                    _templates: {}
                })
            }
        },
        _attachItemClickEvent: $.noop,
        _itemClickHandler: function(e) {
            this.callBase(e);
            if (!$(e.target).is(".dx-state-disabled, .dx-state-disabled *")) {
                this.hide()
            }
        },
        _itemHoldHandler: function(e) {
            this.callBase(e);
            if (!$(e.target).is(".dx-state-disabled, .dx-state-disabled *")) {
                this.hide()
            }
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "width":
                case "height":
                case "visible":
                case "title":
                    this._mapPopupOption(args.name);
                    break;
                case "disabled":
                    this._renderDisabled();
                    break;
                case "showTitle":
                    this._renderPopupTitle();
                    break;
                case "showCancelButton":
                case "onCancelClick":
                case "cancelText":
                    this._renderCancelButton();
                    break;
                case "target":
                case "usePopover":
                case "items":
                    this._invalidate();
                    break;
                default:
                    this.callBase(args)
            }
        },
        toggle: function(showing) {
            var that = this,
                d = $.Deferred();
            that._popup.toggle(showing).done(function() {
                that.option("visible", showing);
                d.resolveWith(that)
            });
            return d.promise()
        },
        show: function() {
            return this.toggle(true)
        },
        hide: function() {
            return this.toggle(false)
        }
    });
    registerComponent("dxActionSheet", ActionSheet);
    module.exports = ActionSheet
});
