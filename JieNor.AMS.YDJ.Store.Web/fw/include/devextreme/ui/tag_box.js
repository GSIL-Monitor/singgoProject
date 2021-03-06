/** 
 * DevExtreme (ui/tag_box.js)
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
        commonUtils = require("../core/utils/common"),
        arrayUtils = require("../core/utils/array"),
        messageLocalization = require("../localization/message"),
        registerComponent = require("../core/component_registrator"),
        eventUtils = require("../events/utils"),
        SelectBox = require("./select_box"),
        clickEvent = require("../events/click"),
        caret = require("./text_box/utils.caret"),
        browser = require("../core/utils/browser");
    var TAGBOX_TAG_DATA_KEY = "dxTagData";
    var TAGBOX_CLASS = "dx-tagbox",
        TAGBOX_TAG_CONTAINER_CLASS = "dx-tag-container",
        TAGBOX_TAG_CLASS = "dx-tag",
        TAGBOX_TAG_REMOVE_BUTTON_CLASS = "dx-tag-remove-button",
        TAGBOX_ONLY_SELECT_CLASS = "dx-tagbox-only-select",
        TAGBOX_SINGLE_LINE_CLASS = "dx-tagbox-single-line",
        TAGBOX_POPUP_WRAPPER_CLASS = "dx-tagbox-popup-wrapper",
        LIST_SELECT_ALL_CHECKBOX_CLASS = "dx-list-select-all-checkbox",
        NATIVE_CLICK_CLASS = "dx-native-click";
    var TAGBOX_MOUSE_WHEEL_DELTA_MULTIPLIER = -.3;
    var TagBox = SelectBox.inherit({
        _supportedKeys: function() {
            var parent = this.callBase();
            return $.extend(parent, {
                backspace: function(e) {
                    if (!this._isCaretAtTheStart()) {
                        return
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    this._isTagRemoved = true;
                    var $tagToDelete = this._$focusedTag || this._tagElements().last();
                    if (this._$focusedTag) {
                        this._moveTagFocus("prev", true)
                    }
                    if (0 === $tagToDelete.length) {
                        return
                    }
                    this._preserveFocusedTag = true;
                    this._removeTagElement($tagToDelete);
                    delete this._preserveFocusedTag
                },
                del: function(e) {
                    if (!this._$focusedTag || !this._isCaretAtTheStart()) {
                        return
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    this._isTagRemoved = true;
                    var $tagToDelete = this._$focusedTag;
                    this._moveTagFocus("next", true);
                    this._preserveFocusedTag = true;
                    this._removeTagElement($tagToDelete);
                    delete this._preserveFocusedTag
                },
                enter: function(e) {
                    var isListItemFocused = this._list && null !== this._list.option("focusedElement"),
                        isCustomItem = this.option("acceptCustomValue") && !isListItemFocused;
                    if (isCustomItem) {
                        e.preventDefault();
                        "" !== this._searchValue() && this._customItemAddedHandler();
                        return
                    }
                    if (!this.option("opened")) {
                        return
                    }
                    e.preventDefault();
                    this._keyboardProcessor._childProcessors[0].process(e)
                },
                leftArrow: function(e) {
                    if (!this._isCaretAtTheStart()) {
                        return
                    }
                    var rtlEnabled = this.option("rtlEnabled");
                    if (this._isEditable() && rtlEnabled && !this._$focusedTag) {
                        return
                    }
                    e.preventDefault();
                    var direction = rtlEnabled ? "next" : "prev";
                    this._moveTagFocus(direction);
                    !this.option("multiline") && this._scrollContainer(direction)
                },
                rightArrow: function(e) {
                    if (!this._isCaretAtTheStart()) {
                        return
                    }
                    var rtlEnabled = this.option("rtlEnabled");
                    if (this._isEditable() && !rtlEnabled && !this._$focusedTag) {
                        return
                    }
                    e.preventDefault();
                    var direction = rtlEnabled ? "prev" : "next";
                    this._moveTagFocus(direction);
                    !this.option("multiline") && this._scrollContainer(direction)
                }
            })
        },
        _isCaretAtTheStart: function() {
            return 0 === caret(this._input()).start
        },
        _moveTagFocus: function(direction, clearOnBoundary) {
            if (!this._$focusedTag) {
                var tagElements = this._tagElements();
                this._$focusedTag = "next" === direction ? tagElements.first() : tagElements.last();
                this._toggleFocusClass(true, this._$focusedTag);
                return
            }
            var $nextFocusedTag = this._$focusedTag[direction]("." + TAGBOX_TAG_CLASS);
            if ($nextFocusedTag.length > 0) {
                this._replaceFocusedTag($nextFocusedTag)
            } else {
                if (clearOnBoundary || "next" === direction && this._isEditable()) {
                    this._clearTagFocus()
                }
            }
        },
        _replaceFocusedTag: function($nextFocusedTag) {
            this._toggleFocusClass(false, this._$focusedTag);
            this._$focusedTag = $nextFocusedTag;
            this._toggleFocusClass(true, this._$focusedTag)
        },
        _clearTagFocus: function() {
            if (!this._$focusedTag) {
                return
            }
            this._toggleFocusClass(false, this._$focusedTag);
            delete this._$focusedTag
        },
        _focusClassTarget: function($element) {
            if ($element && $element.length && $element[0] !== this._focusTarget()[0]) {
                return $element
            }
            return this.callBase()
        },
        _scrollContainer: function(direction) {
            if (this.option("multiline")) {
                return
            }
            if (!this._$tagsContainer) {
                return
            }
            var scrollPosition = this._getScrollPosition(direction);
            this._$tagsContainer.scrollLeft(scrollPosition)
        },
        _getScrollPosition: function(direction) {
            if ("start" === direction || "end" === direction) {
                return this._getBorderPosition(direction)
            }
            return this._$focusedTag ? this._getFocusedTagPosition(direction) : this._getBorderPosition("end")
        },
        _getBorderPosition: function(direction) {
            var rtlEnabled = this.option("rtlEnabled"),
                isScrollLeft = "end" === direction ^ rtlEnabled,
                isScrollReverted = rtlEnabled && !browser.webkit,
                scrollSign = !rtlEnabled || browser.webkit || browser.msie ? 1 : -1;
            return isScrollLeft ^ !isScrollReverted ? 0 : scrollSign * (this._$tagsContainer.get(0).scrollWidth - this._$tagsContainer.outerWidth())
        },
        _getFocusedTagPosition: function(direction) {
            var rtlEnabled = this.option("rtlEnabled"),
                isScrollLeft = "next" === direction ^ rtlEnabled,
                scrollOffset = Math.floor(this._$focusedTag.position().left),
                scrollLeft = this._$tagsContainer.scrollLeft();
            if (isScrollLeft) {
                scrollOffset += this._$focusedTag.outerWidth(true) - this._$tagsContainer.outerWidth()
            }
            if (isScrollLeft ^ scrollOffset < 0) {
                var scrollCorrection = rtlEnabled && browser.msie ? -1 : 1;
                scrollLeft += scrollOffset * scrollCorrection
            }
            return scrollLeft
        },
        _setNextValue: $.noop,
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                values: {
                    since: "16.1",
                    alias: "value"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                value: [],
                showDropButton: false,
                tagTemplate: "tag",
                selectAllText: messageLocalization.format("dxList-selectAll"),
                hideSelectedItems: false,
                selectedItems: [],
                onSelectAllValueChanged: null,
                multiline: true
            })
        },
        _init: function() {
            this.callBase();
            this._setListDataSourceFilter();
            this._selectedItems = [];
            this._initSelectAllValueChangedAction()
        },
        _render: function() {
            this.element().addClass(TAGBOX_CLASS).toggleClass(TAGBOX_ONLY_SELECT_CLASS, !(this.option("searchEnabled") || this.option("acceptCustomValue"))).toggleClass(TAGBOX_SINGLE_LINE_CLASS, !this.option("multiline"));
            this._toggleRTLDirection(this.option("rtlEnabled"));
            this._initTagTemplate();
            this.callBase();
            this._renderTagRemoveAction();
            this._renderSingleLineScroll();
            this._scrollContainer("start")
        },
        _initTagTemplate: function() {
            this._tagTemplate = this._getTemplateByOption("tagTemplate")
        },
        _renderTagRemoveAction: function() {
            var tagRemoveAction = this._createAction($.proxy(this._removeTagHandler, this));
            var eventName = eventUtils.addNamespace(clickEvent.name, "dxTagBoxTagRemove");
            this.element().find(".dx-texteditor-container").off(eventName).on(eventName, "." + TAGBOX_TAG_REMOVE_BUTTON_CLASS, function(e) {
                tagRemoveAction({
                    jQueryEvent: e
                })
            });
            this._renderTypingEvent()
        },
        _renderSingleLineScroll: function() {
            var mouseWheelEvent = eventUtils.addNamespace("dxmousewheel", this.NAME),
                $element = this.element(),
                isMultiline = this.option("multiline");
            $element.off(mouseWheelEvent);
            if ("desktop" !== devices.real().deviceType) {
                this._$tagsContainer && this._$tagsContainer.css("overflow-x", isMultiline ? "" : "auto");
                return
            }
            if (isMultiline) {
                return
            }
            $element.on(mouseWheelEvent, $.proxy(this._tagContainerMouseWheelHandler, this))
        },
        _tagContainerMouseWheelHandler: function(e) {
            var scrollLeft = this._$tagsContainer.scrollLeft();
            this._$tagsContainer.scrollLeft(scrollLeft + e.delta * TAGBOX_MOUSE_WHEEL_DELTA_MULTIPLIER);
            return false
        },
        _renderTypingEvent: function() {
            this._input().on(eventUtils.addNamespace("keydown", this.NAME), $.proxy(function(e) {
                var keyCode = e.which || e.keyCode;
                if (!this._isControlKey(keyCode) && this._isEditable()) {
                    this._clearTagFocus()
                }
            }, this))
        },
        _popupWrapperClass: function() {
            return this.callBase() + " " + TAGBOX_POPUP_WRAPPER_CLASS
        },
        _renderInputValueImpl: function() {
            this._renderMultiSelect()
        },
        _clearTextValue: function() {
            this._input().val("")
        },
        _focusInHandler: function(e) {
            this.callBase(e);
            this._scrollContainer("end")
        },
        _focusOutHandler: function(e) {
            if (this.option("opened") && "useButtons" === this.option("applyValueMode")) {
                return
            }
            this.callBase(e);
            this._clearTextValue();
            this._clearTagFocus();
            this._scrollContainer("start")
        },
        _getFirstPopupElement: function() {
            return this.option("showSelectionControls") ? this._popup._wrapper().find("." + LIST_SELECT_ALL_CHECKBOX_CLASS) : this.callBase()
        },
        _suppressingSelectionChanged: function(callback) {
            this._setListOption("onSelectionChanged", $.noop);
            callback.call(this);
            this._setListOption("onSelectionChanged", this._getSelectionChangeHandler())
        },
        _initSelectAllValueChangedAction: function() {
            this._selectAllValueChangeAction = this._createActionByOption("onSelectAllValueChanged")
        },
        _renderList: function() {
            this.callBase();
            if (!this.option("showSelectionControls")) {
                return
            }
            var $selectAllCheckBox = this._list.element().find("." + LIST_SELECT_ALL_CHECKBOX_CLASS),
                selectAllCheckbox = $selectAllCheckBox.dxCheckBox("instance");
            selectAllCheckbox.registerKeyHandler("tab", $.proxy(this._popupElementTabHandler, this));
            selectAllCheckbox.registerKeyHandler("escape", $.proxy(this._popupElementEscHandler, this))
        },
        _listConfig: function() {
            var that = this,
                selectionMode = this.option("showSelectionControls") ? "all" : "multiple";
            return $.extend(this.callBase(), {
                selectionMode: selectionMode,
                selectAllText: this.option("selectAllText"),
                onSelectAllValueChanged: function(e) {
                    that._selectAllValueChangeAction({
                        value: e.value
                    })
                },
                selectedItems: this._selectedItems,
                onFocusedItemChanged: null
            })
        },
        _renderMultiSelect: function() {
            this._$tagsContainer = this.element().find(".dx-texteditor-container").addClass(TAGBOX_TAG_CONTAINER_CLASS).addClass(NATIVE_CLICK_CLASS);
            this._renderInputSize();
            this._clearFilter();
            this._renderTags();
            this._popup && this._popup.repaint()
        },
        _listItemClickHandler: function(e) {
            this._clearTextValue();
            if ("useButtons" === this.option("applyValueMode")) {
                return
            }
            this.callBase(e)
        },
        _renderInputSize: function() {
            var $input = this._input();
            $input.prop("size", $input.val() ? $input.val().length + 2 : 1)
        },
        _renderInputSubstitution: function() {
            this.callBase();
            this._renderInputSize()
        },
        _getValue: function() {
            return this.option("value") || []
        },
        _renderTags: function() {
            this._cleanTags();
            var $input = this._input();
            var itemLoadDeferreds = $.map(this._getValue(), $.proxy(function(value) {
                return this._renderTag(value, $input)
            }, this));
            $.when.apply($, itemLoadDeferreds).done($.proxy(function() {
                this._renderInputAddons();
                this._scrollContainer("end");
                this.option("selectedItems", this._selectedItems.slice())
            }, this));
            this._renderEmptyState();
            if (!this._preserveFocusedTag) {
                this._clearTagFocus()
            }
        },
        _renderEmptyState: function() {
            var isEmpty = !(this._getValue().length || this._selectedItems.length || this._searchValue());
            this._toggleEmptiness(isEmpty);
            this._renderDisplayText()
        },
        _renderDisplayText: function() {
            this._renderInputSize()
        },
        _cleanTags: function() {
            var $tags = this._tagElements(),
                values = this._getValue();
            $.each($tags, function(_, tag) {
                var $tag = $(tag),
                    index = $.inArray($tag.data(TAGBOX_TAG_DATA_KEY), values);
                if (index < 0) {
                    $tag.remove()
                }
            });
            this._cleanSelectedItems()
        },
        _cleanSelectedItems: function() {
            if (this.option("fieldTemplate")) {
                this._selectedItems = [];
                return
            }
            var values = this._getValue(),
                selectedItemsCount = this._selectedItems.length;
            for (var index = 0; index < selectedItemsCount; index++) {
                var selectedItem = this._selectedItems[index],
                    value = this._valueGetter(selectedItem);
                if ($.inArray(value, values) < 0) {
                    this._selectedItems.splice(index, 1);
                    index--;
                    selectedItemsCount--
                }
            }
        },
        _tagElements: function() {
            return this.element().find("." + TAGBOX_TAG_CLASS)
        },
        _getDefaultTagTemplate: function() {
            if (!this._defaultTagTemplate) {
                this._defaultTagTemplate = this.option("templateProvider").getTemplates(this).tag
            }
            return this._defaultTagTemplate
        },
        _renderTag: function(value, $input) {
            if (this._isTagRendered(value)) {
                return $.Deferred().resolve()
            }
            var $tag = $("<div>").addClass(TAGBOX_TAG_CLASS).data(TAGBOX_TAG_DATA_KEY, value).insertBefore($input);
            return this._loadItem(value).always($.proxy(function(item) {
                item = commonUtils.isDefined(item) ? item : value;
                this._selectedItems.push(item);
                if (this._displayGetterExpr() && this._tagTemplate === this._getDefaultTagTemplate()) {
                    item = this._displayGetter(item)
                }
                this._tagTemplate.render({
                    model: item,
                    container: $tag
                })
            }, this))
        },
        _isTagRendered: function(value) {
            var $tags = this._tagElements();
            var result = false;
            $.each($tags, function(_, tag) {
                var $tag = $(tag);
                if (value === $tag.data(TAGBOX_TAG_DATA_KEY)) {
                    result = true;
                    return false
                }
            });
            return result
        },
        _toggleEmptinessEventHandler: function() {
            this._toggleEmptiness(!this._getValue().length && !this._searchValue().length)
        },
        _customItemAddedHandler: function(e) {
            this.callBase(e);
            this._input().val("")
        },
        _removeTagHandler: function(args) {
            var e = args.jQueryEvent;
            e.stopPropagation();
            var $tag = $(e.target).closest("." + TAGBOX_TAG_CLASS);
            this._removeTagElement($tag)
        },
        _removeTagElement: function($tag) {
            var itemValue = $tag.data(TAGBOX_TAG_DATA_KEY);
            this._removeTagWithUpdate(itemValue)
        },
        _removeTagWithUpdate: function(itemValue) {
            var value = this._getValue().slice();
            this._removeTag(value, itemValue);
            this.option("value", value);
            if (0 === value.length) {
                this._clearTagFocus()
            }
        },
        _getCurrentValue: function() {
            return this._lastValue()
        },
        _selectionChangeHandler: function(e) {
            if ("useButtons" === this.option("applyValueMode")) {
                return
            }
            var value = this._getValue().slice();
            $.each(e.removedItems || [], $.proxy(function(_, removedItem) {
                this._removeTag(value, this._valueGetter(removedItem))
            }, this));
            $.each(e.addedItems || [], $.proxy(function(_, addedItem) {
                this._addTag(value, this._valueGetter(addedItem))
            }, this));
            this._updateWidgetHeight();
            this.option("value", value)
        },
        _removeTag: function(value, item) {
            var index = this._valueIndex(item, value);
            if (index >= 0) {
                value.splice(index, 1)
            }
        },
        _addTag: function(value, item) {
            var index = this._valueIndex(item);
            if (index < 0) {
                value.push(item)
            }
        },
        _fieldRenderData: function() {
            return this._selectedItems.slice()
        },
        _setValue: function(value) {
            if (null === value) {
                return
            }
            var valueIndex = this._valueIndex(value),
                values = this._getValue().slice();
            if (valueIndex >= 0) {
                values.splice(valueIndex, 1)
            } else {
                values.push(value)
            }
            this.option("value", values)
        },
        _isSelectedValue: function(value) {
            return this._valueIndex(value) > -1
        },
        _valueIndex: function(value, values) {
            values = values || this._getValue();
            var result = -1;
            $.each(values, $.proxy(function(index, selectedValue) {
                if (this._isValueEquals(value, selectedValue)) {
                    result = index;
                    return false
                }
            }, this));
            return result
        },
        _lastValue: function() {
            return this._getValue().slice(-1).pop() || null
        },
        _valueChangeEventHandler: $.noop,
        _shouldRenderSearchEvent: function() {
            return this.option("searchEnabled") || this.option("acceptCustomValue")
        },
        _searchHandler: function(e) {
            if (this.option("searchEnabled") && !!e && !this._isTagRemoved) {
                this.callBase(e)
            }
            this._updateWidgetHeight();
            delete this._isTagRemoved
        },
        _updateWidgetHeight: function() {
            var element = this.element(),
                originalHeight = element.height();
            this._renderInputSize();
            var currentHeight = element.height();
            if (this._popup && this.option("opened") && this._isEditable() && currentHeight !== originalHeight) {
                this._popup.repaint()
            }
        },
        _refreshSelected: function() {
            this._list && this._suppressingSelectionChanged(function() {
                this._setListOption("selectedItems", this._selectedItems.slice());
                this.callBase()
            })
        },
        _resetListDataSourceFilter: function() {
            var dataSource = this._getDataSource();
            if (!dataSource) {
                return
            }
            dataSource.filter(null);
            dataSource.reload()
        },
        _setListDataSourceFilter: function() {
            if (!this.option("hideSelectedItems") || !this._list) {
                return
            }
            var dataSource = this._getDataSource();
            if (!dataSource) {
                return
            }
            dataSource.filter($.proxy(this._dataSourceFilter, this));
            dataSource.reload()
        },
        _dataSourceFilter: function(itemData) {
            var itemValue = this._valueGetter(itemData),
                result = true;
            $.each(this._getValue(), $.proxy(function(index, value) {
                if (this._isValueEquals(value, itemValue)) {
                    result = false;
                    return false
                }
            }, this));
            return result
        },
        _applyButtonHandler: function() {
            this.option("value", this._getListValues());
            this._clearTextValue();
            this.callBase()
        },
        _getListValues: function() {
            if (!this._list) {
                return []
            }
            var that = this,
                selectedItems = this._list.option("selectedItems"),
                result = [];
            $.each(selectedItems, function(index, item) {
                result[index] = that._valueGetter(item)
            });
            return result
        },
        _renderOpenedState: function() {
            this.callBase();
            if (this.option(false)) {
                this._refreshSelected()
            }
        },
        _clean: function() {
            this.callBase();
            delete this._defaultTagTemplate;
            delete this._tagTemplate
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "onSelectAllValueChanged":
                    this._initSelectAllValueChangedAction();
                    break;
                case "hideSelectedItems":
                    if (args.value) {
                        this._setListDataSourceFilter()
                    } else {
                        this._resetListDataSourceFilter()
                    }
                    break;
                case "displayExpr":
                    this.callBase(args);
                    this._invalidate();
                    break;
                case "tagTemplate":
                    this._initTagTemplate();
                    this._invalidate();
                    break;
                case "selectAllText":
                    this._setListOption("selectAllText", this.option("selectAllText"));
                    break;
                case "value":
                    this.callBase(args);
                    this._setListDataSourceFilter();
                    break;
                case "selectedItem":
                    break;
                case "selectedItems":
                    var addedItems = arrayUtils.removeDuplicates(args.value, args.previousValue),
                        removedItems = arrayUtils.removeDuplicates(args.previousValue, args.value);
                    this._selectionChangedAction({
                        addedItems: addedItems,
                        removedItems: removedItems
                    });
                    break;
                case "multiline":
                    this.element().toggleClass(TAGBOX_SINGLE_LINE_CLASS, !args.value);
                    this._renderSingleLineScroll();
                    break;
                default:
                    this.callBase(args)
            }
        },
        reset: function() {
            this.option("value", []);
            this._clearFilter();
            this._clearSelectedItem()
        }
    });
    registerComponent("dxTagBox", TagBox);
    module.exports = TagBox
});
