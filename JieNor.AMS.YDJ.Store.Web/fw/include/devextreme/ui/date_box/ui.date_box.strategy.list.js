/** 
 * DevExtreme (ui/date_box/ui.date_box.strategy.list.js)
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
        List = require("../list"),
        DateBoxStrategy = require("./ui.date_box.strategy"),
        devices = require("../../core/devices"),
        commonUtils = require("../../core/utils/common"),
        dateUtils = require("./ui.date_utils"),
        dateLocalization = require("../../localization/date");
    var BOUNDARY_VALUES = {
        min: new Date(0, 0, 0, 0, 0),
        max: new Date(0, 0, 0, 23, 59)
    };
    var ListStrategy = DateBoxStrategy.inherit({
        NAME: "List",
        supportedKeys: function() {
            return {
                tab: function(e) {
                    if (this.option("opened")) {
                        this.close()
                    }
                },
                space: $.noop,
                home: $.noop,
                end: $.noop
            }
        },
        getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                applyValueMode: "instantly"
            })
        },
        getDisplayFormat: function(displayFormat) {
            return displayFormat || dateLocalization.getPatternByFormat("shorttime")
        },
        popupConfig: function(popupConfig) {
            var device = devices.current(),
                result = $.extend(popupConfig, {
                    width: this._getPopupWidth()
                });
            if ("android" === device.platform) {
                $.extend(result, {
                    position: {
                        offset: {
                            h: -16,
                            v: -10
                        }
                    }
                })
            }
            return result
        },
        _getPopupWidth: function() {
            var device = devices.current(),
                result = this.dateBox.element().outerWidth();
            if ("android" === device.platform) {
                result += 32
            }
            return result
        },
        popupShowingHandler: function() {
            this._dimensionChanged()
        },
        _renderWidget: function() {
            this.callBase();
            this._refreshItems()
        },
        _getWidgetName: function() {
            return List
        },
        _getWidgetOptions: function() {
            var keyboardProcessor = this.dateBox._keyboardProcessor;
            return {
                _keyboardProcessor: keyboardProcessor ? keyboardProcessor.attachChildProcessor() : null,
                itemTemplate: $.proxy(this._timeListItemTemplate, this),
                onItemClick: $.proxy(this._listItemClickHandler, this),
                tabIndex: -1,
                onFocusedItemChanged: $.proxy(this._refreshActiveDescendant, this),
                selectionMode: "single"
            }
        },
        _refreshActiveDescendant: function(e) {
            this.dateBox.setAria("activedescendant", "");
            this.dateBox.setAria("activedescendant", e.actionValue)
        },
        _refreshItems: function() {
            this._widgetItems = this._getTimeListItems();
            this._widget.option("items", this._widgetItems)
        },
        renderOpenedState: function() {
            if (!this._widget) {
                return
            }
            this._widget.option("focusedElement", null);
            this._setSelectedItemsByValue();
            this._scrollToSelectedItem()
        },
        _updateValue: function() {
            if (!this._widget) {
                return
            }
            this._refreshItems();
            this._setSelectedItemsByValue();
            this._scrollToSelectedItem()
        },
        _setSelectedItemsByValue: function() {
            var value = this.dateBoxValue();
            var dateIndex = this._getDateIndex(value);
            if (dateIndex === -1) {
                this._widget.option("selectedItems", [])
            } else {
                this._widget.option("selectedIndex", dateIndex)
            }
        },
        _scrollToSelectedItem: function() {
            this._widget.scrollToItem(this._widget.option("selectedIndex"))
        },
        _getDateIndex: function(date) {
            var result = -1;
            for (var i = 0, n = this._widgetItems.length; i < n; i++) {
                if (this._areDatesEqual(date, this._widgetItems[i])) {
                    result = i;
                    break
                }
            }
            return result
        },
        _areDatesEqual: function(first, second) {
            return commonUtils.isDate(first) && commonUtils.isDate(second) && first.getHours() === second.getHours() && first.getMinutes() === second.getMinutes()
        },
        _getTimeListItems: function() {
            var min = this.dateBox.dateOption("min") || this._getBoundaryDate("min"),
                max = this.dateBox.dateOption("max") || this._getBoundaryDate("max"),
                value = this.dateBox.dateOption("value"),
                delta = max - min,
                minutes = min.getMinutes() % this.dateBox.option("interval");
            if (delta < 0) {
                return []
            }
            if (delta > dateUtils.ONE_DAY) {
                delta = dateUtils.ONE_DAY
            }
            if (value - min < dateUtils.ONE_DAY) {
                return this._getRangeItems(min, new Date(min), delta)
            }
            min = this._getBoundaryDate("min");
            min.setMinutes(minutes);
            if (value && Math.abs(value - max) < dateUtils.ONE_DAY) {
                delta = (60 * max.getHours() + Math.abs(max.getMinutes() - minutes)) * dateUtils.ONE_MINUTE
            }
            return this._getRangeItems(min, new Date(min), delta)
        },
        _getRangeItems: function(startValue, currentValue, rangeDuration) {
            var rangeItems = [];
            var interval = this.dateBox.option("interval");
            while (currentValue - startValue < rangeDuration) {
                rangeItems.push(new Date(currentValue));
                currentValue.setMinutes(currentValue.getMinutes() + interval)
            }
            return rangeItems
        },
        _getBoundaryDate: function(boundary) {
            var boundaryValue = BOUNDARY_VALUES[boundary],
                currentValue = this.dateBox.dateOption("value") || new Date;
            return new Date(currentValue.getFullYear(), currentValue.getMonth(), currentValue.getDate(), boundaryValue.getHours(), boundaryValue.getMinutes())
        },
        _timeListItemTemplate: function(itemData) {
            var displayFormat = this.dateBox.option("displayFormat");
            return dateLocalization.format(itemData, this.getDisplayFormat(displayFormat))
        },
        _listItemClickHandler: function(e) {
            this.dateBox.option("opened", false);
            var date = this.dateBox.option("value");
            date = date ? new Date(date) : new Date;
            date.setHours(e.itemData.getHours());
            date.setMinutes(e.itemData.getMinutes());
            date.setSeconds(e.itemData.getSeconds());
            this.dateBoxValue(date)
        },
        attachKeyboardEvents: function(keyboardProcessor) {
            var child = keyboardProcessor.attachChildProcessor();
            if (this._widget) {
                this._widget.option("_keyboardProcessor", child)
            }
        },
        _dimensionChanged: function() {
            this._getPopup() && this._updatePopupDimensions()
        },
        _updatePopupDimensions: function() {
            this._updatePopupWidth();
            this._updatePopupHeight()
        },
        _updatePopupWidth: function() {
            this.dateBox._setPopupOption("width", this._getPopupWidth())
        },
        _updatePopupHeight: function() {
            this.dateBox._setPopupOption("height", "auto");
            var popupHeight = this._widget.element().outerHeight();
            var maxHeight = .45 * $(window).height();
            this.dateBox._setPopupOption("height", Math.min(popupHeight, maxHeight));
            this.dateBox._timeList && this.dateBox._timeList.updateDimensions()
        }
    });
    module.exports = ListStrategy
});
