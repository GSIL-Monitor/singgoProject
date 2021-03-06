/** 
 * DevExtreme (ui/data_grid/ui.data_grid.export_controller.js)
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
        Class = require("../../core/class"),
        commonUtils = require("../../core/utils/common"),
        dataGridCore = require("./ui.data_grid.core"),
        gridCoreUtils = require("../grid_core/ui.grid_core.utils"),
        clientExporter = require("../../client_exporter"),
        messageLocalization = require("../../localization/message"),
        excelExporter = clientExporter.excel,
        Button = require("../button"),
        List = require("../list"),
        ContextMenu = require("../context_menu");
    var DATAGRID_EXPORT_MENU_CLASS = "dx-datagrid-export-menu",
        DATAGRID_EXPORT_BUTTON_CLASS = "dx-datagrid-export-button",
        DATAGRID_EXPORT_ICON = "export-to",
        DATAGRID_EXPORT_EXCEL_ICON = "exportxlsx",
        DATAGRID_EXPORT_SELECTED_ICON = "exportselected",
        DATAGRID_EXPORT_EXCEL_BUTTON_ICON = "export-excel-button";
    exports.DataProvider = Class.inherit({
        _getGroupValue: function(item) {
            var visibleIndex, groupColumn = this._options.groupColumns[item.groupIndex],
                value = dataGridCore.getDisplayValue(groupColumn, item.values[item.groupIndex], item.data, item.rowType),
                result = groupColumn.caption + ": " + dataGridCore.formatValue(value, groupColumn);
            visibleIndex = this._options.getVisibleIndex(groupColumn.index);
            if (item.summaryCells && item.summaryCells.length && item.summaryCells[visibleIndex].length) {
                result += " " + dataGridCore.getGroupRowSummaryText(item.summaryCells[visibleIndex], this._options.summaryTexts)
            }
            return result
        },
        _correctCellIndex: function(cellIndex) {
            var startIndex = this._options.startValueIndex,
                endIndex = this._options.endValueIndex;
            return cellIndex <= endIndex ? startIndex + cellIndex : null
        },
        _initOptions: function() {
            var exportController = this._exportController,
                groupColumns = exportController._columnsController.getGroupColumns(),
                startEndIndexes = exportController._getStartEndValueIndexces(exportController._columnsController.getVisibleColumns());
            this._options = {
                columns: exportController._getColumns(),
                groupColumns: groupColumns,
                items: !!exportController._selectionOnly ? exportController._getSelectedItems() : exportController._getAllItems(),
                getVisibleIndex: $.proxy(exportController._columnsController.getVisibleIndex, exportController._columnsController),
                startValueIndex: startEndIndexes.startIndex,
                endValueIndex: startEndIndexes.endIndex,
                isHeadersVisible: exportController.option("showColumnHeaders"),
                summaryTexts: exportController.option("summary.texts"),
                customizeExportData: exportController.option("customizeExportData")
            }
        },
        ctor: function(exportController) {
            this._exportController = exportController
        },
        getColumns: function(getColumnsByAllRows) {
            var columns = this._options.columns;
            return getColumnsByAllRows ? columns : columns[columns.length - 1]
        },
        getRowsCount: function() {
            return this._options.items.length
        },
        getHeaderRowCount: function() {
            if (this.isHeadersVisible()) {
                return this._options.columns.length - 1
            }
            return 0
        },
        isGroupRow: function(rowIndex) {
            return rowIndex < this._options.items.length && "group" === this._options.items[rowIndex].rowType
        },
        getGroupLevel: function(rowIndex) {
            var item = this._options.items[rowIndex],
                groupIndex = item && item.groupIndex;
            if (item && "totalFooter" === item.rowType) {
                return 0
            }
            return commonUtils.isDefined(groupIndex) ? groupIndex : this._options.groupColumns.length
        },
        getCellType: function(rowIndex, cellIndex) {
            var columns = this.getColumns();
            if (cellIndex < columns.length) {
                var item = this._options.items.length && this._options.items[rowIndex],
                    column = columns[cellIndex];
                if (item && "data" === item.rowType) {
                    if (isFinite(item.values[this._correctCellIndex(cellIndex)]) && !commonUtils.isDefined(column.customizeText)) {
                        return commonUtils.isDefined(column.lookup) ? column.lookup.dataType : column.dataType
                    }
                }
                return "string"
            }
        },
        ready: function() {
            var options, that = this;
            that._initOptions();
            options = this._options;
            return $.when(options.items).done(function(items) {
                options.customizeExportData && options.customizeExportData(that.getColumns(that.getHeaderRowCount() > 1), items);
                options.items = items
            })
        },
        getCellValue: function(rowIndex, cellIndex) {
            var column, value, i, summaryItems, itemValues, columns = this.getColumns(),
                correctedCellIndex = this._correctCellIndex(cellIndex),
                item = this._options.items.length && this._options.items[rowIndex];
            if (item) {
                itemValues = item.values;
                switch (item.rowType) {
                    case "groupFooter":
                    case "totalFooter":
                        if (correctedCellIndex < itemValues.length) {
                            value = itemValues[correctedCellIndex];
                            if (commonUtils.isDefined(value)) {
                                return dataGridCore.getSummaryText(value, this._options.summaryTexts)
                            }
                        }
                        break;
                    case "group":
                        if (cellIndex < 1) {
                            return this._getGroupValue(item)
                        } else {
                            summaryItems = item.values[correctedCellIndex];
                            if (commonUtils.isArray(summaryItems)) {
                                value = "";
                                for (i = 0; i < summaryItems.length; i++) {
                                    value += (i > 0 ? " \n " : "") + dataGridCore.getSummaryText(summaryItems[i], this._options.summaryTexts)
                                }
                                return value
                            }
                        }
                        break;
                    default:
                        column = columns[cellIndex];
                        if (column) {
                            value = dataGridCore.getDisplayValue(column, itemValues[correctedCellIndex], item.data, item.rowType);
                            return !isFinite(value) || column.customizeText ? dataGridCore.formatValue(value, column) : value
                        }
                }
            }
        },
        isHeadersVisible: function() {
            return this._options.isHeadersVisible
        },
        isTotalCell: function(rowIndex, cellIndex) {
            var items = this._options.items,
                item = items[rowIndex],
                correctCellIndex = this._correctCellIndex(cellIndex),
                isSummaryAlignByColumn = item.summaryCells && item.summaryCells[correctCellIndex] && item.summaryCells[correctCellIndex].length > 0 && item.summaryCells[correctCellIndex][0].alignByColumn;
            return item && "groupFooter" === item.rowType || "totalFooter" === item.rowType || isSummaryAlignByColumn
        },
        getCellMerging: function(rowIndex, cellIndex) {
            var columns = this._options.columns,
                column = columns[rowIndex] && columns[rowIndex][cellIndex];
            return column ? {
                colspan: (column.colspan || 1) - 1,
                rowspan: (column.rowspan || 1) - 1
            } : {
                colspan: 0,
                rowspan: 0
            }
        },
        getFrozenArea: function() {
            var that = this;
            return {
                x: 0,
                y: that.getHeaderRowCount()
            }
        }
    });
    exports.ExportController = dataGridCore.ViewController.inherit({}).include(gridCoreUtils.exportMixin).inherit({
        _getEmptyCell: function() {
            return {
                caption: "",
                colspan: 1,
                rowspan: 1
            }
        },
        _updateColumnWidth: function(column, width) {
            column.width = width
        },
        _getColumns: function() {
            var i, j, column, columns, result = [],
                columnsController = this._columnsController,
                rowCount = columnsController.getRowCount(),
                columnWidths = this._headersView && this._headersView.isVisible() ? this._headersView.getColumnWidths() : this._rowsView.getColumnWidths();
            for (i = 0; i <= rowCount; i++) {
                result.push([]);
                columns = columnsController.getVisibleColumns(i);
                for (j = 0; j < columns.length; j++) {
                    column = $.extend({}, columns[j]);
                    if (!column.command) {
                        if (i === rowCount && columnWidths && columnWidths.length) {
                            this._updateColumnWidth(column, columnWidths[j])
                        }
                        result[i].push(column)
                    }
                }
            }
            columns = result[rowCount];
            result = this._prepareItems(0, result.slice(0, -1));
            result.push(columns);
            return result
        },
        _getFooterSummaryItems: function(summaryCells, isTotal) {
            var values, itemslength, summaryCell, j, result = [],
                estimatedItemsCount = 1,
                i = 0;
            do {
                values = [];
                for (j = 0; j < summaryCells.length; j++) {
                    summaryCell = summaryCells[j];
                    itemslength = summaryCell.length;
                    if (estimatedItemsCount < itemslength) {
                        estimatedItemsCount = itemslength
                    }
                    values.push(summaryCell[i])
                }
                result.push({
                    values: values,
                    rowType: isTotal ? "totalFooter" : "groupFooter"
                })
            } while (i++ < estimatedItemsCount - 1);
            return result
        },
        _hasSummaryGroupFooters: function() {
            var i, groupItems = this.option("summary.groupItems");
            if (commonUtils.isDefined(groupItems)) {
                for (i = 0; i < groupItems.length; i++) {
                    if (groupItems[i].showInGroupFooter) {
                        return true
                    }
                }
            }
            return false
        },
        _getItemsWithSummaryGroupFooters: function(sourceItems) {
            var item, i, result = [],
                beforeGroupFooterItems = [],
                groupFooterItems = [];
            for (i = 0; i < sourceItems.length; i++) {
                item = sourceItems[i];
                if ("groupFooter" === item.rowType) {
                    groupFooterItems = this._getFooterSummaryItems(item.summaryCells);
                    result = result.concat(beforeGroupFooterItems, groupFooterItems);
                    beforeGroupFooterItems = []
                } else {
                    beforeGroupFooterItems.push(item)
                }
            }
            return result.length ? result : beforeGroupFooterItems
        },
        _updateGroupValuesWithSummaryByColumn: function(sourceItems) {
            var item, summaryCells, summaryItem, groupColumnCount, k, j, i, summaryValues = [];
            for (i = 0; i < sourceItems.length; i++) {
                item = sourceItems[i];
                summaryCells = item.summaryCells;
                if ("group" === item.rowType && summaryCells && summaryCells.length > 1) {
                    groupColumnCount = item.values.length;
                    for (j = 1; j < summaryCells.length; j++) {
                        for (k = 0; k < summaryCells[j].length; k++) {
                            summaryItem = summaryCells[j][k];
                            if (summaryItem && summaryItem.alignByColumn) {
                                if (!commonUtils.isArray(summaryValues[j - groupColumnCount])) {
                                    summaryValues[j - groupColumnCount] = []
                                }
                                summaryValues[j - groupColumnCount].push(summaryItem)
                            }
                        }
                    }
                    if (summaryValues.length > 0) {
                        $.merge(item.values, summaryValues);
                        summaryValues = []
                    }
                }
            }
        },
        _getAllItems: function(data) {
            var summaryCells, summaryItems, that = this,
                d = $.Deferred(),
                dataController = this.getController("data"),
                footerItems = dataController.footerItems(),
                totalItem = footerItems.length && footerItems[0],
                summaryTotalItems = that.option("summary.totalItems");
            dataController.loadAll(data).done(function(sourceItems, totalAggregates) {
                that._updateGroupValuesWithSummaryByColumn(sourceItems);
                if (that._hasSummaryGroupFooters()) {
                    sourceItems = that._getItemsWithSummaryGroupFooters(sourceItems)
                }
                summaryCells = totalItem && totalItem.summaryCells;
                if (commonUtils.isDefined(totalAggregates) && summaryTotalItems) {
                    summaryCells = dataController._getSummaryCells(summaryTotalItems, totalAggregates)
                }
                summaryItems = totalItem && that._getFooterSummaryItems(summaryCells, true);
                if (summaryItems) {
                    sourceItems = sourceItems.concat(summaryItems)
                }
                d.resolve(sourceItems)
            }).fail(d.reject);
            return d
        },
        _getSelectedItems: function() {
            var selectionController = this.getController("selection"),
                selectedRowData = selectionController.getSelectedRowsData();
            return this._getAllItems(selectedRowData)
        },
        _getStartEndValueIndexces: function(visibleColumns) {
            var i, startIndex, endIndex, visibleColumnslength = visibleColumns.length;
            for (i = 0; i < visibleColumnslength; i++) {
                if (!commonUtils.isDefined(visibleColumns[i].command)) {
                    startIndex = i;
                    break
                }
            }
            for (i = visibleColumnslength - 1; i >= 0; i--) {
                if (!commonUtils.isDefined(visibleColumns[i].command)) {
                    endIndex = i;
                    break
                }
            }
            return {
                startIndex: startIndex,
                endIndex: endIndex
            }
        },
        init: function() {
            this._columnsController = this.getController("columns");
            this._rowsView = this.getView("rowsView");
            this._headersView = this.getView("columnHeadersView");
            this.createAction("onExporting", {
                excludeValidators: ["disabled", "readOnly"]
            });
            this.createAction("onExported", {
                excludeValidators: ["disabled", "readOnly"]
            });
            this.createAction("onFileSaving", {
                excludeValidators: ["disabled", "readOnly"]
            })
        },
        callbackNames: function() {
            return ["selectionOnlyChanged"]
        },
        getExportFormat: function() {
            return ["EXCEL"]
        },
        getDataProvider: function() {
            return new exports.DataProvider(this)
        },
        exportToExcel: function(selectionOnly) {
            var that = this,
                excelWrapTextEnabled = this.option("export.excelWrapTextEnabled");
            that._selectionOnly = selectionOnly;
            clientExporter.export(that.component.getDataProvider(), {
                fileName: that.option("export.fileName"),
                proxyUrl: that.option("export.proxyUrl"),
                format: "EXCEL",
                wrapTextEnabled: commonUtils.isDefined(excelWrapTextEnabled) ? excelWrapTextEnabled : !!this.option("wordWrapEnabled"),
                autoFilterEnabled: !!that.option("export.excelFilterEnabled"),
                rtlEnabled: that.option("rtlEnabled"),
                exportingAction: that.getAction("onExporting"),
                exportedAction: that.getAction("onExported"),
                fileSavingAction: that.getAction("onFileSaving")
            }, excelExporter.getData)
        },
        publicMethods: function() {
            return ["getDataProvider", "getExportFormat", "exportToExcel"]
        },
        selectionOnly: function(value) {
            if (commonUtils.isDefined(value)) {
                this._isSelectedRows = value;
                this.selectionOnlyChanged.fire()
            } else {
                return this._isSelectedRows
            }
        }
    });
    dataGridCore.registerModule("export", {
        defaultOptions: function() {
            return {
                "export": {
                    enabled: false,
                    fileName: "DataGrid",
                    excelFilterEnabled: false,
                    excelWrapTextEnabled: void 0,
                    proxyUrl: void 0,
                    allowExportSelectedData: false,
                    texts: {
                        exportTo: messageLocalization.format("dxDataGrid-exportTo"),
                        exportAll: messageLocalization.format("dxDataGrid-exportAll"),
                        exportSelectedRows: messageLocalization.format("dxDataGrid-exportSelectedRows")
                    }
                }
            }
        },
        controllers: {
            "export": exports.ExportController
        },
        extenders: {
            controllers: {
                editing: {
                    callbackNames: function() {
                        var callbackList = this.callBase();
                        return commonUtils.isDefined(callbackList) ? callbackList.push("editingChanged") : ["editingChanged"]
                    },
                    _updateEditButtons: function() {
                        this.callBase();
                        this.editingChanged.fire(this.hasChanges())
                    }
                }
            },
            views: {
                headerPanel: {
                    _getToolbarItems: function() {
                        var items = this.callBase();
                        return this._appendExportItems(items)
                    },
                    _appendExportItems: function(items) {
                        var that = this,
                            exportOptions = that.option("export");
                        if (exportOptions.enabled) {
                            var exportItems = [];
                            if (exportOptions.allowExportSelectedData) {
                                exportItems.push({
                                    template: function(data, index, $container) {
                                        that._renderButton(data, $container);
                                        that._renderExportMenu($container)
                                    },
                                    menuItemTemplate: function(data, index, $container) {
                                        that._renderList(data, $container)
                                    },
                                    name: "export",
                                    allowExportSelected: true,
                                    location: "after",
                                    locateInMenu: "auto"
                                })
                            } else {
                                exportItems.push({
                                    template: function(data, index, $container) {
                                        that._renderButton(data, $container)
                                    },
                                    menuItemTemplate: function(data, index, $container) {
                                        that._renderButton(data, $container, true)
                                    },
                                    name: "export",
                                    location: "after",
                                    locateInMenu: "auto"
                                })
                            }
                            items = items.concat(exportItems);
                            that._correctSearchPanelPosition(items)
                        }
                        return items
                    },
                    _renderButton: function(data, $container, withText) {
                        var that = this,
                            buttonOptions = that._getButtonOptions(data.allowExportSelected),
                            $buttonContainer = that._getButtonContainer().addClass(DATAGRID_EXPORT_BUTTON_CLASS).appendTo($container);
                        if (withText) {
                            $container.wrapInner("<div class='dx-toolbar-item-auto-hide'></div>").parent().addClass("dx-toolbar-menu-action dx-toolbar-menu-button dx-toolbar-hidden-button");
                            buttonOptions.text = buttonOptions.hint
                        }
                        that._createComponent($buttonContainer, Button, buttonOptions)
                    },
                    _renderList: function(data, $container) {
                        var that = this,
                            texts = that.option("export.texts"),
                            renderFakeButton = function(data, $container, iconName) {
                                var $icon = $("<div />").addClass("dx-icon dx-icon-" + iconName),
                                    $text = $("<span class='dx-button-text'/>").text(data.text),
                                    $content = $("<div class='dx-button-content' />").append($icon).append($text),
                                    $button = $("<div class='dx-button dx-button-has-text dx-button-has-icon dx-datagrid-toolbar-button'>").append($content),
                                    $toolbarItem = $("<div class ='dx-toolbar-item-auto-hide' />").append($button);
                                $container.append($toolbarItem).parent().addClass("dx-toolbar-menu-custom dx-toolbar-hidden-button")
                            },
                            items = [{
                                template: function(data, index, $container) {
                                    renderFakeButton(data, $container, DATAGRID_EXPORT_EXCEL_ICON)
                                },
                                text: texts.exportAll
                            }, {
                                template: function(data, index, $container) {
                                    renderFakeButton(data, $container, DATAGRID_EXPORT_SELECTED_ICON)
                                },
                                text: texts.exportSelectedRows,
                                exportSelected: true
                            }];
                        that._createComponent($container, List, {
                            items: items,
                            onItemClick: function(e) {
                                that._exportController.exportToExcel(e.itemData.exportSelected)
                            },
                            scrollingEnabled: false
                        })
                    },
                    _correctSearchPanelPosition: function(items) {
                        items.sort(function(itemA, itemB) {
                            var result = 0;
                            if ("searchPanel" === itemA.name || "columnChooser" === itemA.name && "searchPanel" !== itemB.name) {
                                result = 1
                            } else {
                                if ("searchPanel" === itemB.name) {
                                    result = -1
                                }
                            }
                            return result
                        })
                    },
                    _renderExportMenu: function($buttonContainer) {
                        var that = this,
                            $button = $buttonContainer.find(".dx-button"),
                            texts = that.option("export.texts"),
                            menuItems = [{
                                text: texts.exportAll,
                                icon: DATAGRID_EXPORT_EXCEL_ICON
                            }, {
                                text: texts.exportSelectedRows,
                                exportSelected: true,
                                icon: DATAGRID_EXPORT_SELECTED_ICON
                            }],
                            $menuContainer = $("<div>").appendTo($buttonContainer);
                        that._createComponent($menuContainer, ContextMenu, {
                            alternativeInvocationMode: {
                                enabled: true,
                                invokingElement: $button
                            },
                            items: menuItems,
                            cssClass: DATAGRID_EXPORT_MENU_CLASS,
                            onItemClick: function(e) {
                                that._exportController.exportToExcel(e.itemData.exportSelected)
                            },
                            target: $button,
                            position: {
                                at: "left bottom",
                                my: "left top",
                                offset: "0 3",
                                collision: "fit",
                                boundary: that._$parent,
                                boundaryOffset: "1 1"
                            }
                        })
                    },
                    _isExportButtonVisible: function() {
                        return this.option("export.enabled")
                    },
                    _getButtonOptions: function(allowExportSelected) {
                        var options, that = this,
                            texts = that.option("export.texts");
                        if (allowExportSelected) {
                            options = {
                                hint: texts.exportTo,
                                icon: DATAGRID_EXPORT_ICON,
                                onClick: null
                            }
                        } else {
                            options = {
                                hint: texts.exportAll,
                                icon: DATAGRID_EXPORT_EXCEL_BUTTON_ICON,
                                onClick: function() {
                                    that._exportController.exportToExcel()
                                }
                            }
                        }
                        return options
                    },
                    optionChanged: function(args) {
                        this.callBase(args);
                        if ("export" === args.name) {
                            args.handled = true;
                            this._invalidate();
                            this._invalidateToolbarItems()
                        }
                    },
                    init: function() {
                        var that = this;
                        this.callBase();
                        this._exportController = this.getController("export");
                        this._editingController = this.getController("editing");
                        this._editingController.editingChanged.add(function(hasChanges) {
                            that.updateToolbarItemOption("export", "disabled", hasChanges)
                        })
                    },
                    isVisible: function() {
                        return this.callBase() || this._isExportButtonVisible()
                    }
                }
            }
        }
    })
});
