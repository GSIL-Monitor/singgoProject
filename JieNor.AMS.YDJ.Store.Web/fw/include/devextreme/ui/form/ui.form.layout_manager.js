/** 
 * DevExtreme (ui/form/ui.form.layout_manager.js)
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
        Guid = require("../../core/guid"),
        registerComponent = require("../../core/component_registrator"),
        utils = require("../../core/utils/common"),
        isWrapped = require("../../core/utils/variable_wrapper").isWrapped,
        isWritableWrapped = require("../../core/utils/variable_wrapper").isWritableWrapped,
        windowUtils = require("../../core/utils/window"),
        stringUtils = require("../../core/utils/string"),
        clickEvent = require("../../events/click"),
        normalizeIndexes = require("../../core/utils/array").normalizeIndexes,
        errors = require("../widget/ui.errors"),
        messageLocalization = require("../../localization/message"),
        support = require("../../core/utils/support"),
        inflector = require("../../core/utils/inflector"),
        Widget = require("../widget/ui.widget"),
        Validator = require("../validator"),
        ResponsiveBox = require("../responsive_box");
    require("../text_box");
    require("../number_box");
    require("../check_box");
    require("../date_box");
    var FORM_EDITOR_BY_DEFAULT = "dxTextBox",
        FIELD_ITEM_CLASS = "dx-field-item",
        FIELD_EMPTY_ITEM_CLASS = "dx-field-empty-item",
        FIELD_ITEM_REQUIRED_CLASS = "dx-field-item-required",
        FIELD_ITEM_OPTIONAL_CLASS = "dx-field-item-optional",
        FIELD_ITEM_REQUIRED_MARK_CLASS = "dx-field-item-required-mark",
        FIELD_ITEM_OPTIONAL_MARK_CLASS = "dx-field-item-optional-mark",
        FIELD_ITEM_LABEL_CLASS = "dx-field-item-label",
        FIELD_ITEM_LABEL_ALIGN_CLASS = "dx-field-item-label-align",
        FIELD_ITEM_LABEL_CONTENT_CLASS = "dx-field-item-label-content",
        FIELD_ITEM_LABEL_TEXT_CLASS = "dx-field-item-label-text",
        FIELD_ITEM_LABEL_LOCATION_CLASS = "dx-field-item-label-location-",
        FIELD_ITEM_CONTENT_CLASS = "dx-field-item-content",
        FIELD_ITEM_CONTENT_LOCATION_CLASS = "dx-field-item-content-location-",
        FIELD_ITEM_CONTENT_WRAPPER_CLASS = "dx-field-item-content-wrapper",
        FIELD_ITEM_HELP_TEXT_CLASS = "dx-field-item-help-text",
        LABEL_HORIZONTAL_ALIGNMENT_CLASS = "dx-label-h-align",
        LABEL_VERTICAL_ALIGNMENT_CLASS = "dx-label-v-align",
        FORM_LAYOUT_MANAGER_CLASS = "dx-layout-manager",
        LAYOUT_MANAGER_FIRST_ROW_CLASS = "dx-first-row",
        LAYOUT_MANAGER_FIRST_COL_CLASS = "dx-first-col",
        LAYOUT_MANAGER_LAST_COL_CLASS = "dx-last-col",
        LAYOUT_MANAGER_ONE_COLUMN = "dx-layout-manager-one-col",
        FLEX_LAYOUT_CLASS = "dx-flex-layout",
        LAYOUT_STRATEGY_FLEX = "flex",
        LAYOUT_STRATEGY_FALLBACK = "fallback";
    var LayoutManager = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                layoutData: {},
                readOnly: false,
                colCount: 1,
                colCountByScreen: void 0,
                labelLocation: "left",
                onFieldDataChanged: null,
                onEditorEnterKey: null,
                customizeItem: null,
                alignItemLabels: true,
                minColWidth: 200,
                showRequiredMark: true,
                screenByWidth: null,
                showOptionalMark: false,
                requiredMark: "*",
                optionalMark: messageLocalization.format("dxForm-optionalMark"),
                requiredMessage: messageLocalization.getFormatter("dxForm-requiredMessage")
            })
        },
        _setOptionsByReference: function() {
            this.callBase();
            $.extend(this._optionsByReference, {
                layoutData: true
            })
        },
        _init: function() {
            this.callBase();
            this._syncDataWithItems();
            this._updateItems(this.option("layoutData"))
        },
        _syncDataWithItems: function() {
            var that = this,
                userItems = that.option("items");
            if (utils.isDefined(userItems)) {
                $.each(userItems, function(index, item) {
                    var value;
                    if (item.dataField && void 0 === that._getDataByField(item.dataField)) {
                        if (item.editorOptions) {
                            value = item.editorOptions.value
                        }
                        that._updateFieldValue(item.dataField, value)
                    }
                })
            }
        },
        _getDataByField: function(dataField) {
            return dataField ? this.option("layoutData." + dataField) : null
        },
        _updateFieldValue: function(dataField, value) {
            var layoutData = this.option("layoutData"),
                newValue = value;
            if (!isWrapped(layoutData[dataField]) && utils.isDefined(dataField)) {
                this.option("layoutData." + dataField, newValue)
            } else {
                if (isWritableWrapped(layoutData[dataField])) {
                    newValue = utils.isFunction(value) ? value() : value;
                    layoutData[dataField](newValue)
                }
            }
            this._triggerOnFieldDataChanged({
                dataField: dataField,
                value: newValue
            })
        },
        _triggerOnFieldDataChanged: function(args) {
            this._createActionByOption("onFieldDataChanged")(args)
        },
        _updateItems: function(layoutData) {
            var items, visibleItems, that = this,
                userItems = this.option("items"),
                customizeItem = that.option("customizeItem");
            items = utils.isDefined(userItems) ? userItems : this._generateItemsByData(layoutData);
            if (utils.isDefined(items)) {
                visibleItems = [];
                $.each(items, function(index, item) {
                    if (that._isAcceptableItem(item)) {
                        item = that._processItem(item);
                        customizeItem && customizeItem(item);
                        var isItemVisibleDefined = utils.isDefined(item.visible);
                        if (utils.isObject(item) && !isItemVisibleDefined || isItemVisibleDefined && item.visible) {
                            visibleItems.push(item)
                        }
                    }
                });
                this._items = visibleItems;
                this._sortItems()
            }
        },
        _generateItemsByData: function(layoutData) {
            var result = [];
            if (utils.isDefined(layoutData)) {
                $.each(layoutData, function(dataField, value) {
                    result.push({
                        dataField: dataField
                    })
                })
            }
            return result
        },
        _isAcceptableItem: function(item) {
            var itemField = item.dataField || item,
                itemData = this.option("layoutData." + itemField);
            return !(utils.isFunction(itemData) && !isWrapped(itemData))
        },
        _processItem: function(item) {
            if ("string" === typeof item) {
                item = {
                    dataField: item
                }
            }
            if ("object" === typeof item && !item.itemType) {
                item.itemType = "simple"
            }
            if (!utils.isDefined(item.editorType) && utils.isDefined(item.dataField)) {
                var value = this._getDataByField(item.dataField);
                item.editorType = utils.isDefined(value) ? this._getEditorTypeByDataType($.type(value)) : FORM_EDITOR_BY_DEFAULT
            }
            return item
        },
        _getEditorTypeByDataType: function(dataType) {
            switch (dataType) {
                case "number":
                    return "dxNumberBox";
                case "date":
                    return "dxDateBox";
                case "boolean":
                    return "dxCheckBox";
                default:
                    return "dxTextBox"
            }
        },
        _sortItems: function() {
            normalizeIndexes(this._items, "visibleIndex");
            this._sortIndexes()
        },
        _sortIndexes: function() {
            this._items.sort(function(itemA, itemB) {
                var result, indexA = itemA.visibleIndex,
                    indexB = itemB.visibleIndex;
                if (indexA > indexB) {
                    result = 1
                } else {
                    if (indexA < indexB) {
                        result = -1
                    } else {
                        result = 0
                    }
                }
                return result
            })
        },
        _render: function() {
            this._clearEditorInstances();
            this.element().addClass(FORM_LAYOUT_MANAGER_CLASS);
            this.callBase()
        },
        _clearEditorInstances: function() {
            this._editorInstancesByField = {}
        },
        _hasBrowserFlex: function() {
            return support.styleProp(LAYOUT_STRATEGY_FLEX) === LAYOUT_STRATEGY_FLEX
        },
        _renderContentImpl: function() {
            this.callBase();
            this._renderResponsiveBox()
        },
        _renderResponsiveBox: function() {
            var that = this;
            if (that._items && that._items.length) {
                var layoutItems, colCount = that._getColCount(),
                    $container = $("<div />").appendTo(that.element());
                that._prepareItemsWithMerging(colCount);
                layoutItems = that._generateLayoutItems();
                that._responsiveBox = new ResponsiveBox($container, that._getResponsiveBoxConfig(layoutItems, colCount))
            }
        },
        _getResponsiveBoxConfig: function(layoutItems, colCount) {
            var that = this,
                colCountByScreen = that.option("colCountByScreen"),
                xsColCount = colCountByScreen && colCountByScreen.xs;
            return {
                _layoutStrategy: that._hasBrowserFlex() ? LAYOUT_STRATEGY_FLEX : LAYOUT_STRATEGY_FALLBACK,
                onLayoutChanged: function() {
                    var onLayoutChanged = that.option("onLayoutChanged"),
                        isLayoutChanged = that.isLayoutChanged();
                    if (onLayoutChanged) {
                        that.element().toggleClass(LAYOUT_MANAGER_ONE_COLUMN, isLayoutChanged);
                        onLayoutChanged(isLayoutChanged)
                    }
                },
                onContentReady: function(e) {
                    if (that.option("onLayoutChanged")) {
                        that.element().toggleClass(LAYOUT_MANAGER_ONE_COLUMN, that.isLayoutChanged(e.component))
                    }
                    that._fireContentReadyAction()
                },
                itemTemplate: function(e, itemData, $itemElement) {
                    if (!e.location) {
                        return
                    }
                    var itemRenderedCountInPreviousRows = e.location.row * colCount,
                        item = that._items[e.location.col + itemRenderedCountInPreviousRows],
                        $fieldItem = $("<div/>").addClass(item.cssClass).appendTo($itemElement);
                    if (0 === e.location.row) {
                        $fieldItem.addClass(LAYOUT_MANAGER_FIRST_ROW_CLASS)
                    }
                    if (0 === e.location.col) {
                        $fieldItem.addClass(LAYOUT_MANAGER_FIRST_COL_CLASS)
                    }
                    if (e.location.col === colCount - 1 || e.location.col + e.location.colspan === colCount) {
                        $fieldItem.addClass(LAYOUT_MANAGER_LAST_COL_CLASS)
                    }
                    "empty" === item.itemType ? that._renderEmptyItem($fieldItem) : that._renderFieldItem(item, $fieldItem)
                },
                cols: that._generateRatio(colCount),
                rows: that._generateRatio(that._getRowsCount(), true),
                dataSource: layoutItems,
                screenByWidth: that.option("screenByWidth"),
                singleColumnScreen: xsColCount ? false : "xs"
            }
        },
        _getColCount: function() {
            var colCount = this.option("colCount"),
                colCountByScreen = this.option("colCountByScreen");
            if (colCountByScreen) {
                var currentColCount = colCountByScreen[windowUtils.getCurrentScreenFactor(this.option("screenByWidth"))];
                colCount = currentColCount || colCount
            }
            if ("auto" === colCount) {
                if (!!this._cashedColCount) {
                    return this._cashedColCount
                }
                var minColWidth = this.option("minColWidth"),
                    width = this.element().width(),
                    itemsCount = this._items.length,
                    maxColCount = Math.floor(width / minColWidth) || 1;
                this._cashedColCount = colCount = itemsCount < maxColCount ? itemsCount : maxColCount
            }
            return colCount < 1 ? 1 : colCount
        },
        _prepareItemsWithMerging: function(colCount) {
            var item, itemsMergedByCol, j, i, items = this._items.slice(0),
                result = [];
            for (i = 0; i < items.length; i++) {
                item = items[i];
                result.push(item);
                if (this.option("alignItemLabels") || item.alignItemLabels || item.colSpan) {
                    item.col = this._getColByIndex(result.length - 1, colCount)
                }
                if (item.colSpan > 1 && item.col + item.colSpan <= colCount) {
                    itemsMergedByCol = [];
                    for (j = 0; j < item.colSpan - 1; j++) {
                        itemsMergedByCol.push({
                            merged: true
                        })
                    }
                    result = result.concat(itemsMergedByCol)
                } else {
                    delete item.colSpan
                }
            }
            this._items = result
        },
        _getColByIndex: function(index, colCount) {
            return index % colCount
        },
        _generateLayoutItems: function() {
            var item, i, items = this._items,
                colCount = this._getColCount(),
                result = [];
            for (i = 0; i < items.length; i++) {
                item = items[i];
                if (!item.merged) {
                    var generatedItem = {
                        location: {
                            row: parseInt(i / colCount),
                            col: this._getColByIndex(i, colCount)
                        }
                    };
                    if (utils.isDefined(item.colSpan)) {
                        generatedItem.location.colspan = item.colSpan
                    }
                    if (utils.isDefined(item.rowSpan)) {
                        generatedItem.location.rowspan = item.rowSpan
                    }
                    result.push(generatedItem)
                }
            }
            return result
        },
        _renderEmptyItem: function($container) {
            return $container.addClass(FIELD_EMPTY_ITEM_CLASS).html("&nbsp;")
        },
        _renderFieldItem: function(item, $container) {
            var $label, that = this,
                name = that._getName(item),
                id = that.getItemID(name),
                isRequired = utils.isDefined(item.isRequired) ? item.isRequired : !!that._hasRequiredRuleInSet(item.validationRules),
                labelOptions = that._getLabelOptions(item, id, isRequired),
                $editor = $("<div/>"),
                helpID = item.helpText ? new Guid : null;
            $container.addClass(FIELD_ITEM_CLASS).addClass(isRequired ? FIELD_ITEM_REQUIRED_CLASS : FIELD_ITEM_OPTIONAL_CLASS).addClass(that.option("cssItemClass")).addClass(utils.isDefined(item.col) ? "dx-col-" + item.col : "");
            if (labelOptions.visible && labelOptions.text) {
                $label = that._renderLabel(labelOptions).appendTo($container)
            }
            if (item.helpText) {
                helpID = new Guid
            }
            if ("simple" === item.itemType) {
                if (that._isLabelNeedBaselineAlign(item) && "top" !== labelOptions.location) {
                    $container.addClass(FIELD_ITEM_LABEL_ALIGN_CLASS)
                }
                that._hasBrowserFlex() && $container.addClass(FLEX_LAYOUT_CLASS)
            }
            $editor.data("dx-form-item", item);
            that._appendEditorToField({
                $fieldItem: $container,
                $label: $label,
                $editor: $editor,
                labelOptions: labelOptions
            });
            that._renderEditor({
                $container: $editor,
                dataField: name,
                editorType: item.editorType,
                editorOptions: item.editorOptions,
                template: that._getTemplateByFieldItem(item),
                isRequired: isRequired,
                helpID: helpID,
                id: id,
                validationBoundary: that.option("validationBoundary")
            });
            var $validationTarget = $editor.children().first();
            if ($validationTarget && $validationTarget.data("dx-validation-target")) {
                that._renderValidator($validationTarget, item)
            }
            that._renderHelpText(item, $editor, helpID);
            that._attachClickHandler($label, $editor, item.editorType)
        },
        _hasRequiredRuleInSet: function(rules) {
            var hasRequiredRule;
            if (rules && rules.length) {
                $.each(rules, function(index, rule) {
                    if ("required" === rule.type) {
                        hasRequiredRule = true;
                        return false
                    }
                })
            }
            return hasRequiredRule
        },
        _getName: function(item) {
            return item.dataField || item.name
        },
        _isLabelNeedBaselineAlign: function(item) {
            var largeEditors = ["dxTextArea", "dxRadioGroup", "dxCalendar"];
            return !!item.helpText && !this._hasBrowserFlex() || $.inArray(item.editorType, largeEditors) !== -1
        },
        _getLabelOptions: function(item, id, isRequired) {
            var labelOptions = $.extend({
                showColon: this.option("showColonAfterLabel"),
                location: this.option("labelLocation"),
                id: id,
                visible: true,
                isRequired: isRequired
            }, item ? item.label : {});
            if (!labelOptions.text && item.dataField) {
                labelOptions.text = inflector.captionize(item.dataField)
            }
            if (labelOptions.text) {
                labelOptions.text += labelOptions.showColon ? ":" : ""
            }
            return labelOptions
        },
        _renderLabel: function(options) {
            if (utils.isDefined(options.text) && options.text.length > 0) {
                var labelClasses = FIELD_ITEM_LABEL_CLASS + " " + FIELD_ITEM_LABEL_LOCATION_CLASS + options.location,
                    $label = $("<label />").addClass(labelClasses).attr("for", options.id),
                    $labelContent = $("<span/>").addClass(FIELD_ITEM_LABEL_CONTENT_CLASS).appendTo($label);
                $("<span />").addClass(FIELD_ITEM_LABEL_TEXT_CLASS).text(options.text).appendTo($labelContent);
                if (options.alignment) {
                    $label.css("text-align", options.alignment)
                }
                $labelContent.append(this._renderLabelMark(options.isRequired));
                return $label
            }
        },
        _renderLabelMark: function(isRequired) {
            var $mark, requiredMarksConfig = this._getRequiredMarksConfig(),
                isRequiredMark = requiredMarksConfig.showRequiredMark && isRequired,
                isOptionalMark = requiredMarksConfig.showOptionalMark && !isRequired;
            if (isRequiredMark || isOptionalMark) {
                var markClass = isRequiredMark ? FIELD_ITEM_REQUIRED_MARK_CLASS : FIELD_ITEM_OPTIONAL_MARK_CLASS,
                    markText = isRequiredMark ? requiredMarksConfig.requiredMark : requiredMarksConfig.optionalMark;
                $mark = $("<span />").addClass(markClass).html("&nbsp" + markText)
            }
            return $mark
        },
        _getRequiredMarksConfig: function() {
            if (!this._cashedRequiredConfig) {
                this._cashedRequiredConfig = {
                    showRequiredMark: this.option("showRequiredMark"),
                    showOptionalMark: this.option("showOptionalMark"),
                    requiredMark: this.option("requiredMark"),
                    optionalMark: this.option("optionalMark")
                }
            }
            return this._cashedRequiredConfig
        },
        _renderEditor: function(options) {
            var editorOptions, dataValue = this._getDataByField(options.dataField),
                defaultEditorOptions = {
                    value: dataValue
                },
                isDeepExtend = true;
            if ("dxTagBox" === options.editorType) {
                defaultEditorOptions.value = defaultEditorOptions.value || []
            }
            editorOptions = $.extend(isDeepExtend, defaultEditorOptions, options.editorOptions, {
                attr: {
                    id: options.id
                },
                validationBoundary: options.validationBoundary
            });
            editorOptions.items = options.editorOptions && options.editorOptions.items || editorOptions.items;
            this._createEditor(options.$container, {
                editorType: options.editorType,
                dataField: options.dataField,
                template: options.template,
                name: options.name,
                helpID: options.helpID,
                isRequired: options.isRequired
            }, editorOptions)
        },
        _renderValidator: function($editor, item) {
            var fieldName = this._getFieldLabelName(item),
                validationRules = this._prepareValidationRules(item.validationRules, item.isRequired, item.itemType, fieldName);
            if (utils.isArray(validationRules)) {
                this._createComponent($editor, Validator, {
                    validationRules: validationRules,
                    validationGroup: this.option("form")
                })
            }
        },
        _getFieldLabelName: function(item) {
            var isItemHaveCustomLabel = item.label && item.label.text,
                itemName = isItemHaveCustomLabel ? null : this._getName(item);
            return isItemHaveCustomLabel ? item.label.text : itemName && inflector.captionize(itemName)
        },
        _prepareValidationRules: function(userValidationRules, isItemRequired, itemType, itemName) {
            var validationRules, isSimpleItem = "simple" === itemType;
            if (isSimpleItem) {
                if (userValidationRules) {
                    validationRules = userValidationRules
                } else {
                    var requiredMessage = stringUtils.format(this.option("requiredMessage"), itemName || "");
                    validationRules = isItemRequired ? [{
                        type: "required",
                        message: requiredMessage
                    }] : null
                }
            }
            return validationRules
        },
        _createEditor: function($container, renderOptions, editorOptions) {
            var editorInstance, that = this,
                template = renderOptions.template;
            that._addItemContentClasses($container);
            if (template) {
                var data = {
                    dataField: renderOptions.dataField,
                    editorType: renderOptions.editorType,
                    editorOptions: editorOptions,
                    component: template.owner()
                };
                template.render({
                    model: data,
                    container: $container
                })
            } else {
                var $editor = $("<div/>").appendTo($container);
                try {
                    editorInstance = that._createComponent($editor, renderOptions.editorType, editorOptions);
                    editorInstance.setAria("describedby", renderOptions.helpID);
                    editorInstance.setAria("required", renderOptions.isRequired);
                    if (renderOptions.dataField) {
                        var componentOwner = that.option("form") || that;
                        editorInstance.on("enterKey", function(args) {
                            componentOwner._createActionByOption("onEditorEnterKey")($.extend(args, {
                                dataField: renderOptions.dataField
                            }))
                        });
                        that._registerEditorInstance(editorInstance, renderOptions.dataField);
                        that._createWatcher(editorInstance, $container, renderOptions);
                        that.linkEditorToDataField(editorInstance, renderOptions.dataField, renderOptions.editorType)
                    }
                } catch (e) {
                    errors.log("E1035", e.message)
                }
            }
        },
        _createWatcher: function(editorInstance, $container, renderOptions) {
            var that = this,
                watch = that._getWatch();
            $.isFunction(watch) && watch(function() {
                return that._getDataByField(renderOptions.dataField)
            }, function() {
                editorInstance.option("value", that._getDataByField(renderOptions.dataField))
            }, {
                disposeWithElement: $container.get(0),
                skipImmediate: true
            })
        },
        _getWatch: function() {
            if (!utils.isDefined(this._watch)) {
                var formInstance = this.option("form");
                this._watch = formInstance && formInstance.option("watchMethod")
            }
            return this._watch
        },
        _addItemContentClasses: function($itemContent) {
            var locationSpecificClass = this._getItemContentLocationSpecificClass();
            $itemContent.addClass([FIELD_ITEM_CONTENT_CLASS, locationSpecificClass].join(" "))
        },
        _getItemContentLocationSpecificClass: function() {
            var labelLocation = this.option("labelLocation"),
                oppositeClasses = {
                    right: "left",
                    left: "right",
                    top: "bottom"
                };
            return FIELD_ITEM_CONTENT_LOCATION_CLASS + oppositeClasses[labelLocation]
        },
        _registerEditorInstance: function(instance, dataField) {
            this._editorInstancesByField[dataField] = instance
        },
        _createComponent: function($editor, type, editorOptions) {
            var instance, that = this,
                readOnlyState = this.option("readOnly");
            instance = that.callBase($editor, type, editorOptions);
            readOnlyState && instance.option("readOnly", readOnlyState);
            that.on("optionChanged", function(args) {
                if ("readOnly" === args.name) {
                    instance.option(args.name, args.value)
                }
            });
            return instance
        },
        _getTemplateByFieldItem: function(fieldItem) {
            return fieldItem.template ? this._getTemplate(fieldItem.template) : null
        },
        _appendEditorToField: function(params) {
            if (params.$label) {
                var location = params.labelOptions.location;
                if ("top" === location || "left" === location) {
                    params.$fieldItem.append(params.$editor)
                }
                if ("right" === location) {
                    params.$fieldItem.prepend(params.$editor)
                }
                this._addInnerItemAlignmentClass(params.$fieldItem, location)
            } else {
                params.$fieldItem.append(params.$editor)
            }
        },
        _addInnerItemAlignmentClass: function($fieldItem, location) {
            if ("top" === location) {
                $fieldItem.addClass(LABEL_VERTICAL_ALIGNMENT_CLASS)
            } else {
                $fieldItem.addClass(LABEL_HORIZONTAL_ALIGNMENT_CLASS)
            }
        },
        _renderHelpText: function(fieldItem, $editor, helpID) {
            var helpText = fieldItem.helpText;
            if (helpText) {
                var $editorWrapper = $("<div>").addClass(FIELD_ITEM_CONTENT_WRAPPER_CLASS);
                $editor.wrap($editorWrapper);
                $("<div>").addClass(FIELD_ITEM_HELP_TEXT_CLASS).attr("id", helpID).text(helpText).appendTo($editor.parent())
            }
        },
        _attachClickHandler: function($label, $editor, editorType) {
            var isBooleanEditors = "dxCheckBox" === editorType || "dxSwitch" === editorType;
            if ($label && isBooleanEditors) {
                $label.on(clickEvent.name, function() {
                    $editor.children().trigger(clickEvent.name)
                })
            }
        },
        _generateRatio: function(count, isAutoSize) {
            var ratio, i, result = [];
            for (i = 0; i < count; i++) {
                ratio = {
                    ratio: 1
                };
                if (isAutoSize) {
                    ratio.baseSize = "auto"
                }
                result.push(ratio)
            }
            return result
        },
        _getRowsCount: function() {
            return Math.ceil(this._items.length / this._getColCount())
        },
        _optionChanged: function(args) {
            if (0 === args.fullName.search("layoutData.")) {
                return
            }
            switch (args.name) {
                case "showRequiredMark":
                case "showOptionalMark":
                case "requiredMark":
                case "optionalMark":
                    this._cashedRequiredConfig = null;
                    this._invalidate();
                    break;
                case "layoutData":
                case "items":
                    this._syncDataWithItems();
                    this._updateItems(args.value);
                    this._invalidate();
                    break;
                case "alignItemLabels":
                case "labelLocation":
                case "requiredMessage":
                    this._invalidate();
                    break;
                case "customizeItem":
                    this._updateItems(this.option("layoutData"));
                    this._invalidate();
                    break;
                case "colCount":
                    this._resetColCount();
                    break;
                case "minColWidth":
                    if ("auto" === this.option("colCount")) {
                        this._resetColCount()
                    }
                    break;
                case "readOnly":
                    break;
                case "width":
                    this.callBase(args);
                    if ("auto" === this.option("colCount")) {
                        this._resetColCount()
                    }
                    break;
                case "onFieldDataChanged":
                    break;
                default:
                    this.callBase(args)
            }
        },
        _resetColCount: function() {
            this._cashedColCount = null;
            this._invalidate()
        },
        linkEditorToDataField: function(editorInstance, dataField, editorType) {
            var fullFieldName = "layoutData." + dataField,
                that = this;
            that.on("optionChanged", function(args) {
                if (args.fullName === fullFieldName) {
                    if ("object" === typeof args.value) {
                        that._managedUpdateEditorOption(editorInstance, "value", args.value)
                    } else {
                        editorInstance.option("value", args.value)
                    }
                }
            });
            editorInstance.on("valueChanged", function(args) {
                if ("object" === typeof args.value) {
                    that._managedUpdateFieldValue(dataField, args.value)
                } else {
                    that._updateFieldValue(dataField, args.value)
                }
            })
        },
        _managedUpdateEditorOption: function(editorInstance, optionName, value) {
            if (!this._isValueChangedCalled) {
                this._isFieldValueChanged = true;
                editorInstance.option(optionName, value);
                this._isFieldValueChanged = false
            }
        },
        _managedUpdateFieldValue: function(dataField, value) {
            this._isValueChangedCalled = true;
            if (!this._isFieldValueChanged) {
                this._updateFieldValue(dataField, value)
            }
            this._isValueChangedCalled = false
        },
        getItemID: function(name) {
            var formInstance = this.option("form"),
                formID = formInstance && formInstance.option("formID");
            return "dx_" + formID + "_" + (name || new Guid)
        },
        updateData: function(data, value) {
            var that = this;
            if (utils.isObject(data)) {
                $.each(data, function(dataField, fieldValue) {
                    that._updateFieldValue(dataField, fieldValue)
                })
            } else {
                if ("string" === typeof data) {
                    that._updateFieldValue(data, value)
                }
            }
        },
        getEditor: function(field) {
            return this._editorInstancesByField[field]
        },
        isLayoutChanged: function(component) {
            var responsiveBox = this._responsiveBox || component;
            if (responsiveBox) {
                return responsiveBox.option("currentScreenFactor") === responsiveBox.option("singleColumnScreen")
            }
        }
    });
    registerComponent("dxLayoutManager", LayoutManager);
    module.exports = LayoutManager
});
