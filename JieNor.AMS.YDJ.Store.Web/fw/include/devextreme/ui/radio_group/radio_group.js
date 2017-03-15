/** 
 * DevExtreme (ui/radio_group/radio_group.js)
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
        devices = require("../../core/devices"),
        registerComponent = require("../../core/component_registrator"),
        Editor = require("../editor/editor"),
        inkRipple = require("../widget/utils.ink_ripple"),
        DataExpressionMixin = require("../editor/ui.data_expression"),
        themes = require("../themes"),
        CollectionWidget = require("../collection/ui.collection_widget.edit");
    var RADIO_GROUP_CLASS = "dx-radiogroup",
        RADIO_GROUP_VERTICAL_CLASS = "dx-radiogroup-vertical",
        RADIO_GROUP_HORIZONTAL_CLASS = "dx-radiogroup-horizontal",
        RADIO_BUTTON_CLASS = "dx-radiobutton",
        RADIO_BUTTON_ICON_CLASS = "dx-radiobutton-icon",
        RADIO_BUTTON_ICON_DOT_CLASS = "dx-radiobutton-icon-dot",
        RADIO_VALUE_CONTAINER_CLASS = "dx-radio-value-container",
        RADIO_BUTTON_CHECKED_CLASS = "dx-radiobutton-checked",
        ITEM_DATA_KEY = "dxItemData",
        RADIO_FEEDBACK_HIDE_TIMEOUT = 100;
    var RadioCollection = CollectionWidget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), DataExpressionMixin._dataExpressionDefaultOptions(), {
                _itemAttributes: {
                    role: "radio"
                }
            })
        },
        _supportedKeys: function(e) {
            var parent = this.callBase();
            return $.extend({}, parent, {
                enter: function(e) {
                    e.preventDefault();
                    return parent.enter.apply(this, arguments)
                },
                space: function(e) {
                    e.preventDefault();
                    return parent.space.apply(this, arguments)
                }
            })
        },
        _focusTarget: function() {
            return this.element().parent()
        },
        _keyboardEventBindingTarget: function() {
            return this._focusTarget()
        }
    });
    RadioCollection.publicName("dxRadioCollection");
    var RadioGroup = Editor.inherit({
        _activeStateUnit: "." + RADIO_BUTTON_CLASS,
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), $.extend(DataExpressionMixin._dataExpressionDefaultOptions(), {
                hoverStateEnabled: true,
                activeStateEnabled: true,
                layout: "vertical",
                useInkRipple: false
            }))
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    tablet: true
                },
                options: {
                    layout: "horizontal"
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
        _setOptionsByReference: function() {
            this.callBase();
            $.extend(this._optionsByReference, {
                value: true
            })
        },
        _dataSourceOptions: function() {
            return {
                paginate: false
            }
        },
        _init: function() {
            this.callBase();
            this._initDataExpressions();
            this._feedbackHideTimeout = RADIO_FEEDBACK_HIDE_TIMEOUT
        },
        _render: function() {
            this.element().addClass(RADIO_GROUP_CLASS);
            this._renderRadios();
            this.setAria("role", "radiogroup");
            this.callBase();
            this._renderLayout();
            this._updateItemsSize();
            this.option("useInkRipple") && this._renderInkRipple()
        },
        _renderInkRipple: function() {
            this._inkRipple = inkRipple.render({
                waveSizeCoefficient: 3.3,
                useHoldAnimation: false,
                isCentered: true
            })
        },
        _toggleActiveState: function($element, value, e) {
            this.callBase.apply(this, arguments);
            if (!this._inkRipple) {
                return
            }
            if (value) {
                this._inkRipple.showWave({
                    element: $element.find("." + RADIO_BUTTON_ICON_CLASS),
                    jQueryEvent: e
                })
            } else {
                this._inkRipple.hideWave({
                    element: $element.find("." + RADIO_BUTTON_ICON_CLASS),
                    jQueryEvent: e
                })
            }
        },
        _renderFocusState: $.noop,
        _renderRadios: function() {
            var $radios = $("<div>").appendTo(this.element());
            this._radios = this._createComponent($radios, RadioCollection, {
                dataSource: this._dataSource,
                onItemRendered: $.proxy(this._itemRenderedHandler, this),
                onItemClick: $.proxy(this._itemClickHandler, this),
                itemTemplate: this._getTemplateByOption("itemTemplate"),
                scrollingEnabled: false,
                focusStateEnabled: this.option("focusStateEnabled"),
                accessKey: this.option("accessKey"),
                tabIndex: this.option("tabIndex"),
                noDataText: ""
            });
            this._setCollectionWidgetOption("onContentReady", $.proxy(this._contentReadyHandler, this));
            this._contentReadyHandler()
        },
        _contentReadyHandler: function() {
            this.itemElements().addClass(RADIO_BUTTON_CLASS);
            this._refreshSelected()
        },
        _itemRenderedHandler: function(e) {
            if (e.itemData.html) {
                return
            }
            var $radio, $radioContainer;
            $radio = $("<div>").addClass(RADIO_BUTTON_ICON_CLASS);
            $("<div>").addClass(RADIO_BUTTON_ICON_DOT_CLASS).appendTo($radio);
            $radioContainer = $("<div>").append($radio).addClass(RADIO_VALUE_CONTAINER_CLASS);
            e.itemElement.prepend($radioContainer)
        },
        _itemClickHandler: function(e) {
            this._saveValueChangeEvent(e.jQueryEvent);
            this.option("value", this._getItemValue(e.itemData))
        },
        _getItemValue: function(item) {
            return !!this._valueGetter ? this._valueGetter(item) : item.text
        },
        itemElements: function() {
            return this._radios.itemElements()
        },
        _renderDimensions: function() {
            this.callBase();
            this._updateItemsSize()
        },
        _renderLayout: function() {
            var layout = this.option("layout");
            this.element().toggleClass(RADIO_GROUP_VERTICAL_CLASS, "vertical" === layout);
            this.element().toggleClass(RADIO_GROUP_HORIZONTAL_CLASS, "horizontal" === layout)
        },
        _refreshSelected: function() {
            var selectedValue = this.option("value");
            this.itemElements().each($.proxy(function(_, item) {
                var $item = $(item);
                var itemValue = this._valueGetter($item.data(ITEM_DATA_KEY));
                $item.toggleClass(RADIO_BUTTON_CHECKED_CLASS, this._isValueEquals(itemValue, selectedValue));
                this.setAria("checked", this._isValueEquals(itemValue, selectedValue), $item)
            }, this))
        },
        _updateItemsSize: function() {
            if ("horizontal" === this.option("layout")) {
                this.itemElements().css("height", "auto")
            } else {
                var itemsCount = this.option("items").length;
                this.itemElements().css("height", 100 / itemsCount + "%")
            }
        },
        _getAriaTarget: function() {
            return this.element()
        },
        _setCollectionWidgetOption: function() {
            this._setWidgetOption("_radios", arguments)
        },
        focus: function() {
            this._radios && this._radios.focus()
        },
        _optionChanged: function(args) {
            this._dataExpressionOptionChanged(args);
            switch (args.name) {
                case "useInkRipple":
                    this._invalidate();
                    break;
                case "focusStateEnabled":
                case "accessKey":
                case "tabIndex":
                    this._setCollectionWidgetOption(args.name, args.value);
                    break;
                case "disabled":
                    this.callBase(args);
                    this._setCollectionWidgetOption(args.name, args.value);
                    break;
                case "dataSource":
                    this._setCollectionWidgetOption("dataSource");
                    break;
                case "valueExpr":
                    this._refreshSelected();
                    break;
                case "value":
                    this._refreshSelected();
                    this.callBase(args);
                    break;
                case "items":
                case "itemTemplate":
                case "displayExpr":
                    break;
                case "layout":
                    this._renderLayout();
                    this._updateItemsSize();
                    break;
                default:
                    this.callBase(args)
            }
        }
    }).include(DataExpressionMixin);
    registerComponent("dxRadioGroup", RadioGroup);
    module.exports = RadioGroup
});
