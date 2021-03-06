/** 
 * DevExtreme (ui/data_grid/ui.data_grid.rows_view.js)
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
        stringUtils = require("../../core/utils/string"),
        compileGetter = require("../../core/utils/data").compileGetter,
        gridCore = require("./ui.data_grid.core"),
        columnsView = require("./ui.data_grid.columns_view"),
        gridCoreUtils = require("../grid_core/ui.grid_core.utils"),
        Scrollable = require("../scroll_view/ui.scrollable").default,
        messageLocalization = require("../../localization/message"),
        isDefined = commonUtils.isDefined;
    var DATAGRID_GROUP_ROW_CLASS = "dx-group-row",
        DATAGRID_GROUP_CELL_CLASS = "dx-group-cell",
        DATAGRID_ROWS_VIEW_CLASS = "dx-datagrid-rowsview",
        DATAGRID_DATA_ROW_CLASS = "dx-data-row",
        DATAGRID_FREESPACE_CLASS = "dx-freespace-row",
        DATAGRID_CONTENT_CLASS = "dx-datagrid-content",
        DATAGRID_NOWRAP_CLASS = "dx-datagrid-nowrap",
        DATAGRID_ROW_LINES_CLASS = "dx-row-lines",
        DATAGRID_COLUMN_LINES_CLASS = "dx-column-lines",
        DATAGRID_ROW_ALTERNATION_CLASS = "dx-row-alt",
        DATAGRID_LAST_ROW_BORDER = "dx-last-row-border",
        DATAGRID_LOADPANEL_HIDE_TIMEOUT = 200,
        appendFreeSpaceRowTemplate = {
            render: function(options) {
                var $tbody = options.container.find("tbody");
                if ($tbody.length) {
                    $tbody.last().append(options.content)
                } else {
                    options.container.append(options.content)
                }
            }
        };
    exports.RowsView = columnsView.ColumnsView.inherit({
        _getDefaultTemplate: function(column) {
            switch (column.command) {
                case "empty":
                    return function(container) {
                        container.html("&nbsp;")
                    };
                default:
                    return function($container, options) {
                        var isDataTextEmpty = stringUtils.isEmpty(options.text) && "data" === options.rowType,
                            text = isDataTextEmpty ? "&nbsp;" : options.text,
                            container = $container.get(0);
                        if (column.encodeHtml && !isDataTextEmpty) {
                            container.textContent = text
                        } else {
                            container.innerHTML = text
                        }
                    }
            }
        },
        _getDefaultGroupTemplate: function() {
            var that = this,
                summaryTexts = that.option("summary.texts");
            return function(container, options) {
                var data = options.data,
                    text = options.column.caption + ": " + options.text;
                if (options.summaryItems && options.summaryItems.length) {
                    text += " " + gridCore.getGroupRowSummaryText(options.summaryItems, summaryTexts)
                }
                if (data) {
                    if (options.groupContinuedMessage && options.groupContinuesMessage) {
                        text += " (" + options.groupContinuedMessage + ". " + options.groupContinuesMessage + ")"
                    } else {
                        if (options.groupContinuesMessage) {
                            text += " (" + options.groupContinuesMessage + ")"
                        } else {
                            if (options.groupContinuedMessage) {
                                text += " (" + options.groupContinuedMessage + ")"
                            }
                        }
                    }
                }
                container.addClass(DATAGRID_GROUP_CELL_CLASS);
                container.text(text)
            }
        },
        _update: function(change) {},
        _getCellTemplate: function(options) {
            var template, that = this,
                column = options.column;
            if ("group" === options.rowType && isDefined(column.groupIndex) && !column.showWhenGrouped) {
                template = column.groupCellTemplate || {
                    allowRenderToDetachedContainer: true,
                    render: that._getDefaultGroupTemplate()
                }
            } else {
                template = column.cellTemplate || {
                    allowRenderToDetachedContainer: true,
                    render: that._getDefaultTemplate(column)
                }
            }
            return template
        },
        _createRow: function(row) {
            var isGroup, isDataRow, isRowExpanded, $row = this.callBase(row);
            if (row) {
                isGroup = "group" === row.rowType;
                isDataRow = "data" === row.rowType;
                isDataRow && $row.addClass(DATAGRID_DATA_ROW_CLASS);
                isDataRow && row.dataIndex % 2 === 1 && this.option("rowAlternationEnabled") && $row.addClass(DATAGRID_ROW_ALTERNATION_CLASS);
                isDataRow && this.option("showRowLines") && $row.addClass(DATAGRID_ROW_LINES_CLASS);
                this.option("showColumnLines") && $row.addClass(DATAGRID_COLUMN_LINES_CLASS);
                if (isGroup) {
                    $row.addClass(DATAGRID_GROUP_ROW_CLASS);
                    isRowExpanded = row.isExpanded;
                    this.setAria("role", "rowgroup", $row);
                    this.setAria("expanded", isDefined(isRowExpanded) && isRowExpanded.toString(), $row)
                }
            }
            return $row
        },
        _afterRowPrepared: function(e) {
            var arg = e.args[0],
                dataController = this._dataController,
                watch = this.option("watchMethod");
            if (!arg.data || "data" !== arg.rowType || arg.inserted || !this.option("twoWayBindingEnabled") || !watch) {
                return
            }
            watch(function() {
                return dataController.generateDataValues(arg.data, arg.columns)
            }, function() {
                dataController.updateItems({
                    changeType: "update",
                    rowIndices: [arg.rowIndex]
                })
            }, {
                deep: true,
                disposeWithElement: arg.rowElement.get(0),
                skipImmediate: true
            })
        },
        _renderScrollable: function(force) {
            var that = this,
                $element = that.element();
            if (!$element.children().length) {
                $element.append("<div />")
            }
            if (force || !that._loadPanel) {
                that._renderLoadPanel($element, $element.parent(), that._dataController.isLocalStore())
            }
            if ((force || !that.getScrollable()) && that._dataController.isLoaded()) {
                var columns = that.getColumns(),
                    allColumnsHasWidth = true;
                for (var i = 0; i < columns.length; i++) {
                    if (!columns[i].width) {
                        allColumnsHasWidth = false;
                        break
                    }
                }
                if (that.option("columnAutoWidth") || that._hasHeight || allColumnsHasWidth || that._columnsController._isColumnFixing()) {
                    that._renderScrollableCore($element)
                }
            }
        },
        _handleScroll: function(e) {
            var that = this;
            that._scrollTop = e.scrollOffset.top;
            that._scrollLeft = e.scrollOffset.left;
            that.scrollChanged.fire(e.scrollOffset, that.name)
        },
        _renderScrollableCore: function($element) {
            var that = this,
                dxScrollableOptions = that._createScrollableOptions(),
                scrollHandler = $.proxy(that._handleScroll, that);
            dxScrollableOptions.onScroll = scrollHandler;
            dxScrollableOptions.onStop = scrollHandler;
            that._scrollable = that._createComponent($element, Scrollable, dxScrollableOptions);
            that._scrollableContainer = that._scrollable && that._scrollable._$container
        },
        _renderLoadPanel: gridCoreUtils.renderLoadPanel,
        _renderContent: function(contentElement, tableElement) {
            contentElement.replaceWith($("<div>").addClass(DATAGRID_CONTENT_CLASS).append(tableElement));
            return this._findContentElement()
        },
        _updateContent: function(newTableElement, change) {
            var that = this,
                tableElement = that._getTableElement(),
                contentElement = that._findContentElement(),
                changeType = change && change.changeType,
                executors = [];
            switch (changeType) {
                case "update":
                    $.each(change.rowIndices, function(index, rowIndex) {
                        var $newRowElement = that._getRowElements(newTableElement).eq(index),
                            changeType = change.changeTypes[index],
                            item = change.items && change.items[index];
                        executors.push(function() {
                            var $rowsElement = that._getRowElements(),
                                $rowElement = $rowsElement.eq(rowIndex);
                            switch (changeType) {
                                case "update":
                                    if (item) {
                                        if (isDefined(item.visible) && item.visible !== $rowElement.is(":visible")) {
                                            $rowElement.toggle(item.visible)
                                        } else {
                                            $rowElement.replaceWith($newRowElement)
                                        }
                                    }
                                    break;
                                case "insert":
                                    if (!$rowsElement.length) {
                                        $newRowElement.prependTo(tableElement)
                                    } else {
                                        if ($rowElement.length) {
                                            $newRowElement.insertBefore($rowElement)
                                        } else {
                                            $newRowElement.insertAfter($rowsElement.last())
                                        }
                                    }
                                    break;
                                case "remove":
                                    $rowElement.remove()
                            }
                        })
                    });
                    $.each(executors, function() {
                        this()
                    });
                    newTableElement.remove();
                    break;
                default:
                    that._setTableElement(newTableElement);
                    contentElement.addClass(DATAGRID_CONTENT_CLASS);
                    that._renderContent(contentElement, newTableElement)
            }
        },
        _renderFreeSpaceRow: function(tableElement) {
            var i, that = this,
                freeSpaceRowElement = that._createRow(),
                columns = this.getColumns();
            freeSpaceRowElement.addClass(DATAGRID_FREESPACE_CLASS).toggleClass(DATAGRID_COLUMN_LINES_CLASS, that.option("showColumnLines"));
            for (i = 0; i < columns.length; i++) {
                freeSpaceRowElement.append(that._createCell({
                    column: columns[i],
                    rowType: "freeSpace"
                }))
            }
            that._appendRow(tableElement, freeSpaceRowElement, appendFreeSpaceRowTemplate)
        },
        _needUpdateRowHeight: function(itemsCount) {
            return itemsCount > 0 && !this._rowHeight
        },
        _updateRowHeight: function() {
            var tableHeight, freeSpaceRowHeight, $freeSpaceRowElement, that = this,
                tableElement = that._getTableElement(),
                itemsCount = that._dataController.items().length;
            if (tableElement && that._needUpdateRowHeight(itemsCount)) {
                tableHeight = tableElement.outerHeight();
                $freeSpaceRowElement = that._getFreeSpaceRowElements().first();
                if ($freeSpaceRowElement && $freeSpaceRowElement.is(":visible")) {
                    freeSpaceRowHeight = parseFloat($freeSpaceRowElement[0].style.height) || 0;
                    tableHeight -= freeSpaceRowHeight
                }
                that._rowHeight = tableHeight / itemsCount
            }
        },
        _findContentElement: function() {
            var $scrollableContent, $element = this.element();
            if ($element) {
                $scrollableContent = $element.find("> .dx-scrollable-container > .dx-scrollable-content");
                if (!$scrollableContent.length) {
                    $scrollableContent = $element
                }
                return $scrollableContent.children().first()
            }
        },
        _getRowElements: function(tableElement) {
            var $rows = this.callBase(tableElement);
            return $rows && $rows.not("." + DATAGRID_FREESPACE_CLASS)
        },
        _getFreeSpaceRowElements: function($table) {
            var tableElements = $table || this.getTableElements();
            return tableElements && tableElements.children("tbody").children("." + DATAGRID_FREESPACE_CLASS)
        },
        _getNoDataText: function() {
            return this.option("noDataText")
        },
        _renderNoDataText: gridCoreUtils.renderNoDataText,
        _rowClick: function(e) {
            var item = this._dataController.items()[e.rowIndex] || {};
            this.executeAction("onRowClick", $.extend({
                evaluate: function(expr) {
                    var getter = compileGetter(expr);
                    return getter(item.data)
                }
            }, e, item))
        },
        _getGroupCellOptions: function(options) {
            var columnIndex = (options.row.groupIndex || 0) + options.columnsCountBeforeGroups;
            return {
                columnIndex: columnIndex,
                colspan: options.columns.length - columnIndex - 1
            }
        },
        _renderCells: function($row, options) {
            if ("group" === options.row.rowType) {
                this._renderGroupedCells($row, options)
            } else {
                if (options.row.values) {
                    this.callBase($row, options)
                }
            }
        },
        _renderGroupedCells: function($row, options) {
            var $groupCell, i, isExpanded, groupColumn, groupColumnAlignment, row = options.row,
                columns = options.columns,
                rowIndex = row.rowIndex,
                groupCellOptions = this._getGroupCellOptions(options);
            for (i = 0; i <= groupCellOptions.columnIndex; i++) {
                if (i === groupCellOptions.columnIndex && columns[i].allowCollapsing && "infinite" !== options.scrollingMode) {
                    isExpanded = !!row.isExpanded
                } else {
                    isExpanded = null
                }
                this._renderCell($row, {
                    value: isExpanded,
                    row: row,
                    rowIndex: rowIndex,
                    column: {
                        command: "expand",
                        cssClass: columns[i].cssClass
                    },
                    columnIndex: i
                })
            }
            groupColumnAlignment = commonUtils.getDefaultAlignment(this.option("rtlEnabled"));
            groupColumn = $.extend({}, columns[groupCellOptions.columnIndex], {
                command: null,
                cssClass: null,
                showWhenGrouped: false,
                alignment: groupColumnAlignment
            });
            if (groupCellOptions.colspan > 1) {
                groupColumn.colspan = groupCellOptions.colspan
            }
            $groupCell = this._renderCell($row, {
                value: row.values[row.groupIndex],
                row: row,
                rowIndex: rowIndex,
                column: groupColumn,
                columnIndex: groupCellOptions.columnIndex
            })
        },
        _renderRows: function($table, options) {
            var i, that = this,
                columns = options.columns,
                columnsCountBeforeGroups = 0,
                scrollingMode = that.option("scrolling.mode");
            for (i = 0; i < columns.length; i++) {
                if ("expand" === columns[i].command) {
                    columnsCountBeforeGroups = i;
                    break
                }
            }
            that.callBase($table, $.extend({
                scrollingMode: scrollingMode,
                columnsCountBeforeGroups: columnsCountBeforeGroups
            }, options));
            that._renderFreeSpaceRow($table);
            if (!that._hasHeight) {
                that.updateFreeSpaceRowHeight($table)
            }
        },
        _renderRow: function($table, options) {
            var that = this,
                row = options.row,
                rowTemplate = that.option("rowTemplate");
            if (("data" === row.rowType || "group" === row.rowType) && !isDefined(row.groupIndex) && rowTemplate) {
                that.renderTemplate($table, rowTemplate, $.extend({
                    columns: options.columns
                }, row), true)
            } else {
                that.callBase($table, options)
            }
        },
        _renderTable: function(options) {
            var that = this,
                $table = that.callBase(options),
                triggerShownEvent = function() {
                    if (that.element().closest(document).length) {
                        that.resizeCompleted.remove(triggerShownEvent);
                        that.element().triggerHandler("dxshown")
                    }
                };
            if (!isDefined(that._getTableElement())) {
                that._setTableElement($table);
                that._renderScrollable(true);
                that.resizeCompleted.add(triggerShownEvent)
            } else {
                that._renderScrollable()
            }
            return $table
        },
        _renderCore: function(change) {
            var $table, that = this,
                $element = that.element();
            $element.addClass(DATAGRID_ROWS_VIEW_CLASS).toggleClass(DATAGRID_NOWRAP_CLASS, !that.option("wordWrapEnabled"));
            $table = that._renderTable({
                change: change
            });
            that._updateContent($table, change);
            that.callBase(change);
            that._lastColumnWidths = null
        },
        _getRows: function(change) {
            return change && change.items || this._dataController.items()
        },
        _getCellOptions: function(options) {
            var parameters, groupingTextsOptions, scrollingMode, that = this,
                column = options.column,
                row = options.row,
                data = row.data,
                summaryCells = row && row.summaryCells,
                value = options.value,
                displayValue = gridCore.getDisplayValue(column, value, data, row.rowType);
            parameters = this.callBase(options);
            parameters.value = value;
            parameters.displayValue = displayValue;
            parameters.row = row;
            parameters.key = row.key;
            parameters.data = data;
            parameters.rowType = row.rowType;
            parameters.values = row.values;
            parameters.text = !column.command ? gridCore.formatValue(displayValue, column) : "";
            parameters.rowIndex = row.rowIndex;
            parameters.summaryItems = summaryCells && summaryCells[options.columnIndex];
            parameters.resized = column.resizedCallbacks;
            if (isDefined(column.groupIndex)) {
                groupingTextsOptions = that.option("grouping.texts");
                scrollingMode = that.option("scrolling.mode");
                if ("virtual" !== scrollingMode && "infinite" !== scrollingMode) {
                    parameters.groupContinuesMessage = data && data.isContinuationOnNextPage && groupingTextsOptions && groupingTextsOptions.groupContinuesMessage;
                    parameters.groupContinuedMessage = data && data.isContinuation && groupingTextsOptions && groupingTextsOptions.groupContinuedMessage
                }
            }
            return parameters
        },
        getCellOptions: function(rowIndex, columnIdentificator) {
            var cellOptions, column, rowOptions = this._dataController.items()[rowIndex];
            if (rowOptions) {
                column = this._columnsController.columnOption(columnIdentificator);
                if (column) {
                    cellOptions = this._getCellOptions({
                        value: column.calculateCellValue(rowOptions.data),
                        rowIndex: rowOptions.rowIndex,
                        row: rowOptions,
                        column: column
                    })
                }
            }
            return cellOptions
        },
        getRow: function(index) {
            var rows = this._getRowElements();
            if (rows.length > index) {
                return $(rows[index])
            }
        },
        getCellIndex: function($cell) {
            var cellIndex = $cell.length ? $cell[0].cellIndex : -1;
            return cellIndex
        },
        updateFreeSpaceRowHeight: function($table) {
            var elementHeight, freespaceRowCount, scrollingMode, resultHeight, that = this,
                contentElement = that._findContentElement(),
                freeSpaceRowElements = that._getFreeSpaceRowElements($table),
                contentHeight = 0;
            if (freeSpaceRowElements && contentElement) {
                var isFreespaceRowVisible = false;
                if (that._dataController.items().length > 0) {
                    if (!that._hasHeight) {
                        freespaceRowCount = that._dataController.pageSize() - that._dataController.items().length;
                        scrollingMode = that.option("scrolling.mode");
                        if (freespaceRowCount > 0 && that._dataController.pageCount() > 1 && "virtual" !== scrollingMode && "infinite" !== scrollingMode) {
                            freeSpaceRowElements.height(freespaceRowCount * that._rowHeight);
                            isFreespaceRowVisible = true
                        }
                        if (!isFreespaceRowVisible && $table) {
                            freeSpaceRowElements.height(0)
                        } else {
                            freeSpaceRowElements.css("display", isFreespaceRowVisible ? "" : "none")
                        }
                        that._updateLastRowBorder(isFreespaceRowVisible)
                    } else {
                        freeSpaceRowElements.css("display", "none");
                        commonUtils.deferUpdate(function() {
                            elementHeight = that.element().height();
                            contentHeight = contentElement.outerHeight();
                            resultHeight = elementHeight - contentHeight - that.getScrollbarWidth(true);
                            if (resultHeight > 0) {
                                commonUtils.deferRender(function() {
                                    freeSpaceRowElements.height(resultHeight);
                                    isFreespaceRowVisible = true;
                                    freeSpaceRowElements.css("display", "")
                                })
                            }
                            commonUtils.deferRender(function() {
                                that._updateLastRowBorder(isFreespaceRowVisible)
                            })
                        })
                    }
                } else {
                    freeSpaceRowElements.height(0);
                    freeSpaceRowElements.css("display", "");
                    that._updateLastRowBorder(true)
                }
            }
        },
        _columnOptionChanged: function(e) {
            var optionNames = e.optionNames;
            if (e.changeTypes.grouping) {
                return
            }
            if (optionNames.width || optionNames.visibleWidth) {
                this.callBase(e);
                this._fireColumnResizedCallbacks()
            }
        },
        getScrollable: function() {
            return this._scrollable
        },
        init: function() {
            var that = this,
                dataController = that.getController("data");
            that.callBase();
            that._editorFactoryController = that.getController("editorFactory");
            that._rowHeight = 0;
            that._scrollTop = 0;
            that._scrollLeft = 0;
            that._hasHeight = false;
            dataController.loadingChanged.add(function(isLoading, messageText) {
                that.setLoading(isLoading, messageText)
            });
            dataController.dataSourceChanged.add(function() {
                that._handleScroll({
                    scrollOffset: {
                        top: that._scrollTop,
                        left: that._scrollLeft
                    }
                })
            })
        },
        _handleDataChanged: function(change) {
            var that = this;
            switch (change.changeType) {
                case "refresh":
                case "prepend":
                case "append":
                case "update":
                    that.render(null, change);
                    break;
                default:
                    that._update(change)
            }
        },
        publicMethods: function() {
            return ["isScrollbarVisible", "getTopVisibleRowData", "getScrollbarWidth", "getCellElement"]
        },
        contentWidth: function() {
            return this.element().width() - this.getScrollbarWidth()
        },
        getScrollbarWidth: function(isHorizontal) {
            var scrollableContainer = this._scrollableContainer && this._scrollableContainer.get(0),
                scrollbarWidth = 0;
            if (scrollableContainer) {
                if (!isHorizontal) {
                    scrollbarWidth = scrollableContainer.clientWidth ? scrollableContainer.offsetWidth - scrollableContainer.clientWidth : 0
                } else {
                    scrollbarWidth = scrollableContainer.clientHeight ? scrollableContainer.offsetHeight - scrollableContainer.clientHeight : 0
                }
            }
            return scrollbarWidth > 0 ? scrollbarWidth : 0
        },
        _fireColumnResizedCallbacks: function() {
            var i, that = this,
                lastColumnWidths = that._lastColumnWidths || [],
                columnWidths = [],
                columns = that.getColumns();
            for (i = 0; i < columns.length; i++) {
                columnWidths[i] = columns[i].visibleWidth;
                if (columns[i].resizedCallbacks && !isDefined(columns[i].groupIndex) && lastColumnWidths[i] !== columnWidths[i]) {
                    columns[i].resizedCallbacks.fire(columnWidths[i])
                }
            }
            that._lastColumnWidths = columnWidths
        },
        _updateLastRowBorder: function(isFreespaceRowVisible) {
            if (this.option("showBorders") && this.option("showRowLines") && !isFreespaceRowVisible) {
                this.element().addClass(DATAGRID_LAST_ROW_BORDER)
            } else {
                this.element().removeClass(DATAGRID_LAST_ROW_BORDER)
            }
        },
        _updateScrollable: function() {
            var dxScrollable = Scrollable.getInstance(this.element());
            if (dxScrollable) {
                dxScrollable.update();
                this._updateHorizontalScrollPosition()
            }
        },
        _updateHorizontalScrollPosition: function() {
            var scrollable = this.getScrollable(),
                scrollLeft = scrollable && scrollable.scrollOffset().left;
            if (0 === scrollLeft && scrollLeft !== this._scrollLeft) {
                scrollable.scrollTo({
                    x: this._scrollLeft
                })
            }
        },
        _resizeCore: function() {
            var that = this;
            that._fireColumnResizedCallbacks();
            that._updateRowHeight();
            commonUtils.deferRender(function() {
                that._renderScrollable();
                that._renderNoDataText();
                that.updateFreeSpaceRowHeight()
            });
            that._updateScrollable();
            that.setLoading(that._dataController.isLoading())
        },
        scrollTo: function(location) {
            var $element = this.element(),
                dxScrollable = $element && Scrollable.getInstance($element);
            if (dxScrollable) {
                dxScrollable.scrollTo(location)
            }
        },
        height: function(height, hasHeight) {
            var that = this,
                $element = this.element();
            if (isDefined(height)) {
                that._hasHeight = void 0 === hasHeight ? "auto" !== height : hasHeight;
                if ($element) {
                    $element.css("height", height)
                }
            } else {
                return $element ? $element.outerHeight(true) : 0
            }
        },
        setLoading: function(isLoading, messageText) {
            var visibilityOptions, that = this,
                loadPanel = that._loadPanel,
                dataController = that._dataController,
                loadPanelOptions = that.option("loadPanel") || {},
                animation = dataController.isLoaded() ? loadPanelOptions.animation : null,
                $element = that.element();
            if (!loadPanel && void 0 !== messageText && dataController.isLocalStore() && "auto" === loadPanelOptions.enabled && $element) {
                that._renderLoadPanel($element, $element.parent());
                loadPanel = that._loadPanel
            }
            if (loadPanel) {
                visibilityOptions = {
                    message: messageText || loadPanelOptions.text,
                    animation: animation,
                    visible: isLoading
                };
                clearTimeout(that._hideLoadingTimeoutID);
                if (loadPanel.option("visible") && !isLoading) {
                    that._hideLoadingTimeoutID = setTimeout(function() {
                        loadPanel.option(visibilityOptions)
                    }, DATAGRID_LOADPANEL_HIDE_TIMEOUT)
                } else {
                    loadPanel.option(visibilityOptions)
                }
            }
        },
        setRowsOpacity: function(columnIndex, value) {
            var i, that = this,
                columnsController = that._columnsController,
                visibleColumns = that.getColumns(),
                columns = columnsController.getColumns(),
                column = columns && columns[columnIndex],
                columnID = column && column.isBand && column.index,
                $rows = that._getRowElements().not("." + DATAGRID_GROUP_ROW_CLASS) || [];
            $.each($rows, function(rowIndex, row) {
                if (!$(row).hasClass(DATAGRID_GROUP_ROW_CLASS)) {
                    for (i = 0; i < visibleColumns.length; i++) {
                        if (commonUtils.isNumber(columnID) && columnsController.isParentBandColumn(visibleColumns[i].index, columnID) || visibleColumns[i].index === columnIndex) {
                            that.getCellElements(rowIndex).eq(i).css({
                                opacity: value
                            });
                            if (!commonUtils.isNumber(columnID)) {
                                break
                            }
                        }
                    }
                }
            })
        },
        _getCellElementsCore: function(rowIndex) {
            var groupCellIndex, $cells = this.callBase(rowIndex);
            if ($cells) {
                groupCellIndex = $cells.filter("." + DATAGRID_GROUP_CELL_CLASS).index();
                if (groupCellIndex >= 0 && $cells.length > groupCellIndex + 1) {
                    $cells.length = groupCellIndex + 1
                }
            }
            return $cells
        },
        getTopVisibleItemIndex: function() {
            var rowElements, rowElement, that = this,
                itemIndex = 0,
                prevOffsetTop = 0,
                offsetTop = 0,
                scrollPosition = that._scrollTop,
                contentElementOffsetTop = that._findContentElement().offset().top,
                items = that._dataController.items(),
                tableElement = that._getTableElement();
            if (items.length && tableElement) {
                rowElements = tableElement.children("tbody").children(".dx-row:visible, .dx-error-row").not("." + DATAGRID_FREESPACE_CLASS);
                for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    prevOffsetTop = offsetTop;
                    rowElement = rowElements.eq(itemIndex);
                    if (rowElement.length) {
                        offsetTop = rowElement.offset().top - contentElementOffsetTop;
                        if (offsetTop > scrollPosition) {
                            if (2 * scrollPosition < offsetTop + prevOffsetTop && itemIndex) {
                                itemIndex--
                            }
                            break
                        }
                    }
                }
                if (itemIndex && itemIndex === items.length) {
                    itemIndex--
                }
            }
            return itemIndex
        },
        getTopVisibleRowData: function() {
            var itemIndex = this.getTopVisibleItemIndex(),
                items = this._dataController.items();
            if (items[itemIndex]) {
                return items[itemIndex].data
            }
        },
        optionChanged: function(args) {
            var that = this;
            that.callBase(args);
            switch (args.name) {
                case "wordWrapEnabled":
                case "showColumnLines":
                case "showRowLines":
                case "rowAlternationEnabled":
                case "rowTemplate":
                case "twoWayBindingEnabled":
                    that._invalidate(true, true);
                    args.handled = true;
                    break;
                case "scrolling":
                    that._rowHeight = null;
                    that._tableElement = null;
                    args.handled = true;
                    break;
                case "rtlEnabled":
                    that._rowHeight = null;
                    that._tableElement = null;
                    break;
                case "loadPanel":
                    that._tableElement = null;
                    that._invalidate(true, true);
                    args.handled = true;
                    break;
                case "noDataText":
                    that._renderNoDataText();
                    args.handled = true
            }
        },
        dispose: function() {
            clearTimeout(this._hideLoadingTimeoutID)
        },
        setScrollerSpacing: function() {}
    });
    gridCore.registerModule("rows", {
        defaultOptions: function() {
            return {
                hoverStateEnabled: false,
                loadPanel: {
                    enabled: "auto",
                    text: messageLocalization.format("Loading"),
                    width: 200,
                    height: 90,
                    showIndicator: true,
                    indicatorSrc: "",
                    showPane: true
                },
                rowTemplate: null,
                columnAutoWidth: false,
                noDataText: messageLocalization.format("dxDataGrid-noDataText"),
                wordWrapEnabled: false,
                showColumnLines: true,
                showRowLines: false,
                rowAlternationEnabled: false,
                activeStateEnabled: false,
                twoWayBindingEnabled: true
            }
        },
        views: {
            rowsView: exports.RowsView
        }
    })
});
