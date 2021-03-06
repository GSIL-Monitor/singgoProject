/** 
 * DevExtreme (ui/toolbar/ui.toolbar.base.js)
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
        registerComponent = require("../../core/component_registrator"),
        CollectionWidget = require("../collection/ui.collection_widget.edit");
    var TOOLBAR_CLASS = "dx-toolbar",
        TOOLBAR_BOTTOM_CLASS = "dx-toolbar-bottom",
        TOOLBAR_MINI_CLASS = "dx-toolbar-mini",
        TOOLBAR_ITEM_CLASS = "dx-toolbar-item",
        TOOLBAR_LABEL_CLASS = "dx-toolbar-label",
        TOOLBAR_BUTTON_CLASS = "dx-toolbar-button",
        TOOLBAR_ITEMS_CONTAINER_CLASS = "dx-toolbar-items-container",
        TOOLBAR_GROUP_CLASS = "dx-toolbar-group",
        TOOLBAR_LABEL_SELECTOR = "." + TOOLBAR_LABEL_CLASS,
        TOOLBAR_ITEM_DATA_KEY = "dxToolbarItemDataKey";
    var ToolbarBase = CollectionWidget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                renderAs: "topToolbar"
            })
        },
        _itemContainer: function() {
            return this._$toolbarItemsContainer.find([".dx-toolbar-before", ".dx-toolbar-center", ".dx-toolbar-after"].join(","))
        },
        _itemClass: function() {
            return TOOLBAR_ITEM_CLASS
        },
        _itemDataKey: function() {
            return TOOLBAR_ITEM_DATA_KEY
        },
        _buttonClass: function() {
            return TOOLBAR_BUTTON_CLASS
        },
        _dimensionChanged: function() {
            this._arrangeItems()
        },
        _render: function() {
            this._renderToolbar();
            this._renderSections();
            this.setAria("role", "toolbar");
            this.callBase();
            this._arrangeItems()
        },
        _renderToolbar: function() {
            this.element().addClass(TOOLBAR_CLASS).toggleClass(TOOLBAR_BOTTOM_CLASS, "bottomToolbar" === this.option("renderAs"));
            this._$toolbarItemsContainer = $("<div>").addClass(TOOLBAR_ITEMS_CONTAINER_CLASS).appendTo(this.element())
        },
        _renderSections: function() {
            var $container = this._$toolbarItemsContainer,
                that = this;
            $.each(["before", "center", "after"], function() {
                var sectionClass = "dx-toolbar-" + this,
                    $section = $container.find("." + sectionClass);
                if (!$section.length) {
                    that["_$" + this + "Section"] = $section = $("<div>").addClass(sectionClass).appendTo($container)
                }
            })
        },
        _arrangeItems: function(elementWidth) {
            elementWidth = elementWidth || this.element().width();
            this._$centerSection.css({
                margin: "0 auto",
                "float": "none"
            });
            var beforeRect = this._$beforeSection.get(0).getBoundingClientRect(),
                centerRect = this._$centerSection.get(0).getBoundingClientRect(),
                afterRect = this._$afterSection.get(0).getBoundingClientRect();
            if (beforeRect.right > centerRect.left || centerRect.right > afterRect.left) {
                this._$centerSection.css({
                    marginLeft: Math.round(beforeRect.width),
                    marginRight: Math.round(afterRect.width),
                    "float": beforeRect.width > afterRect.width ? "none" : "right"
                })
            }
            var $label = this._$toolbarItemsContainer.find(TOOLBAR_LABEL_SELECTOR).eq(0),
                $section = $label.parent();
            if (!$label.length) {
                return
            }
            var labelOffset = beforeRect.width ? Math.round(beforeRect.width) : $label.position().left,
                widthBeforeSection = $section.hasClass("dx-toolbar-before") ? 0 : labelOffset,
                widthAfterSection = $section.hasClass("dx-toolbar-after") ? 0 : Math.round(afterRect.width),
                elemsAtSectionWidth = 0;
            $section.children().not(TOOLBAR_LABEL_SELECTOR).each(function() {
                elemsAtSectionWidth += $(this).outerWidth()
            });
            var freeSpace = elementWidth - elemsAtSectionWidth,
                labelPaddings = $label.outerWidth() - $label.width(),
                labelMaxWidth = Math.max(freeSpace - widthBeforeSection - widthAfterSection - labelPaddings, 0);
            $label.css("max-width", labelMaxWidth)
        },
        _renderItem: function(index, item, itemContainer, $after) {
            var location = item.location || "center",
                container = itemContainer || this._$toolbarItemsContainer.find(".dx-toolbar-" + location),
                itemHasText = Boolean(item.text),
                itemElement = this.callBase(index, item, container, $after);
            itemElement.toggleClass(this._buttonClass(), !itemHasText).toggleClass(TOOLBAR_LABEL_CLASS, itemHasText);
            return itemElement
        },
        _renderGroupedItems: function() {
            var that = this;
            $.each(this.option("items"), function(groupIndex, group) {
                var groupItems = group.items,
                    $container = $("<div>", {
                        "class": TOOLBAR_GROUP_CLASS
                    }),
                    location = group.location || "center";
                if (!groupItems.length) {
                    return
                }
                $.each(groupItems, function(itemIndex, item) {
                    that._renderItem(itemIndex, item, $container, null)
                });
                that._$toolbarItemsContainer.find(".dx-toolbar-" + location).append($container)
            })
        },
        _renderItems: function(items) {
            var grouped = items.length && items[0].items;
            grouped ? this._renderGroupedItems() : this.callBase(items)
        },
        _getToolbarItems: function() {
            return this.option("items") || []
        },
        _renderContentImpl: function() {
            var items = this._getToolbarItems();
            this.element().toggleClass(TOOLBAR_MINI_CLASS, 0 === items.length);
            if (this._renderedItemsCount) {
                this._renderItems(items.slice(this._renderedItemsCount))
            } else {
                this._renderItems(items)
            }
        },
        _renderEmptyMessage: $.noop,
        _clean: function() {
            this._$toolbarItemsContainer.children().empty();
            this.element().empty()
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._arrangeItems()
            }
        },
        _isVisible: function() {
            return this.element().width() > 0 && this.element().height() > 0
        },
        _getIndexByItem: function(item) {
            return $.inArray(item, this._getToolbarItems())
        },
        _itemOptionChanged: function(item, property, value) {
            this.callBase.apply(this, [item, property, value]);
            this._arrangeItems()
        },
        _optionChanged: function(args) {
            var name = args.name;
            switch (name) {
                case "width":
                    this.callBase.apply(this, arguments);
                    this._dimensionChanged();
                    break;
                case "renderAs":
                    this._invalidate();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    });
    registerComponent("dxToolbarBase", ToolbarBase);
    module.exports = ToolbarBase
});
