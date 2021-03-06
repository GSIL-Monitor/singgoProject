/** 
 * DevExtreme (ui/list/ui.list.edit.js)
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
        eventUtils = require("../../events/utils"),
        GroupedEditStrategy = require("./ui.list.edit.strategy.grouped"),
        messageLocalization = require("../../localization/message"),
        EditProvider = require("./ui.list.edit.provider"),
        ListBase = require("./ui.list.base");
    var LIST_ITEM_SELECTED_CLASS = "dx-list-item-selected",
        LIST_ITEM_RESPONSE_WAIT_CLASS = "dx-list-item-response-wait";
    var ListEdit = ListBase.inherit({
        _supportedKeys: function() {
            var that = this,
                parent = this.callBase();
            var deleteFocusedItem = function(e) {
                if (that.option("allowItemDeleting")) {
                    e.preventDefault();
                    that.deleteItem(that.option("focusedElement"))
                }
            };
            var moveFocusedItemUp = function(e) {
                if (e.shiftKey && that.option("allowItemReordering")) {
                    e.preventDefault();
                    var focusedItemIndex = that._editStrategy.getNormalizedIndex(that.option("focusedElement")),
                        $prevItem = that._editStrategy.getItemElement(focusedItemIndex - 1);
                    that.reorderItem(that.option("focusedElement"), $prevItem);
                    that.scrollToItem(that.option("focusedElement"))
                } else {
                    parent.upArrow(e)
                }
            };
            var moveFocusedItemDown = function(e) {
                if (e.shiftKey && that.option("allowItemReordering")) {
                    e.preventDefault();
                    var focusedItemIndex = that._editStrategy.getNormalizedIndex(that.option("focusedElement")),
                        $nextItem = that._editStrategy.getItemElement(focusedItemIndex + 1);
                    that.reorderItem(that.option("focusedElement"), $nextItem);
                    that.scrollToItem(that.option("focusedElement"))
                } else {
                    parent.downArrow(e)
                }
            };
            return $.extend({}, parent, {
                del: deleteFocusedItem,
                upArrow: moveFocusedItemUp,
                downArrow: moveFocusedItemDown
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                showSelectionControls: false,
                selectionMode: "none",
                onSelectAllValueChanged: null,
                selectAllText: messageLocalization.format("dxList-selectAll"),
                menuItems: [],
                menuMode: "context",
                allowItemDeleting: false,
                itemDeleteMode: "toggle",
                allowItemReordering: false
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function(device) {
                    return "ios" === device.platform
                },
                options: {
                    menuMode: "slide",
                    itemDeleteMode: "slideItem"
                }
            }, {
                device: {
                    platform: "android"
                },
                options: {
                    itemDeleteMode: "swipe"
                }
            }, {
                device: {
                    platform: "win"
                },
                options: {
                    itemDeleteMode: "context"
                }
            }, {
                device: {
                    platform: "generic"
                },
                options: {
                    itemDeleteMode: "static"
                }
            }])
        },
        _init: function() {
            this.callBase();
            this._initEditProvider()
        },
        _initEditProvider: function() {
            this._editProvider = new EditProvider(this)
        },
        _disposeEditProvider: function() {
            if (this._editProvider) {
                this._editProvider.dispose()
            }
        },
        _refreshEditProvider: function() {
            this._disposeEditProvider();
            this._initEditProvider()
        },
        _initEditStrategy: function(grouped) {
            if (this.option("grouped")) {
                this._editStrategy = new GroupedEditStrategy(this)
            } else {
                this.callBase()
            }
        },
        _render: function() {
            this._refreshEditProvider();
            this.callBase()
        },
        _renderItems: function() {
            this.callBase.apply(this, arguments);
            this._editProvider.afterItemsRendered()
        },
        _selectedItemClass: function() {
            return LIST_ITEM_SELECTED_CLASS
        },
        _itemResponseWaitClass: function() {
            return LIST_ITEM_RESPONSE_WAIT_CLASS
        },
        _itemClickHandler: function(e) {
            var $itemElement = $(e.currentTarget);
            if ($itemElement.is(".dx-state-disabled, .dx-state-disabled *")) {
                return
            }
            var handledByEditProvider = this._editProvider.handleClick($itemElement, e);
            if (handledByEditProvider) {
                return
            }
            this.callBase.apply(this, arguments)
        },
        _shouldAttachContextMenuEvent: function() {
            return this.callBase.apply(this, arguments) || this._editProvider.contextMenuHandlerExists()
        },
        _itemHoldHandler: function(e) {
            var $itemElement = $(e.currentTarget);
            if ($itemElement.is(".dx-state-disabled, .dx-state-disabled *")) {
                return
            }
            var isTouchEvent = eventUtils.isTouchEvent(e),
                handledByEditProvider = isTouchEvent && this._editProvider.handleContextMenu($itemElement, e);
            if (handledByEditProvider) {
                e.handledByEditProvider = true;
                return
            }
            this.callBase.apply(this, arguments)
        },
        _itemContextMenuHandler: function(e) {
            var $itemElement = $(e.currentTarget);
            if ($itemElement.is(".dx-state-disabled, .dx-state-disabled *")) {
                return
            }
            var handledByEditProvider = !e.handledByEditProvider && this._editProvider.handleContextMenu($itemElement, e);
            if (handledByEditProvider) {
                e.preventDefault();
                return
            }
            this.callBase.apply(this, arguments)
        },
        _postprocessRenderItem: function(args) {
            this.callBase.apply(this, arguments);
            this._editProvider.modifyItemElement(args)
        },
        _clean: function() {
            this._disposeEditProvider();
            this.callBase()
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "grouped":
                    this._clearSelectedItems();
                    delete this._renderingGroupIndex;
                    this._initEditStrategy(args.value);
                    this.callBase(args);
                    break;
                case "showSelectionControls":
                case "menuItems":
                case "menuMode":
                case "allowItemDeleting":
                case "itemDeleteMode":
                case "allowItemReordering":
                case "selectAllText":
                    this._invalidate();
                    break;
                case "onSelectAllValueChanged":
                    break;
                default:
                    this.callBase(args)
            }
        },
        getFlatIndexByItemElement: function(itemElement) {
            return this._itemElements().index(itemElement)
        },
        getItemElementByFlatIndex: function(flatIndex) {
            var $itemElements = this._itemElements();
            if (flatIndex < 0 || flatIndex >= $itemElements.length) {
                return $()
            }
            return $itemElements.eq(flatIndex)
        },
        getItemByIndex: function(index) {
            return this._getItemData(this._itemElements().eq(index))
        }
    });
    module.exports = ListEdit
});
