/** 
 * DevExtreme (ui/multi_view.js)
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
        fx = require("../animation/fx"),
        translator = require("../animation/translator"),
        mathUtils = require("../core/utils/math"),
        commonUtils = require("../core/utils/common"),
        devices = require("../core/devices"),
        registerComponent = require("../core/component_registrator"),
        CollectionWidget = require("./collection/ui.collection_widget.edit"),
        Swipeable = require("../events/gesture/swipeable");
    var MULTIVIEW_CLASS = "dx-multiview",
        MULTIVIEW_WRAPPER_CLASS = "dx-multiview-wrapper",
        MULTIVIEW_ITEM_CONTAINER_CLASS = "dx-multiview-item-container",
        MULTIVIEW_ITEM_CLASS = "dx-multiview-item",
        MULTIVIEW_ITEM_HIDDEN_CLASS = "dx-multiview-item-hidden",
        MULTIVIEW_ITEM_DATA_KEY = "dxMultiViewItemData",
        MULTIVIEW_ANIMATION_DURATION = 200;
    var toNumber = function(value) {
        return +value
    };
    var position = function($element) {
        return translator.locate($element).left
    };
    var move = function($element, position) {
        translator.move($element, {
            left: position
        })
    };
    var animation = {
        moveTo: function($element, position, duration, completeAction) {
            fx.animate($element, {
                type: "slide",
                to: {
                    left: position
                },
                duration: duration,
                complete: completeAction
            })
        },
        complete: function($element) {
            fx.stop($element, true)
        }
    };
    var MultiView = CollectionWidget.inherit({
        _activeStateUnit: "." + MULTIVIEW_ITEM_CLASS,
        _supportedKeys: function() {
            return $.extend(this.callBase(), {
                pageUp: $.noop,
                pageDown: $.noop
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                selectedIndex: 0,
                swipeEnabled: true,
                animationEnabled: true,
                loop: false,
                deferRendering: true,
                _itemAttributes: {
                    role: "tabpanel"
                },
                loopItemFocus: false,
                selectOnFocus: true,
                selectionMode: "single",
                selectionRequired: true,
                selectionByClick: false
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
            }])
        },
        _itemClass: function() {
            return MULTIVIEW_ITEM_CLASS
        },
        _itemDataKey: function() {
            return MULTIVIEW_ITEM_DATA_KEY
        },
        _itemContainer: function() {
            return this._$itemContainer
        },
        _itemElements: function() {
            return this._itemContainer().children(this._itemSelector())
        },
        _itemWidth: function() {
            if (!this._itemWidthValue) {
                this._itemWidthValue = this._$wrapper.width()
            }
            return this._itemWidthValue
        },
        _clearItemWidthCache: function() {
            delete this._itemWidthValue
        },
        _itemsCount: function() {
            return this.option("items").length
        },
        _normalizeIndex: function(index) {
            var count = this._itemsCount();
            if (index < 0) {
                index += count
            }
            if (index >= count) {
                index -= count
            }
            return index
        },
        _getRTLSignCorrection: function() {
            return this.option("rtlEnabled") ? -1 : 1
        },
        _init: function() {
            this.callBase.apply(this, arguments);
            var $element = this.element();
            $element.addClass(MULTIVIEW_CLASS);
            this._$wrapper = $("<div>").addClass(MULTIVIEW_WRAPPER_CLASS);
            this._$wrapper.appendTo($element);
            this._$itemContainer = $("<div>").addClass(MULTIVIEW_ITEM_CONTAINER_CLASS);
            this._$itemContainer.appendTo(this._$wrapper);
            this.option("loopItemFocus", this.option("loop"));
            this._initSwipeable()
        },
        _render: function() {
            this._deferredItems = [];
            this.callBase()
        },
        _renderItemContent: function(args) {
            var renderContentDeferred = $.Deferred();
            var that = this,
                callBase = this.callBase;
            var deferred = $.Deferred();
            deferred.done(function() {
                var $itemContent = callBase.call(that, args);
                renderContentDeferred.resolve($itemContent)
            });
            this._deferredItems.push(deferred);
            this.option("deferRendering") || deferred.resolve();
            return renderContentDeferred.promise()
        },
        _renderSelection: function(addedSelection) {
            this._updateItems(addedSelection[0])
        },
        _updateItems: function(selectedIndex, newIndex) {
            this._updateItemsPosition(selectedIndex, newIndex);
            this._updateItemsVisibility(selectedIndex, newIndex)
        },
        _updateItemsPosition: function(selectedIndex, newIndex) {
            var $itemElements = this._itemElements(),
                positionSign = -this._animationDirection(newIndex, selectedIndex),
                $selectedItem = $itemElements.eq(selectedIndex);
            move($selectedItem, 0);
            move($itemElements.eq(newIndex), 100 * positionSign + "%")
        },
        _updateItemsVisibility: function(selectedIndex, newIndex) {
            var $itemElements = this._itemElements();
            $itemElements.each($.proxy(function(itemIndex, item) {
                var $item = $(item),
                    isHidden = itemIndex !== selectedIndex && itemIndex !== newIndex;
                if (!isHidden) {
                    this._renderSpecificItem(itemIndex)
                }
                $item.toggleClass(MULTIVIEW_ITEM_HIDDEN_CLASS, isHidden);
                this.setAria("hidden", isHidden || void 0, $item)
            }, this))
        },
        _renderSpecificItem: function(index) {
            var hasItemContent = this._itemElements().eq(index).find(this._itemContentClass()).length > 0;
            if (commonUtils.isDefined(index) && !hasItemContent) {
                this._deferredItems[index].resolve()
            }
        },
        _setAriaSelected: $.noop,
        _updateSelection: function(addedSelection, removedSelection) {
            var newIndex = addedSelection[0],
                prevIndex = removedSelection[0];
            animation.complete(this._$itemContainer);
            this._updateItems(prevIndex, newIndex);
            var animationDirection = this._animationDirection(newIndex, prevIndex);
            this._animateItemContainer(animationDirection * this._itemWidth(), $.proxy(function() {
                move(this._$itemContainer, 0);
                this._updateItems(newIndex);
                this._$itemContainer.width()
            }, this))
        },
        _animateItemContainer: function(position, completeCallback) {
            var duration = this.option("animationEnabled") ? MULTIVIEW_ANIMATION_DURATION : 0;
            animation.moveTo(this._$itemContainer, position, duration, completeCallback)
        },
        _animationDirection: function(newIndex, prevIndex) {
            var containerPosition = position(this._$itemContainer),
                indexDifference = (prevIndex - newIndex) * this._getRTLSignCorrection() * this._getItemFocusLoopSignCorrection(),
                isSwipePresent = 0 !== containerPosition,
                directionSignVariable = isSwipePresent ? containerPosition : indexDifference;
            return mathUtils.sign(directionSignVariable)
        },
        _initSwipeable: function() {
            this._createComponent(this.element(), Swipeable, {
                disabled: !this.option("swipeEnabled"),
                elastic: false,
                itemSizeFunc: $.proxy(this._itemWidth, this),
                onStart: $.proxy(function(args) {
                    this._swipeStartHandler(args.jQueryEvent)
                }, this),
                onUpdated: $.proxy(function(args) {
                    this._swipeUpdateHandler(args.jQueryEvent)
                }, this),
                onEnd: $.proxy(function(args) {
                    this._swipeEndHandler(args.jQueryEvent)
                }, this)
            })
        },
        _swipeStartHandler: function(e) {
            animation.complete(this._$itemContainer);
            var selectedIndex = this.option("selectedIndex"),
                loop = this.option("loop"),
                lastIndex = this._itemsCount() - 1,
                rtl = this.option("rtlEnabled");
            e.maxLeftOffset = toNumber(loop || (rtl ? selectedIndex > 0 : selectedIndex < lastIndex));
            e.maxRightOffset = toNumber(loop || (rtl ? selectedIndex < lastIndex : selectedIndex > 0));
            this._swipeDirection = null
        },
        _swipeUpdateHandler: function(e) {
            var offset = e.offset,
                swipeDirection = mathUtils.sign(offset) * this._getRTLSignCorrection();
            move(this._$itemContainer, offset * this._itemWidth());
            if (swipeDirection !== this._swipeDirection) {
                this._swipeDirection = swipeDirection;
                var selectedIndex = this.option("selectedIndex"),
                    newIndex = this._normalizeIndex(selectedIndex - swipeDirection);
                this._updateItems(selectedIndex, newIndex)
            }
        },
        _swipeEndHandler: function(e) {
            var targetOffset = e.targetOffset * this._getRTLSignCorrection();
            if (targetOffset) {
                this.option("selectedIndex", this._normalizeIndex(this.option("selectedIndex") - targetOffset));
                var $selectedElement = this.itemElements().filter(".dx-item-selected");
                this.option("focusStateEnabled") && this.option("focusedElement", $selectedElement)
            } else {
                this._animateItemContainer(0, $.noop)
            }
        },
        _getItemFocusLoopSignCorrection: function() {
            return this._itemFocusLooped ? -1 : 1
        },
        _moveFocus: function() {
            this.callBase.apply(this, arguments);
            this._itemFocusLooped = false
        },
        _prevItem: function($items) {
            var $result = this.callBase.apply(this, arguments);
            this._itemFocusLooped = $result.is($items.last());
            return $result
        },
        _nextItem: function($items) {
            var $result = this.callBase.apply(this, arguments);
            this._itemFocusLooped = $result.is($items.first());
            return $result
        },
        _dimensionChanged: function() {
            this._clearItemWidthCache()
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._dimensionChanged()
            }
        },
        _optionChanged: function(args) {
            var value = args.value;
            switch (args.name) {
                case "loop":
                    this.option("loopItemFocus", value);
                    break;
                case "animationEnabled":
                    break;
                case "swipeEnabled":
                    Swipeable.getInstance(this.element()).option("disabled", !value);
                    break;
                case "deferRendering":
                    this._invalidate();
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxMultiView", MultiView);
    module.exports = MultiView
});
