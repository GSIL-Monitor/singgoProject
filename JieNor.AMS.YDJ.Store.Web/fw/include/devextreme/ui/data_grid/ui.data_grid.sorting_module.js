/** 
 * DevExtreme (ui/data_grid/ui.data_grid.sorting_module.js)
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
        clickEvent = require("../../events/click"),
        gridCore = require("./ui.data_grid.core"),
        commonUtils = require("../../core/utils/common"),
        sortingMixin = require("../grid_core/ui.grid_core.sorting").sortingMixin,
        messageLocalization = require("../../localization/message"),
        eventUtils = require("../../events/utils");
    var COLUMN_HEADERS_VIEW_NAMESPACE = "dxDataGridColumnHeadersView";
    var ColumnHeadersViewSortingExtender = $.extend({}, sortingMixin, {
        _createRow: function(row) {
            var that = this,
                $row = that.callBase(row);
            if ("header" === row.rowType) {
                $row.on(eventUtils.addNamespace(clickEvent.name, COLUMN_HEADERS_VIEW_NAMESPACE), "> td", that.createAction(function(e) {
                    var keyName = null,
                        event = e.jQueryEvent,
                        $cellElement = $(event.currentTarget),
                        rowIndex = $cellElement.parent().index(),
                        columnIndex = $.map(that.getCellElements(rowIndex), function($tdElement, index) {
                            if ($tdElement === $cellElement.get(0)) {
                                return index
                            }
                        })[0],
                        visibleColumns = that._columnsController.getVisibleColumns(rowIndex),
                        column = visibleColumns[columnIndex];
                    if (column && !commonUtils.isDefined(column.groupIndex) && !column.command) {
                        if (event.shiftKey) {
                            keyName = "shift"
                        } else {
                            if (event.ctrlKey) {
                                keyName = "ctrl"
                            }
                        }
                        setTimeout(function() {
                            that._columnsController.changeSortOrder(column.index, keyName)
                        })
                    }
                }))
            }
            return $row
        },
        _renderCellContent: function($cell, options) {
            var that = this,
                column = options.column;
            that.callBase($cell, options);
            if (!column.command && "header" === options.rowType) {
                that._applyColumnState({
                    name: "sort",
                    rootElement: $cell,
                    column: column,
                    showColumnLines: that.option("showColumnLines")
                })
            }
        },
        _columnOptionChanged: function(e) {
            var changeTypes = e.changeTypes;
            if (1 === changeTypes.length && changeTypes.sorting) {
                this._updateIndicators("sort");
                return
            }
            this.callBase(e)
        },
        optionChanged: function(args) {
            var that = this;
            switch (args.name) {
                case "sorting":
                    that._invalidate();
                    args.handled = true;
                    break;
                default:
                    that.callBase(args)
            }
        }
    });
    var HeaderPanelSortingExtender = $.extend({}, sortingMixin, {
        _createGroupPanelItem: function($rootElement, groupColumn) {
            var that = this,
                $item = that.callBase.apply(that, arguments);
            $item.on(eventUtils.addNamespace(clickEvent.name, "dxDataGridHeaderPanel"), that.createAction(function(e) {
                setTimeout(function() {
                    that.getController("columns").changeSortOrder(groupColumn.index)
                })
            }));
            that._applyColumnState({
                name: "sort",
                rootElement: $item,
                column: {
                    alignment: that.option("rtlEnabled") ? "right" : "left",
                    allowSorting: groupColumn.allowSorting,
                    sortOrder: "desc" === groupColumn.sortOrder ? "desc" : "asc"
                },
                showColumnLines: true
            });
            return $item
        },
        optionChanged: function(args) {
            var that = this;
            switch (args.name) {
                case "sorting":
                    that._invalidate();
                    args.handled = true;
                    break;
                default:
                    that.callBase(args)
            }
        }
    });
    gridCore.registerModule("sorting", {
        defaultOptions: function() {
            return {
                sorting: {
                    mode: "single",
                    ascendingText: messageLocalization.format("dxDataGrid-sortingAscendingText"),
                    descendingText: messageLocalization.format("dxDataGrid-sortingDescendingText"),
                    clearText: messageLocalization.format("dxDataGrid-sortingClearText")
                }
            }
        },
        extenders: {
            views: {
                columnHeadersView: ColumnHeadersViewSortingExtender,
                headerPanel: HeaderPanelSortingExtender
            }
        }
    })
});
