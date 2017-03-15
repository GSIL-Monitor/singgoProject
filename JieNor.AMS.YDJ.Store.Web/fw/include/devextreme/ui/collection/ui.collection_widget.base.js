/** 
 * DevExtreme (ui/collection/ui.collection_widget.base.js)
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
        Action = require("../../core/action"),
        Guid = require("../../core/guid"),
        commonUtils = require("../../core/utils/common"),
        domUtils = require("../../core/utils/dom"),
        Widget = require("../widget/ui.widget"),
        eventUtils = require("../../events/utils"),
        pointerEvents = require("../../events/pointer"),
        DataHelperMixin = require("./ui.data_helper"),
        selectors = require("../widget/jquery.selectors"),
        messageLocalization = require("../../localization/message"),
        holdEvent = require("../../events/hold"),
        clickEvent = require("../../events/click"),
        contextmenuEvent = require("../../events/contextmenu");
    var COLLECTION_CLASS = "dx-collection",
        ITEM_CLASS = "dx-item",
        CONTENT_CLASS_POSTFIX = "-content",
        ITEM_CONTENT_PLACEHOLDER_CLASS = "dx-item-content-placeholder",
        ITEM_DATA_KEY = "dxItemData",
        ITEM_INDEX_KEY = "dxItemIndex",
        ITEM_TEMPLATE_ID_PREFIX = "tmpl-",
        ITEMS_SELECTOR = "[data-options*='dxItem']",
        SELECTED_ITEM_CLASS = "dx-item-selected",
        ITEM_RESPONSE_WAIT_CLASS = "dx-item-response-wait",
        EMPTY_COLLECTION = "dx-empty-collection",
        TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper",
        DISABLED_STATE_CLASS = "dx-state-disabled",
        INVISIBLE_STATE_CLASS = "dx-state-invisible",
        ITEM_PATH_REGEX = /^([^.]+\[\d+\]\.)+(\w+)$/;
    var FOCUS_UP = "up",
        FOCUS_DOWN = "down",
        FOCUS_LEFT = "left",
        FOCUS_RIGHT = "right",
        FOCUS_PAGE_UP = "pageup",
        FOCUS_PAGE_DOWN = "pagedown",
        FOCUS_LAST = "last",
        FOCUS_FIRST = "first";
    var CollectionWidget = Widget.inherit({
        _activeStateUnit: "." + ITEM_CLASS,
        _supportedKeys: function() {
            var click = function(e) {
                    var $itemElement = this.option("focusedElement");
                    if (!$itemElement) {
                        return
                    }
                    e.target = $itemElement;
                    e.currentTarget = $itemElement;
                    this._itemClickHandler(e)
                },
                move = function(location, e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this._moveFocus(location, e)
                };
            return $.extend(this.callBase(), {
                space: click,
                enter: click,
                leftArrow: $.proxy(move, this, FOCUS_LEFT),
                rightArrow: $.proxy(move, this, FOCUS_RIGHT),
                upArrow: $.proxy(move, this, FOCUS_UP),
                downArrow: $.proxy(move, this, FOCUS_DOWN),
                pageUp: $.proxy(move, this, FOCUS_UP),
                pageDown: $.proxy(move, this, FOCUS_DOWN),
                home: $.proxy(move, this, FOCUS_FIRST),
                end: $.proxy(move, this, FOCUS_LAST)
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                selectOnFocus: false,
                loopItemFocus: true,
                items: [],
                itemTemplate: "item",
                onItemRendered: null,
                onItemClick: null,
                onItemHold: null,
                itemHoldTimeout: 750,
                onItemContextMenu: null,
                onFocusedItemChanged: null,
                noDataText: messageLocalization.format("dxCollectionWidget-noDataText"),
                dataSource: null,
                _itemAttributes: {},
                itemTemplateProperty: "template",
                focusOnSelectedItem: true,
                focusedElement: null
            })
        },
        _getAnonymousTemplateName: function() {
            return "item"
        },
        _init: function() {
            this.callBase();
            this._cleanRenderedItems();
            this._refreshDataSource()
        },
        _initTemplates: function() {
            this._initItemsFromMarkup();
            this.callBase()
        },
        _initItemsFromMarkup: function() {
            var $items = this.element().contents().filter(ITEMS_SELECTOR);
            if (!$items.length || this.option("items").length) {
                return
            }
            var items = $.map($items, $.proxy(function(item) {
                var $item = $(item);
                var result = domUtils.getElementOptions(item).dxItem;
                var isTemplateRequired = $.trim($item.html()) && !result.template;
                if (isTemplateRequired) {
                    result.template = this._prepareItemTemplate($item)
                } else {
                    $item.remove()
                }
                return result
            }, this));
            this.option("items", items)
        },
        _prepareItemTemplate: function($item) {
            var templateId = ITEM_TEMPLATE_ID_PREFIX + new Guid;
            var templateOptions = 'dxTemplate: { name: "' + templateId + '" }';
            $item.detach().clone().attr("data-options", templateOptions).data("options", templateOptions).appendTo(this.element());
            return templateId
        },
        _dataSourceOptions: function() {
            return {
                paginate: false
            }
        },
        _cleanRenderedItems: function() {
            this._renderedItemsCount = 0
        },
        _focusTarget: function() {
            return this.element()
        },
        _focusInHandler: function(e) {
            this.callBase.apply(this, arguments);
            if ($.inArray(e.target, this._focusTarget()) === -1) {
                return
            }
            var $focusedElement = this.option("focusedElement");
            if ($focusedElement && $focusedElement.length) {
                this._setFocusedItem($focusedElement)
            } else {
                var $activeItem = this._getActiveItem();
                if ($activeItem.length) {
                    this.option("focusedElement", $activeItem)
                }
            }
        },
        _focusOutHandler: function(e) {
            this.callBase.apply(this, arguments);
            var $target = this.option("focusedElement");
            if ($target) {
                this._toggleFocusClass(false, $target)
            }
        },
        _getActiveItem: function(last) {
            var $focusedElement = this.option("focusedElement");
            if ($focusedElement && $focusedElement.length) {
                return $focusedElement
            }
            var index = this.option("focusOnSelectedItem") ? this.option("selectedIndex") : 0,
                activeElements = this._getActiveElement(),
                lastIndex = activeElements.length - 1;
            if (index < 0) {
                index = last ? lastIndex : 0
            }
            return activeElements.eq(index)
        },
        _renderFocusTarget: function() {
            this.callBase.apply(this, arguments);
            this._refreshActiveDescendant()
        },
        _moveFocus: function(location) {
            var $newTarget, $items = this._itemElements().filter(":visible").not(".dx-state-disabled");
            switch (location) {
                case FOCUS_PAGE_UP:
                case FOCUS_UP:
                    $newTarget = this._prevItem($items);
                    break;
                case FOCUS_PAGE_DOWN:
                case FOCUS_DOWN:
                    $newTarget = this._nextItem($items);
                    break;
                case FOCUS_RIGHT:
                    $newTarget = this.option("rtlEnabled") ? this._prevItem($items) : this._nextItem($items);
                    break;
                case FOCUS_LEFT:
                    $newTarget = this.option("rtlEnabled") ? this._nextItem($items) : this._prevItem($items);
                    break;
                case FOCUS_FIRST:
                    $newTarget = $items.first();
                    break;
                case FOCUS_LAST:
                    $newTarget = $items.last();
                    break;
                default:
                    return false
            }
            if (0 !== $newTarget.length) {
                this.option("focusedElement", $newTarget)
            }
        },
        _prevItem: function($items) {
            var $target = this._getActiveItem(),
                targetIndex = $items.index($target),
                $last = $items.last(),
                $item = $($items[targetIndex - 1]),
                loop = this.option("loopItemFocus");
            if (0 === $item.length && loop) {
                $item = $last
            }
            return $item
        },
        _nextItem: function($items) {
            var $target = this._getActiveItem(true),
                targetIndex = $items.index($target),
                $first = $items.first(),
                $item = $($items[targetIndex + 1]),
                loop = this.option("loopItemFocus");
            if (0 === $item.length && loop) {
                $item = $first
            }
            return $item
        },
        _selectFocusedItem: function($target) {
            this.selectItem($target)
        },
        _removeFocusedItem: function($target) {
            if ($target && $target.length) {
                this._toggleFocusClass(false, $target);
                $target.removeAttr("id")
            }
        },
        _refreshActiveDescendant: function() {
            this.setAria("activedescendant", "");
            this.setAria("activedescendant", this.getFocusedItemId())
        },
        _setFocusedItem: function($target) {
            if (!$target || !$target.length) {
                return
            }
            $target.attr("id", this.getFocusedItemId());
            this._toggleFocusClass(true, $target);
            this.onFocusedItemChanged(this.getFocusedItemId());
            this._refreshActiveDescendant();
            if (this.option("selectOnFocus")) {
                this._selectFocusedItem($target)
            }
        },
        _findItemElementByItem: function(item) {
            var result = $(),
                that = this;
            this.itemElements().each(function() {
                var $item = $(this);
                if ($item.data(that._itemDataKey()) === item) {
                    result = $item;
                    return false
                }
            });
            return result
        },
        _getIndexByItem: function(item) {
            return this.option("items").indexOf(item)
        },
        _itemOptionChanged: function(item, property, value) {
            var $item = this._findItemElementByItem(item);
            switch (property) {
                case "visible":
                    this._renderItemVisibleState($item, value);
                    break;
                case "disabled":
                    this._renderItemDisableState($item, value);
                    break;
                default:
                    var index = this._getIndexByItem(item);
                    this._renderItem(index, item, null, $item)
            }
        },
        _renderItemVisibleState: function($item, value) {
            $item.toggleClass(INVISIBLE_STATE_CLASS, !value)
        },
        _renderItemDisableState: function($item, value) {
            $item.toggleClass(DISABLED_STATE_CLASS, !!value)
        },
        _optionChanged: function(args) {
            if ("items" === args.name) {
                var matches = args.fullName.match(ITEM_PATH_REGEX);
                if (matches && matches.length) {
                    var property = matches[matches.length - 1],
                        itemPath = args.fullName.replace("." + property, ""),
                        item = this.option(itemPath);
                    this._itemOptionChanged(item, property, args.value);
                    return
                }
            }
            switch (args.name) {
                case "items":
                case "_itemAttributes":
                case "itemTemplateProperty":
                    this._cleanRenderedItems();
                    this._invalidate();
                    break;
                case "dataSource":
                    this.option("items", []);
                    this._refreshDataSource();
                    this._renderEmptyMessage();
                    break;
                case "noDataText":
                    this._renderEmptyMessage();
                    break;
                case "itemTemplate":
                    this._invalidate();
                    break;
                case "onItemRendered":
                    this._createItemRenderAction();
                    break;
                case "onItemClick":
                    break;
                case "onItemHold":
                case "itemHoldTimeout":
                    this._attachHoldEvent();
                    break;
                case "onItemContextMenu":
                    this._attachContextMenuEvent();
                    break;
                case "onFocusedItemChanged":
                    this.onFocusedItemChanged = this._createActionByOption("onFocusedItemChanged");
                    break;
                case "selectOnFocus":
                case "loopItemFocus":
                case "focusOnSelectedItem":
                    break;
                case "focusedElement":
                    this._removeFocusedItem(args.previousValue);
                    this._setFocusedItem(args.value);
                    break;
                default:
                    this.callBase(args)
            }
        },
        _loadNextPage: function() {
            var dataSource = this._dataSource;
            this._expectNextPageLoading();
            dataSource.pageIndex(1 + dataSource.pageIndex());
            return dataSource.load()
        },
        _expectNextPageLoading: function() {
            this._startIndexForAppendedItems = 0
        },
        _expectLastItemLoading: function() {
            this._startIndexForAppendedItems = -1
        },
        _forgetNextPageLoading: function() {
            this._startIndexForAppendedItems = null
        },
        _dataSourceChangedHandler: function(newItems) {
            var items = this.option("items");
            if (this._initialized && items && this._shouldAppendItems()) {
                this._renderedItemsCount = items.length;
                if (!this._isLastPage() || this._startIndexForAppendedItems !== -1) {
                    this.option().items = items.concat(newItems.slice(this._startIndexForAppendedItems))
                }
                this._forgetNextPageLoading();
                this._renderContent();
                this._renderFocusTarget()
            } else {
                this.option("items", newItems)
            }
        },
        _dataSourceLoadErrorHandler: function() {
            this._forgetNextPageLoading();
            this.option("items", this.option("items"))
        },
        _shouldAppendItems: function() {
            return null != this._startIndexForAppendedItems && this._allowDynamicItemsAppend()
        },
        _allowDynamicItemsAppend: function() {
            return false
        },
        _clean: function() {
            this._cleanFocusState();
            this._cleanItemContainer()
        },
        _cleanItemContainer: function() {
            this._itemContainer().empty()
        },
        _dispose: function() {
            this.callBase();
            clearTimeout(this._itemFocusTimeout)
        },
        _refresh: function() {
            this._cleanRenderedItems();
            this.callBase.apply(this, arguments)
        },
        _itemContainer: function() {
            return this.element()
        },
        _itemClass: function() {
            return ITEM_CLASS
        },
        _itemContentClass: function() {
            return this._itemClass() + CONTENT_CLASS_POSTFIX
        },
        _selectedItemClass: function() {
            return SELECTED_ITEM_CLASS
        },
        _itemResponseWaitClass: function() {
            return ITEM_RESPONSE_WAIT_CLASS
        },
        _itemSelector: function() {
            return "." + this._itemClass()
        },
        _itemDataKey: function() {
            return ITEM_DATA_KEY
        },
        _itemIndexKey: function() {
            return ITEM_INDEX_KEY
        },
        _itemElements: function() {
            return this._itemContainer().find(this._itemSelector())
        },
        _render: function() {
            this.onFocusedItemChanged = this._createActionByOption("onFocusedItemChanged");
            this.callBase();
            this.element().addClass(COLLECTION_CLASS);
            this._attachClickEvent();
            this._attachHoldEvent();
            this._attachContextMenuEvent()
        },
        _attachClickEvent: function() {
            var itemSelector = this._itemSelector(),
                clickEventNamespace = eventUtils.addNamespace(clickEvent.name, this.NAME),
                pointerDownEventNamespace = eventUtils.addNamespace(pointerEvents.down, this.NAME),
                that = this;
            var pointerDownAction = new Action(function(args) {
                var event = args.event;
                that._itemPointerDownHandler(event)
            });
            this._itemContainer().off(clickEventNamespace, itemSelector).off(pointerDownEventNamespace, itemSelector).on(clickEventNamespace, itemSelector, $.proxy(function(e) {
                this._itemClickHandler(e)
            }, this)).on(pointerDownEventNamespace, itemSelector, function(e) {
                pointerDownAction.execute({
                    element: $(e.target),
                    event: e
                })
            })
        },
        _itemClickHandler: function(e, args, config) {
            this._itemJQueryEventHandler(e, "onItemClick", args, config)
        },
        _itemPointerDownHandler: function(e) {
            if (!this.option("focusStateEnabled")) {
                return
            }
            this._itemFocusHandler = function() {
                clearTimeout(this._itemFocusTimeout);
                this._itemFocusHandler = null;
                if (e.isDefaultPrevented()) {
                    return
                }
                var $target = $(e.target),
                    $closestItem = $target.closest(this._itemElements()),
                    $closestFocusable = $target.closest(selectors.focusable);
                if ($closestItem.length && $.inArray($closestFocusable.get(0), this._focusTarget()) !== -1) {
                    this.option("focusedElement", $closestItem)
                }
            }.bind(this);
            this._itemFocusTimeout = setTimeout(this._forcePointerDownFocus.bind(this))
        },
        _forcePointerDownFocus: function() {
            this._itemFocusHandler && this._itemFocusHandler()
        },
        _updateFocusState: function() {
            this.callBase.apply(this, arguments);
            this._forcePointerDownFocus()
        },
        _attachHoldEvent: function() {
            var $itemContainer = this._itemContainer(),
                itemSelector = this._itemSelector(),
                eventName = eventUtils.addNamespace(holdEvent.name, this.NAME);
            $itemContainer.off(eventName, itemSelector);
            if (this._shouldAttachHoldEvent()) {
                $itemContainer.on(eventName, itemSelector, {
                    timeout: this._getHoldTimeout()
                }, $.proxy(this._itemHoldHandler, this))
            }
        },
        _getHoldTimeout: function() {
            return this.option("itemHoldTimeout")
        },
        _shouldAttachHoldEvent: function() {
            return this.option("onItemHold")
        },
        _itemHoldHandler: function(e) {
            this._itemJQueryEventHandler(e, "onItemHold")
        },
        _attachContextMenuEvent: function() {
            var $itemContainer = this._itemContainer(),
                itemSelector = this._itemSelector(),
                eventName = eventUtils.addNamespace(contextmenuEvent.name, this.NAME);
            $itemContainer.off(eventName, itemSelector);
            if (this._shouldAttachContextMenuEvent()) {
                $itemContainer.on(eventName, itemSelector, $.proxy(this._itemContextMenuHandler, this))
            }
        },
        _shouldAttachContextMenuEvent: function() {
            return this.option("onItemContextMenu")
        },
        _itemContextMenuHandler: function(e) {
            this._itemJQueryEventHandler(e, "onItemContextMenu")
        },
        _renderContentImpl: function() {
            var items = this.option("items") || [];
            if (this._renderedItemsCount) {
                this._renderItems(items.slice(this._renderedItemsCount))
            } else {
                this._renderItems(items)
            }
        },
        _renderItems: function(items) {
            if (items.length) {
                $.each(items, $.proxy(this._renderItem, this))
            }
            this._renderEmptyMessage()
        },
        _renderItem: function(index, itemData, $container, $itemToReplace) {
            $container = $container || this._itemContainer();
            var $itemFrame = this._renderItemFrame(index, itemData, $container, $itemToReplace);
            this._setElementData($itemFrame, itemData, index);
            $itemFrame.attr(this.option("_itemAttributes"));
            this._attachItemClickEvent(itemData, $itemFrame);
            var $itemContent = $itemFrame.find("." + ITEM_CONTENT_PLACEHOLDER_CLASS);
            $itemContent.removeClass(ITEM_CONTENT_PLACEHOLDER_CLASS);
            var renderContentPromise = this._renderItemContent({
                index: index,
                itemData: itemData,
                container: $itemContent,
                contentClass: this._itemContentClass(),
                defaultTemplateName: this.option("itemTemplate")
            });
            var that = this;
            $.when(renderContentPromise).done(function($itemContent) {
                that._postprocessRenderItem({
                    itemElement: $itemFrame,
                    itemContent: $itemContent,
                    itemData: itemData,
                    itemIndex: index
                });
                that._executeItemRenderAction(index, itemData, $itemFrame)
            });
            return $itemFrame
        },
        _attachItemClickEvent: function(itemData, $itemElement) {
            if (!itemData || !itemData.onClick) {
                return
            }
            $itemElement.on(clickEvent.name, $.proxy(function(e) {
                this._itemEventHandlerByHandler($itemElement, itemData.onClick, {
                    jQueryEvent: e
                })
            }, this))
        },
        _renderItemContent: function(args) {
            var itemTemplateName = this._getItemTemplateName(args);
            var itemTemplate = this._getTemplate(itemTemplateName);
            this._addItemContentClasses(args);
            var $templateResult = this._createItemByTemplate(itemTemplate, args);
            if (!$templateResult.hasClass(TEMPLATE_WRAPPER_CLASS)) {
                return args.container
            }
            return this._renderItemContentByNode(args, $templateResult)
        },
        _renderItemContentByNode: function(args, $node) {
            args.container.replaceWith($node);
            args.container = $node;
            this._addItemContentClasses(args);
            return $node
        },
        _addItemContentClasses: function(args) {
            var classes = [ITEM_CLASS + CONTENT_CLASS_POSTFIX, args.contentClass];
            args.container.addClass(classes.join(" "))
        },
        _renderItemFrame: function(index, itemData, $container, $itemToReplace) {
            var itemFrameTemplate = this.option("templateProvider").getTemplates(this).itemFrame,
                $itemFrame = itemFrameTemplate.render({
                    model: commonUtils.isDefined(itemData) ? itemData : {},
                    container: $container,
                    index: index
                });
            if ($itemToReplace && $itemToReplace.length) {
                $itemToReplace.replaceWith($itemFrame)
            } else {
                $itemFrame.appendTo($container)
            }
            return $itemFrame
        },
        _postprocessRenderItem: $.noop,
        _executeItemRenderAction: function(index, itemData, itemElement) {
            this._getItemRenderAction()({
                itemElement: itemElement,
                itemIndex: index,
                itemData: itemData
            })
        },
        _setElementData: function(element, data, index) {
            element.addClass([ITEM_CLASS, this._itemClass()].join(" ")).data(this._itemDataKey(), data).data(this._itemIndexKey(), index)
        },
        _createItemRenderAction: function() {
            return this._itemRenderAction = this._createActionByOption("onItemRendered", {
                element: this.element(),
                excludeValidators: ["designMode", "disabled", "readOnly"],
                category: "rendering"
            })
        },
        _getItemRenderAction: function() {
            return this._itemRenderAction || this._createItemRenderAction()
        },
        _getItemTemplateName: function(args) {
            var data = args.itemData,
                templateProperty = args.templateProperty || this.option("itemTemplateProperty"),
                template = data && data[templateProperty];
            return template || args.defaultTemplateName
        },
        _createItemByTemplate: function(itemTemplate, renderArgs) {
            return itemTemplate.render({
                model: renderArgs.itemData,
                container: renderArgs.container,
                index: renderArgs.index
            })
        },
        _emptyMessageContainer: function() {
            return this._itemContainer()
        },
        _renderEmptyMessage: function() {
            var noDataText = this.option("noDataText"),
                items = this.option("items"),
                hideNoData = !noDataText || items && items.length || this._isDataSourceLoading();
            if (hideNoData && this._$nodata) {
                this._$nodata.remove();
                this._$nodata = null;
                this.setAria("label", void 0)
            }
            if (!hideNoData) {
                this._$nodata = this._$nodata || $("<div>").addClass("dx-empty-message");
                this._$nodata.appendTo(this._emptyMessageContainer()).html(noDataText);
                this.setAria("label", noDataText)
            }
            this.element().toggleClass(EMPTY_COLLECTION, !hideNoData)
        },
        _itemJQueryEventHandler: function(jQueryEvent, handlerOptionName, actionArgs, actionConfig) {
            this._itemEventHandler(jQueryEvent.target, handlerOptionName, $.extend(actionArgs, {
                jQueryEvent: jQueryEvent
            }), actionConfig)
        },
        _itemEventHandler: function(initiator, handlerOptionName, actionArgs, actionConfig) {
            var action = this._createActionByOption(handlerOptionName, $.extend({
                validatingTargetName: "itemElement"
            }, actionConfig));
            return this._itemEventHandlerImpl(initiator, action, actionArgs)
        },
        _itemEventHandlerByHandler: function(initiator, handler, actionArgs, actionConfig) {
            var action = this._createAction(handler, $.extend({
                validatingTargetName: "itemElement"
            }, actionConfig));
            return this._itemEventHandlerImpl(initiator, action, actionArgs)
        },
        _itemEventHandlerImpl: function(initiator, action, actionArgs) {
            var $itemElement = this._closestItemElement($(initiator));
            return action($.extend(this._extendActionArgs($itemElement), actionArgs))
        },
        _extendActionArgs: function($itemElement) {
            return {
                itemElement: $itemElement,
                itemIndex: this._itemElements().index($itemElement),
                itemData: this._getItemData($itemElement)
            }
        },
        _closestItemElement: function($element) {
            return $($element).closest(this._itemSelector())
        },
        _getItemData: function(itemElement) {
            return $(itemElement).data(this._itemDataKey())
        },
        getFocusedItemId: function() {
            if (!this._focusedItemId) {
                this._focusedItemId = new Guid
            }
            return this._focusedItemId
        },
        itemElements: function() {
            return this._itemElements()
        },
        itemsContainer: function() {
            return this._itemContainer()
        }
    }).include(DataHelperMixin);
    CollectionWidget.publicName("CollectionWidget");
    module.exports = CollectionWidget
});
