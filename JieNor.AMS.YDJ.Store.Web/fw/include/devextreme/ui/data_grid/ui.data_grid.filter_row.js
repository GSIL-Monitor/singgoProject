/** 
 * DevExtreme (ui/data_grid/ui.data_grid.filter_row.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        commonUtils = require("../../core/utils/common"),
        gridCore = require("./ui.data_grid.core"),
        messageLocalization = require("../../localization/message"),
        Editor = require("../editor/editor"),
        Overlay = require("../overlay"),
        Menu = require("../menu");
    require("./ui.data_grid.editor_factory");
    var OPERATION_ICONS = {
        "=": "filter-operation-equals",
        "<>": "filter-operation-not-equals",
        "<": "filter-operation-less",
        "<=": "filter-operation-less-equal",
        ">": "filter-operation-greater",
        ">=": "filter-operation-greater-equal",
        "default": "filter-operation-default",
        notcontains: "filter-operation-not-contains",
        contains: "filter-operation-contains",
        startswith: "filter-operation-starts-with",
        endswith: "filter-operation-ends-with",
        between: "filter-operation-between"
    };
    var FILTERING_TIMEOUT = 700,
        CORRECT_FILTER_RANGE_OVERLAY_WIDTH = 1,
        DATAGRID_CLASS = "dx-datagrid",
        DATAGRID_FILTER_ROW_CLASS = "dx-datagrid-filter-row",
        DATAGRID_MENU_CLASS = "dx-menu",
        DATAGRID_EDITOR_WITH_MENU_CLASS = "dx-editor-with-menu",
        DATAGRID_EDITOR_CONTAINER_CLASS = "dx-editor-container",
        DATAGRID_EDITOR_CELL_CLASS = "dx-editor-cell",
        DATAGRID_FILTER_MENU = "dx-filter-menu",
        DATAGRID_APPLY_BUTTON_CLASS = "dx-apply-button",
        DATAGRID_HIGHLIGHT_OUTLINE_CLASS = "dx-highlight-outline",
        DATAGRID_FOCUSED_CLASS = "dx-focused",
        DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
        DATAGRID_FILTER_RANGE_OVERLAY_CLASS = "dx-datagrid-filter-range-overlay",
        DATAGRID_FILTER_RANGE_CONTENT_CLASS = "dx-filter-range-content",
        DATAGRID_FILTER_RANGE_START_CLASS = "dx-datagrid-filter-range-start",
        DATAGRID_FILTER_RANGE_END_CLASS = "dx-datagrid-filter-range-end";

    function isOnClickApplyFilterMode(that) {
        return "onClick" === that.option("filterRow.applyFilter")
    }
    var ColumnHeadersViewFilterRowExtender = function() {
        var getEditorInstance = function($editorContainer) {
            var $editor = $editorContainer && $editorContainer.children(),
                componentNames = $editor && $editor.data("dxComponents"),
                editor = componentNames && componentNames.length && $editor.data(componentNames[0]);
            if (editor instanceof Editor) {
                return editor
            }
        };
        var getRangeTextByFilterValue = function(that, column) {
            var result = "",
                rangeEnd = "",
                filterValue = getColumnFilterValue(that, column),
                formatOptions = gridCore.getFormatOptionsByColumn(column, "filterRow");
            if (commonUtils.isArray(filterValue)) {
                result = gridCore.formatValue(filterValue[0], formatOptions);
                rangeEnd = gridCore.formatValue(filterValue[1], formatOptions);
                if ("" !== rangeEnd) {
                    result += " - " + rangeEnd
                }
            } else {
                if (commonUtils.isDefined(filterValue)) {
                    result = gridCore.formatValue(filterValue, formatOptions)
                }
            }
            return result
        };
        var getColumnFilterValue = function(that, column) {
            if (column) {
                return isOnClickApplyFilterMode(that) && void 0 !== column.bufferedFilterValue ? column.bufferedFilterValue : column.filterValue
            }
        };
        var getColumnSelectedFilterOperation = function(that, column) {
            if (column) {
                return isOnClickApplyFilterMode(that) && void 0 !== column.bufferedSelectedFilterOperation ? column.bufferedSelectedFilterOperation : column.selectedFilterOperation
            }
        };
        var getFilterValue = function(that, columnIndex, $editorContainer) {
            var column = that._columnsController.columnOption(columnIndex),
                filterValue = getColumnFilterValue(that, column),
                isFilterRange = $editorContainer.closest("." + DATAGRID_FILTER_RANGE_OVERLAY_CLASS).length,
                isRangeStart = $editorContainer.hasClass(DATAGRID_FILTER_RANGE_START_CLASS);
            if (filterValue && commonUtils.isArray(filterValue) && "between" === getColumnSelectedFilterOperation(that, column)) {
                if (isRangeStart) {
                    return filterValue[0]
                } else {
                    return filterValue[1]
                }
            }
            return !isFilterRange ? filterValue : void 0
        };
        var normalizeFilterValue = function(that, filterValue, column, $editorContainer) {
            if ("between" === getColumnSelectedFilterOperation(that, column)) {
                var columnFilterValue = getColumnFilterValue(that, column);
                if ($editorContainer.hasClass(DATAGRID_FILTER_RANGE_START_CLASS)) {
                    return [filterValue, commonUtils.isArray(columnFilterValue) ? columnFilterValue[1] : void 0]
                } else {
                    return [commonUtils.isArray(columnFilterValue) ? columnFilterValue[0] : columnFilterValue, filterValue]
                }
            }
            return filterValue
        };
        var updateFilterValue = function(that, options) {
            var value = "" === options.value ? null : options.value,
                $editorContainer = options.container,
                column = that._columnsController.columnOption(options.column.index),
                filterValue = getFilterValue(that, column.index, $editorContainer);
            if (!commonUtils.isDefined(filterValue) && !commonUtils.isDefined(value)) {
                return
            }
            that._applyFilterViewController.setHighLight($editorContainer, filterValue !== value);
            that._columnsController.columnOption(column.index, isOnClickApplyFilterMode(that) ? "bufferedFilterValue" : "filterValue", normalizeFilterValue(that, value, column, $editorContainer), options.notFireEvent)
        };
        return {
            _updateEditorValue: function(column, $editorContainer) {
                var that = this,
                    editor = getEditorInstance($editorContainer);
                editor && editor.option("value", getFilterValue(that, column.index, $editorContainer))
            },
            _columnOptionChanged: function(e) {
                var overlayInstance, visibleIndex, column, $cell, $editorContainer, $editorRangeElements, $rangeContent, $menu, that = this,
                    optionNames = e.optionNames;
                if (gridCore.checkChanges(optionNames, ["filterValue", "bufferedFilterValue", "selectedFilterOperation", "bufferedSelectedFilterOperation"]) && void 0 !== e.columnIndex) {
                    visibleIndex = that._columnsController.getVisibleIndex(e.columnIndex);
                    column = that._columnsController.columnOption(e.columnIndex);
                    $cell = that.getCellElement(that.element().find("." + DATAGRID_FILTER_ROW_CLASS).index(), visibleIndex) || $();
                    $rangeContent = $cell.find("." + DATAGRID_FILTER_RANGE_CONTENT_CLASS);
                    $editorContainer = $cell.find("." + DATAGRID_EDITOR_CONTAINER_CLASS).first();
                    if (optionNames.filterValue || optionNames.bufferedFilterValue) {
                        that._updateEditorValue(column, $editorContainer);
                        overlayInstance = $cell.find("." + DATAGRID_FILTER_RANGE_OVERLAY_CLASS).data("dxOverlay");
                        if (overlayInstance) {
                            $editorRangeElements = overlayInstance.content().find("." + DATAGRID_EDITOR_CONTAINER_CLASS);
                            that._updateEditorValue(column, $editorRangeElements.first());
                            that._updateEditorValue(column, $editorRangeElements.last())
                        }
                        if (!overlayInstance || !overlayInstance.option("visible")) {
                            that._updateFilterRangeContent($cell, getRangeTextByFilterValue(that, column))
                        }
                    }
                    if (optionNames.selectedFilterOperation || optionNames.bufferedSelectedFilterOperation) {
                        if (visibleIndex >= 0 && column) {
                            $menu = $cell.find("." + DATAGRID_MENU_CLASS);
                            if ($menu.length) {
                                that._updateFilterOperationChooser($menu, column, $editorContainer);
                                if ("between" === getColumnSelectedFilterOperation(that, column)) {
                                    that._renderFilterRangeContent($cell, column)
                                } else {
                                    if ($editorContainer.find("." + DATAGRID_FILTER_RANGE_CONTENT_CLASS).length) {
                                        that._renderEditor($editorContainer, that._getEditorOptions($editorContainer, column));
                                        that._hideFilterRange()
                                    }
                                }
                            }
                        }
                    }
                    return
                }
                that.callBase(e)
            },
            _resizeCore: function() {
                this.callBase.apply(this, arguments);
                this._filterRangeOverlayInstance && this._filterRangeOverlayInstance.repaint()
            },
            isFilterRowVisible: function() {
                return this._isElementVisible(this.option("filterRow"))
            },
            isVisible: function() {
                return this.callBase() || this.isFilterRowVisible()
            },
            init: function() {
                this.callBase();
                this._applyFilterViewController = this.getController("applyFilter")
            },
            _initFilterRangeOverlay: function($cell, column) {
                var that = this,
                    sharedData = {},
                    $editorContainer = $cell.find(".dx-editor-container"),
                    $overlay = $("<div>").addClass(DATAGRID_FILTER_RANGE_OVERLAY_CLASS).appendTo($cell);
                return that._createComponent($overlay, Overlay, {
                    height: "auto",
                    shading: false,
                    showTitle: false,
                    focusStateEnabled: false,
                    closeOnTargetScroll: true,
                    closeOnOutsideClick: true,
                    animation: false,
                    position: {
                        my: "top",
                        at: "top",
                        of: $editorContainer.length && $editorContainer || $cell,
                        offset: "0 -1"
                    },
                    contentTemplate: function(contentElement) {
                        var editorOptions, $editor = $("<div>").addClass(DATAGRID_EDITOR_CONTAINER_CLASS + " " + DATAGRID_FILTER_RANGE_START_CLASS).appendTo(contentElement);
                        column = that._columnsController.columnOption(column.index);
                        editorOptions = that._getEditorOptions($editor, column);
                        editorOptions.sharedData = sharedData;
                        that._renderEditor($editor, editorOptions);
                        $editor.find("input").on("keydown", function(e) {
                            var $prevElement = $cell.find("[tabindex]").not(e.target).first();
                            if (9 === e.which && e.shiftKey) {
                                e.preventDefault();
                                that._hideFilterRange();
                                if (!$prevElement.length) {
                                    $prevElement = $cell.prev().find("[tabindex]").last()
                                }
                                $prevElement.focus()
                            }
                        });
                        $editor = $("<div>").addClass(DATAGRID_EDITOR_CONTAINER_CLASS + " " + DATAGRID_FILTER_RANGE_END_CLASS).appendTo(contentElement);
                        editorOptions = that._getEditorOptions($editor, column);
                        editorOptions.sharedData = sharedData;
                        that._renderEditor($editor, editorOptions);
                        $editor.find("input").on("keydown", function(e) {
                            if (9 === e.which && !e.shiftKey) {
                                e.preventDefault();
                                that._hideFilterRange();
                                $cell.next().find("[tabindex]").first().focus()
                            }
                        });
                        return contentElement.addClass(DATAGRID_CLASS)
                    },
                    onShown: function(e) {
                        var $editor = e.component.content().find("." + DATAGRID_EDITOR_CONTAINER_CLASS).first();
                        $editor.find("input").focus()
                    },
                    onHidden: function() {
                        column = that._columnsController.columnOption(column.index);
                        $cell.find("." + DATAGRID_MENU_CLASS).parent().addClass(DATAGRID_EDITOR_WITH_MENU_CLASS);
                        if ("between" === getColumnSelectedFilterOperation(that, column)) {
                            that._updateFilterRangeContent($cell, getRangeTextByFilterValue(that, column));
                            that.component.updateDimensions()
                        }
                    }
                })
            },
            _updateFilterRangeOverlay: function(options) {
                var overlayInstance = this._filterRangeOverlayInstance;
                overlayInstance && overlayInstance.option(options)
            },
            _showFilterRange: function($cell, column) {
                var that = this,
                    $overlay = $cell.children("." + DATAGRID_FILTER_RANGE_OVERLAY_CLASS),
                    overlayInstance = $overlay.length && $overlay.data("dxOverlay");
                if (!overlayInstance && column) {
                    overlayInstance = that._initFilterRangeOverlay($cell, column)
                }
                if (!overlayInstance.option("visible")) {
                    that._filterRangeOverlayInstance && that._filterRangeOverlayInstance.hide();
                    that._filterRangeOverlayInstance = overlayInstance;
                    that._updateFilterRangeOverlay({
                        width: $cell.outerWidth(true) + CORRECT_FILTER_RANGE_OVERLAY_WIDTH
                    });
                    that._filterRangeOverlayInstance && that._filterRangeOverlayInstance.show()
                }
            },
            _hideFilterRange: function() {
                var overlayInstance = this._filterRangeOverlayInstance;
                overlayInstance && overlayInstance.hide()
            },
            getFilterRangeOverlayInstance: function() {
                return this._filterRangeOverlayInstance
            },
            _createRow: function(row) {
                var $row = this.callBase(row);
                if ("filter" === row.rowType) {
                    $row.addClass(DATAGRID_FILTER_ROW_CLASS)
                }
                return $row
            },
            _getRows: function() {
                var result = this.callBase();
                if (this.isFilterRowVisible()) {
                    result.push({
                        rowType: "filter"
                    })
                }
                return result
            },
            _renderCellContent: function($cell, options) {
                var $container, $editorContainer, that = this,
                    column = options.column;
                if ("filter" === options.rowType) {
                    if (column.command) {
                        $cell.html("&nbsp;")
                    } else {
                        if (column.allowFiltering) {
                            that.setAria("label", messageLocalization.format("dxDataGrid-ariaColumn") + " " + column.caption + ", " + messageLocalization.format("dxDataGrid-ariaFilterCell"), $cell);
                            $cell.addClass(DATAGRID_EDITOR_CELL_CLASS);
                            $container = $("<div>").appendTo($cell);
                            $editorContainer = $("<div>").addClass(DATAGRID_EDITOR_CONTAINER_CLASS).appendTo($container);
                            if ("between" === getColumnSelectedFilterOperation(that, column)) {
                                that._renderFilterRangeContent($cell, column)
                            } else {
                                that._renderEditor($editorContainer, that._getEditorOptions($editorContainer, column))
                            }
                            if (column.alignment) {
                                $cell.find("input").first().css("text-align", column.alignment)
                            }
                            if (column.filterOperations && column.filterOperations.length) {
                                that._renderFilterOperationChooser($container, column, $editorContainer)
                            }
                        }
                    }
                }
                that.callBase($cell, options)
            },
            _getEditorOptions: function($editorContainer, column) {
                var that = this,
                    result = $.extend({}, column, {
                        value: getFilterValue(that, column.index, $editorContainer),
                        parentType: "filterRow",
                        showAllText: that.option("filterRow.showAllText"),
                        updateValueTimeout: "onClick" === that.option("filterRow.applyFilter") ? 0 : FILTERING_TIMEOUT,
                        width: null,
                        setValue: function(value, notFireEvent) {
                            updateFilterValue(that, {
                                column: column,
                                value: value,
                                container: $editorContainer,
                                notFireEvent: notFireEvent
                            })
                        }
                    });
                if ("between" === getColumnSelectedFilterOperation(that, column)) {
                    if ($editorContainer.hasClass(DATAGRID_FILTER_RANGE_START_CLASS)) {
                        result.placeholder = that.option("filterRow.betweenStartText")
                    } else {
                        result.placeholder = that.option("filterRow.betweenEndText")
                    }
                }
                return result
            },
            _renderEditor: function($editorContainer, options) {
                $editorContainer.empty();
                return this.getController("editorFactory").createEditor($("<div>").appendTo($editorContainer), options)
            },
            _renderFilterRangeContent: function($cell, column) {
                var that = this,
                    $editorContainer = $cell.find("." + DATAGRID_EDITOR_CONTAINER_CLASS).first();
                $editorContainer.empty();
                $("<div>").addClass(DATAGRID_FILTER_RANGE_CONTENT_CLASS).attr("tabindex", 0).on("focusin", function(e) {
                    that._showFilterRange($cell, column)
                }).appendTo($editorContainer);
                that._updateFilterRangeContent($cell, getRangeTextByFilterValue(that, column))
            },
            _updateFilterRangeContent: function($cell, value) {
                var $filterRangeContent = $cell.find("." + DATAGRID_FILTER_RANGE_CONTENT_CLASS);
                if ($filterRangeContent.length) {
                    if ("" === value) {
                        $filterRangeContent.html("&nbsp;")
                    } else {
                        $filterRangeContent.text(value)
                    }
                }
            },
            _updateFilterOperationChooser: function($menu, column, $editorContainer) {
                var isCellWasFocused, that = this;
                that._createComponent($menu, Menu, {
                    _templates: {},
                    activeStateEnabled: false,
                    selectionMode: "single",
                    cssClass: DATAGRID_CLASS + " " + DATAGRID_CELL_FOCUS_DISABLED_CLASS + " " + DATAGRID_FILTER_MENU,
                    showFirstSubmenuMode: "onHover",
                    hideSubmenuOnMouseLeave: true,
                    items: [{
                        disabled: column.filterOperations && column.filterOperations.length ? false : true,
                        icon: OPERATION_ICONS[getColumnSelectedFilterOperation(that, column) || "default"],
                        selectable: false,
                        items: that._getFilterOperationMenuItems(column)
                    }],
                    onItemClick: function(properties) {
                        var selectedFilterOperation = properties.itemData.name,
                            columnSelectedFilterOperation = getColumnSelectedFilterOperation(that, column),
                            notFocusEditor = false,
                            isOnClickMode = isOnClickApplyFilterMode(that),
                            options = {};
                        if (properties.itemData.items || selectedFilterOperation === columnSelectedFilterOperation) {
                            return
                        }
                        if (selectedFilterOperation) {
                            options[isOnClickMode ? "bufferedSelectedFilterOperation" : "selectedFilterOperation"] = selectedFilterOperation;
                            if ("between" === selectedFilterOperation || "between" === columnSelectedFilterOperation) {
                                notFocusEditor = "between" === selectedFilterOperation;
                                options[isOnClickMode ? "bufferedFilterValue" : "filterValue"] = null
                            }
                        } else {
                            options[isOnClickMode ? "bufferedSelectedFilterOperation" : "selectedFilterOperation"] = column.defaultSelectedFilterOperation || null;
                            options[isOnClickMode ? "bufferedFilterValue" : "filterValue"] = null
                        }
                        that._columnsController.columnOption(column.index, options);
                        that._applyFilterViewController.setHighLight($editorContainer, true);
                        if (!notFocusEditor) {
                            that._focusEditor($editorContainer)
                        } else {
                            that._showFilterRange($editorContainer.closest("." + DATAGRID_EDITOR_CELL_CLASS), column)
                        }
                    },
                    onSubmenuShown: function() {
                        isCellWasFocused = that._isEditorFocused($editorContainer);
                        that.getController("editorFactory").loseFocus()
                    },
                    onSubmenuHiding: function(e) {
                        $menu.blur();
                        Menu.getInstance($menu).option("focusedElement", null);
                        isCellWasFocused && that._focusEditor($editorContainer)
                    },
                    rtlEnabled: that.option("rtlEnabled")
                })
            },
            _isEditorFocused: function($container) {
                return $container.hasClass(DATAGRID_FOCUSED_CLASS) || $container.parents("." + DATAGRID_FOCUSED_CLASS).length
            },
            _focusEditor: function($container) {
                this.getController("editorFactory").focus($container);
                $container.find("input").focus()
            },
            _renderFilterOperationChooser: function($container, column, $editorContainer) {
                var $menu, that = this;
                if (that.option("filterRow.showOperationChooser")) {
                    $container.addClass(DATAGRID_EDITOR_WITH_MENU_CLASS);
                    $menu = $("<div>").prependTo($container);
                    that._updateFilterOperationChooser($menu, column, $editorContainer)
                }
            },
            _getFilterOperationMenuItems: function(column) {
                var that = this,
                    result = [{}],
                    filterRowOptions = that.option("filterRow"),
                    operationDescriptions = filterRowOptions && filterRowOptions.operationDescriptions || {};
                if (column.filterOperations && column.filterOperations.length) {
                    result = $.map(column.filterOperations, function(value) {
                        return {
                            name: value,
                            selected: (getColumnSelectedFilterOperation(that, column) || column.defaultFilterOperation) === value,
                            text: operationDescriptions[value],
                            icon: OPERATION_ICONS[value]
                        }
                    });
                    result.push({
                        name: null,
                        text: filterRowOptions && filterRowOptions.resetOperationText,
                        icon: OPERATION_ICONS.default
                    })
                }
                return result
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case "filterRow":
                    case "showColumnLines":
                        this._invalidate(true, true);
                        args.handled = true;
                        break;
                    default:
                        that.callBase(args)
                }
            }
        }
    }();
    var DataControllerFilterRowExtender = {
        _calculateAdditionalFilter: function() {
            var that = this,
                filters = [that.callBase()],
                columns = that._columnsController.getVisibleColumns();
            $.each(columns, function() {
                var filter;
                if (this.allowFiltering && this.calculateFilterExpression && commonUtils.isDefined(this.filterValue)) {
                    filter = this.createFilterExpression(this.filterValue, this.selectedFilterOperation || this.defaultFilterOperation, "filterRow");
                    filters.push(filter)
                }
            });
            return gridCore.combineFilters(filters)
        }
    };
    exports.ApplyFilterViewController = gridCore.ViewController.inherit({
        _getHeaderPanel: function() {
            if (!this._headerPanel) {
                this._headerPanel = this.getView("headerPanel")
            }
            return this._headerPanel
        },
        setHighLight: function($element, value) {
            if (isOnClickApplyFilterMode(this)) {
                $element && $element.toggleClass(DATAGRID_HIGHLIGHT_OUTLINE_CLASS, value);
                this._getHeaderPanel().enableApplyButton(value)
            }
        },
        applyFilter: function() {
            var columnsController = this.getController("columns"),
                columns = columnsController.getColumns();
            columnsController.beginUpdate();
            for (var i = 0; i < columns.length; i++) {
                if (void 0 !== columns[i].bufferedFilterValue) {
                    columnsController.columnOption(i, "filterValue", columns[i].bufferedFilterValue);
                    columns[i].bufferedFilterValue = void 0
                }
                if (void 0 !== columns[i].bufferedSelectedFilterOperation) {
                    columnsController.columnOption(i, "selectedFilterOperation", columns[i].bufferedSelectedFilterOperation);
                    columns[i].bufferedSelectedFilterOperation = void 0
                }
            }
            columnsController.endUpdate();
            this.removeHighLights()
        },
        removeHighLights: function() {
            if (isOnClickApplyFilterMode(this)) {
                var columnHeadersView = this.getView("columnHeadersView");
                columnHeadersView.element().find("." + DATAGRID_FILTER_ROW_CLASS + " ." + DATAGRID_HIGHLIGHT_OUTLINE_CLASS).removeClass(DATAGRID_HIGHLIGHT_OUTLINE_CLASS);
                this._getHeaderPanel().enableApplyButton(false)
            }
        }
    });
    gridCore.registerModule("filterRow", {
        defaultOptions: function() {
            return {
                filterRow: {
                    visible: false,
                    showOperationChooser: true,
                    showAllText: messageLocalization.format("dxDataGrid-filterRowShowAllText"),
                    resetOperationText: messageLocalization.format("dxDataGrid-filterRowResetOperationText"),
                    applyFilter: "auto",
                    applyFilterText: messageLocalization.format("dxDataGrid-applyFilterText"),
                    operationDescriptions: {
                        "=": messageLocalization.format("dxDataGrid-filterRowOperationEquals"),
                        "<>": messageLocalization.format("dxDataGrid-filterRowOperationNotEquals"),
                        "<": messageLocalization.format("dxDataGrid-filterRowOperationLess"),
                        "<=": messageLocalization.format("dxDataGrid-filterRowOperationLessOrEquals"),
                        ">": messageLocalization.format("dxDataGrid-filterRowOperationGreater"),
                        ">=": messageLocalization.format("dxDataGrid-filterRowOperationGreaterOrEquals"),
                        startswith: messageLocalization.format("dxDataGrid-filterRowOperationStartsWith"),
                        contains: messageLocalization.format("dxDataGrid-filterRowOperationContains"),
                        notcontains: messageLocalization.format("dxDataGrid-filterRowOperationNotContains"),
                        endswith: messageLocalization.format("dxDataGrid-filterRowOperationEndsWith"),
                        between: messageLocalization.format("dxDataGrid-filterRowOperationBetween")
                    },
                    betweenStartText: messageLocalization.format("dxDataGrid-filterRowOperationBetweenStartText"),
                    betweenEndText: messageLocalization.format("dxDataGrid-filterRowOperationBetweenEndText")
                }
            }
        },
        controllers: {
            applyFilter: exports.ApplyFilterViewController
        },
        extenders: {
            controllers: {
                data: DataControllerFilterRowExtender,
                columnsResizer: {
                    _startResizing: function() {
                        var cellIndex, overlayInstance, that = this;
                        that.callBase.apply(that, arguments);
                        if (that.isResizing()) {
                            overlayInstance = that._columnHeadersView.getFilterRangeOverlayInstance();
                            if (overlayInstance) {
                                cellIndex = overlayInstance.element().closest("td").index();
                                if (cellIndex === that._targetPoint.columnIndex || cellIndex === that._targetPoint.columnIndex + 1) {
                                    overlayInstance.content().hide()
                                }
                            }
                        }
                    },
                    _endResizing: function(args) {
                        var $cell, overlayInstance, that = this;
                        if (that.isResizing()) {
                            overlayInstance = that._columnHeadersView.getFilterRangeOverlayInstance();
                            if (overlayInstance) {
                                $cell = overlayInstance.element().closest("td");
                                that._columnHeadersView._updateFilterRangeOverlay({
                                    width: $cell.outerWidth(true) + CORRECT_FILTER_RANGE_OVERLAY_WIDTH
                                });
                                overlayInstance.content().show()
                            }
                        }
                        that.callBase.apply(that, arguments)
                    }
                }
            },
            views: {
                columnHeadersView: ColumnHeadersViewFilterRowExtender,
                headerPanel: {
                    _getToolbarItems: function() {
                        var items = this.callBase(),
                            filterItem = this._prepareFilterItem(items);
                        return filterItem.concat(items)
                    },
                    _prepareFilterItem: function(items) {
                        var that = this,
                            itemDisabledState = that.getToolbarItemOption("filterRow", "disabled"),
                            disabled = commonUtils.isDefined(itemDisabledState) ? itemDisabledState : true,
                            filterItem = [];
                        if (that._isShowApplyFilterButton()) {
                            var hintText = that.option("filterRow.applyFilterText"),
                                onInitialized = function(e) {
                                    e.element.addClass(that._getToolbarButtonClass(DATAGRID_APPLY_BUTTON_CLASS))
                                },
                                onClickHandler = function() {
                                    that._applyFilterViewController.applyFilter()
                                },
                                toolbarItem = {
                                    widget: "dxButton",
                                    options: {
                                        icon: "apply-filter",
                                        onClick: onClickHandler,
                                        hint: hintText,
                                        text: hintText,
                                        onInitialized: onInitialized
                                    },
                                    showText: "inMenu",
                                    name: "filterRow",
                                    disabled: disabled,
                                    location: "after",
                                    locateInMenu: "auto"
                                };
                            filterItem.push(toolbarItem)
                        }
                        return filterItem
                    },
                    _isShowApplyFilterButton: function() {
                        var filterRowOptions = this.option("filterRow");
                        return filterRowOptions && filterRowOptions.visible && "onClick" === filterRowOptions.applyFilter
                    },
                    init: function() {
                        this.callBase();
                        this._dataController = this.getController("data");
                        this._applyFilterViewController = this.getController("applyFilter")
                    },
                    enableApplyButton: function(value) {
                        this.updateToolbarItemOption("filterRow", "disabled", !value)
                    },
                    isVisible: function() {
                        return this.callBase() || this._isShowApplyFilterButton()
                    },
                    optionChanged: function(args) {
                        if ("filterRow" === args.name) {
                            this._invalidate();
                            this._invalidateToolbarItems();
                            args.handled = true
                        } else {
                            this.callBase(args)
                        }
                    }
                }
            }
        }
    });
    exports.ColumnHeadersViewFilterRowExtender = ColumnHeadersViewFilterRowExtender;
    exports.DataControllerFilterRowExtender = DataControllerFilterRowExtender
});
