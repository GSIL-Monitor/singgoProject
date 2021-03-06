/** 
 * DevExtreme (ui/data_grid/ui.data_grid.header_filter.js)
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
        gridCore = require("./ui.data_grid.core"),
        gridCoreUtils = require("../grid_core/ui.grid_core.utils"),
        headerFilterCore = require("../grid_core/ui.grid_core.header_filter"),
        headerFilterMixin = headerFilterCore.headerFilterMixin,
        messageLocalization = require("../../localization/message"),
        allowHeaderFiltering = headerFilterCore.allowHeaderFiltering,
        clickEvent = require("../../events/click"),
        dataUtils = require("../../data/utils"),
        dataCoreUtils = require("../../core/utils/data"),
        commonUtils = require("../../core/utils/common"),
        normalizeDataSourceOptions = require("../../data/data_source/data_source").normalizeDataSourceOptions,
        isWrapped = require("../../core/utils/variable_wrapper").isWrapped,
        dateLocalization = require("../../localization/date");
    var DATE_INTERVAL_FORMATS = {
        month: function(value) {
            return dateLocalization.getMonthNames()[value - 1]
        },
        quarter: function(value) {
            return dateLocalization.format(new Date(2e3, 3 * value - 1), "quarter")
        }
    };
    exports.HeaderFilterController = gridCore.ViewController.inherit(function() {
        var getFormatOptions = function(value, column, currentLevel) {
            var groupInterval = gridCore.getGroupInterval(column),
                result = gridCore.getFormatOptionsByColumn(column, "headerFilter");
            if (groupInterval) {
                result.groupInterval = groupInterval[currentLevel];
                if ("date" === column.dataType) {
                    result.format = DATE_INTERVAL_FORMATS[groupInterval[currentLevel]]
                } else {
                    if ("number" === column.dataType) {
                        result.getDisplayFormat = function() {
                            var formatOptions = {
                                    format: column.format,
                                    precision: column.precision,
                                    target: "headerFilter"
                                },
                                firstValueText = gridCore.formatValue(value, formatOptions),
                                secondValue = value + groupInterval[currentLevel],
                                secondValueText = gridCore.formatValue(secondValue, formatOptions);
                            return firstValueText && secondValueText ? firstValueText + " - " + secondValueText : ""
                        }
                    }
                }
            }
            return result
        };
        return {
            init: function() {
                this._columnsController = this.getController("columns");
                this._dataController = this.getController("data");
                this._headerFilterView = this.getView("headerFilterView")
            },
            _updateSelectedState: function(items, column, parent) {
                var i = items.length,
                    isExclude = "exclude" === column.filterType;
                while (i--) {
                    var item = items[i];
                    if ("items" in items[i]) {
                        this._updateSelectedState(items[i].items, column, items[i])
                    }
                    headerFilterCore.updateHeaderFilterItemSelectionState(item, gridCoreUtils.getIndexByKey(items[i].value, column.filterValues, null) > -1, isExclude)
                }
            },
            _normalizeGroupItem: function(item, currentLevel, options) {
                var value, displayValue, path = options.path,
                    valueSelector = options.valueSelector,
                    displaySelector = options.displaySelector,
                    column = options.column;
                if (valueSelector && displaySelector) {
                    value = valueSelector(item);
                    displayValue = displaySelector(item)
                } else {
                    value = item.key;
                    displayValue = value
                }
                item = commonUtils.isObject(item) ? item : {};
                path.push(value);
                if (1 === path.length) {
                    item.value = path[0]
                } else {
                    item.value = path.join("/")
                }
                item.text = gridCore.formatValue(displayValue, getFormatOptions(displayValue, column, currentLevel));
                if (!item.text) {
                    item.text = options.headerFilterOptions.texts.emptyValue
                }
                delete item.key;
                return item
            },
            _processGroupItems: function(groupItems, currentLevel, path, options) {
                var displaySelector, valueSelector, that = this,
                    column = options.column,
                    lookup = column.lookup,
                    level = options.level;
                path = path || [];
                currentLevel = currentLevel || 0;
                if (lookup) {
                    displaySelector = dataCoreUtils.compileGetter(lookup.displayExpr);
                    valueSelector = dataCoreUtils.compileGetter(lookup.valueExpr)
                }
                for (var i = 0; i < groupItems.length; i++) {
                    groupItems[i] = that._normalizeGroupItem(groupItems[i], currentLevel, {
                        column: options.column,
                        headerFilterOptions: options.headerFilterOptions,
                        displaySelector: displaySelector,
                        valueSelector: valueSelector,
                        path: path
                    });
                    if ("items" in groupItems[i]) {
                        if (currentLevel === level || !commonUtils.isDefined(groupItems[i].value)) {
                            delete groupItems[i].items
                        } else {
                            that._processGroupItems(groupItems[i].items, currentLevel + 1, path, options)
                        }
                    }
                    path.pop()
                }
            },
            getDataSource: function(column) {
                var filter, cutoffLevel, origPostProcess, that = this,
                    dataSource = that._dataController.dataSource(),
                    group = gridCore.getHeaderFilterGroupParameters(column, dataSource && dataSource.remoteOperations().grouping),
                    headerFilterDataSource = column.headerFilter && column.headerFilter.dataSource,
                    headerFilterOptions = that.option("headerFilter"),
                    options = {
                        component: that.component
                    };
                if (!dataSource) {
                    return
                }
                if (commonUtils.isDefined(headerFilterDataSource) && !commonUtils.isFunction(headerFilterDataSource)) {
                    dataSource = normalizeDataSourceOptions(headerFilterDataSource);
                    dataSource.postProcess = function(items) {
                        that._updateSelectedState(items, column);
                        return items
                    };
                    return dataSource
                }
                if (column.lookup) {
                    dataSource = column.lookup.dataSource;
                    if (commonUtils.isFunction(dataSource) && !isWrapped(dataSource)) {
                        dataSource = dataSource({})
                    }
                    dataSource = normalizeDataSourceOptions(dataSource);
                    dataSource.postProcess = function(items) {
                        if (0 === this.pageIndex()) {
                            items = items.slice(0);
                            items.unshift(null)
                        }
                        that._processGroupItems(items, null, null, {
                            level: 0,
                            column: column,
                            headerFilterOptions: headerFilterOptions
                        });
                        that._updateSelectedState(items, column);
                        return items
                    };
                    options.dataSource = dataSource
                } else {
                    cutoffLevel = commonUtils.isArray(group) ? group.length - 1 : 0;
                    that._currentColumn = column;
                    filter = that._dataController.getCombinedFilter();
                    that._currentColumn = null;
                    options.dataSource = {
                        filter: filter,
                        group: group,
                        load: function(options) {
                            var d = $.Deferred();
                            options.dataField = column.dataField || column.name;
                            dataSource.load(options).done(function(data) {
                                that._processGroupItems(data, null, null, {
                                    level: cutoffLevel,
                                    column: column,
                                    headerFilterOptions: headerFilterOptions
                                });
                                that._updateSelectedState(data, column);
                                d.resolve(data)
                            }).fail(d.reject);
                            return d
                        }
                    }
                }
                if (commonUtils.isFunction(headerFilterDataSource)) {
                    headerFilterDataSource.call(column, options);
                    origPostProcess = options.dataSource.postProcess;
                    options.dataSource.postProcess = function(data) {
                        var items = origPostProcess && origPostProcess.apply(this, arguments) || data;
                        that._updateSelectedState(items, column);
                        return items
                    }
                }
                return options.dataSource
            },
            getCurrentColumn: function() {
                return this._currentColumn
            },
            showHeaderFilterMenu: function(columnIndex) {
                var that = this,
                    column = $.extend(true, {}, that._columnsController.getColumns()[columnIndex]);
                if (column) {
                    var visibleIndex = that._columnsController.getVisibleIndex(columnIndex),
                        isGroupColumn = column && commonUtils.isDefined(column.groupIndex),
                        view = isGroupColumn ? that.getView("headerPanel") : that.getView("columnHeadersView"),
                        $columnElement = view.getColumnElements().eq(isGroupColumn ? column.groupIndex : visibleIndex),
                        groupInterval = gridCore.getGroupInterval(column);
                    var options = $.extend(column, {
                        type: groupInterval && groupInterval.length > 1 ? "tree" : "list",
                        apply: function() {
                            that._columnsController.columnOption(columnIndex, {
                                filterValues: this.filterValues,
                                filterType: this.filterType
                            })
                        },
                        onShowing: function(e) {
                            var dxResizableInstance = e.component.overlayContent().dxResizable("instance");
                            dxResizableInstance && dxResizableInstance.option("onResizeEnd", function(e) {
                                var columnsController = that.getController("columns"),
                                    headerFilterByColumn = columnsController.columnOption(options.dataField, "headerFilter");
                                headerFilterByColumn = headerFilterByColumn || {};
                                headerFilterByColumn.width = e.width;
                                headerFilterByColumn.height = e.height;
                                columnsController.columnOption(options.dataField, "headerFilter", headerFilterByColumn, true)
                            })
                        }
                    });
                    options.dataSource = that.getDataSource(options);
                    that._headerFilterView.showHeaderFilterMenu($columnElement, options)
                }
            },
            hideHeaderFilterMenu: function() {
                this._headerFilterView.hideHeaderFilterMenu()
            }
        }
    }());
    var ColumnHeadersViewHeaderFilterExtender = $.extend({}, headerFilterCore.headerFilterMixin, {
        _renderCellContent: function($cell, options) {
            var $headerFilterIndicator, that = this,
                column = options.column;
            that.callBase($cell, options);
            if (!column.command && !commonUtils.isDefined(column.groupIndex) && allowHeaderFiltering(column) && that.option("headerFilter.visible") && "header" === options.rowType) {
                $headerFilterIndicator = that._applyColumnState({
                    name: "headerFilter",
                    rootElement: $cell,
                    column: column,
                    showColumnLines: that.option("showColumnLines")
                });
                $headerFilterIndicator && that._subscribeToIndicatorEvent($headerFilterIndicator, column, "headerFilter")
            }
        },
        _subscribeToIndicatorEvent: function($indicator, column, indicatorName) {
            var that = this;
            if ("headerFilter" === indicatorName) {
                $indicator.on(clickEvent.name, that.createAction(function(e) {
                    var event = e.jQueryEvent;
                    event.stopPropagation();
                    that.getController("headerFilter").showHeaderFilterMenu(column.index)
                }))
            }
        },
        _updateIndicator: function($cell, column, indicatorName) {
            var $indicator = this.callBase($cell, column, indicatorName);
            $indicator && this._subscribeToIndicatorEvent($indicator, column, indicatorName)
        },
        _columnOptionChanged: function(e) {
            var optionNames = e.optionNames;
            if (gridCore.checkChanges(optionNames, ["filterValues", "filterType"])) {
                if (this.option("headerFilter.visible")) {
                    this._updateIndicators("headerFilter")
                }
                return
            }
            this.callBase(e)
        }
    });
    var HeaderPanelHeaderFilterExtender = $.extend({}, headerFilterMixin, {
        _createGroupPanelItem: function($rootElement, groupColumn) {
            var $headerFilterIndicator, that = this,
                $item = that.callBase.apply(that, arguments);
            if (!groupColumn.command && allowHeaderFiltering(groupColumn) && that.option("headerFilter.visible")) {
                $headerFilterIndicator = that._applyColumnState({
                    name: "headerFilter",
                    rootElement: $item,
                    column: {
                        alignment: commonUtils.getDefaultAlignment(that.option("rtlEnabled")),
                        filterValues: groupColumn.filterValues,
                        allowHeaderFiltering: true
                    },
                    showColumnLines: true
                });
                $headerFilterIndicator && $headerFilterIndicator.on(clickEvent.name, that.createAction(function(e) {
                    var event = e.jQueryEvent;
                    event.stopPropagation();
                    that.getController("headerFilter").showHeaderFilterMenu(groupColumn.index)
                }))
            }
            return $item
        }
    });
    var INVERTED_BINARY_OPERATIONS = {
        "=": "<>",
        "<>": "=",
        ">": "<=",
        ">=": "<",
        "<": ">=",
        "<=": ">",
        contains: "notcontains",
        notcontains: "contains",
        startswith: "notcontains",
        endswith: "notcontains"
    };

    function invertFilterExpression(filter) {
        var i, currentGroupOperation, result;
        if ($.isArray(filter[0])) {
            result = [];
            for (i = 0; i < filter.length; i++) {
                if ($.isArray(filter[i])) {
                    if (currentGroupOperation) {
                        result.push(currentGroupOperation)
                    }
                    result.push(invertFilterExpression(filter[i]));
                    currentGroupOperation = "or"
                } else {
                    currentGroupOperation = dataUtils.isConjunctiveOperator(filter[i]) ? "or" : "and"
                }
            }
            return result
        }
        result = dataUtils.normalizeBinaryCriterion(filter);
        result[1] = INVERTED_BINARY_OPERATIONS[result[1]] || result[1];
        return result
    }
    exports.invertFilterExpression = invertFilterExpression;
    var DataControllerFilterRowExtender = {
        _calculateAdditionalFilter: function() {
            var that = this,
                filters = [that.callBase()],
                columns = that._columnsController.getVisibleColumns(),
                headerFilterController = that.getController("headerFilter"),
                currentColumn = headerFilterController.getCurrentColumn();
            $.each(columns, function(_, column) {
                var filter;
                if (currentColumn && currentColumn.index === column.index) {
                    return
                }
                if (allowHeaderFiltering(column) && column.calculateFilterExpression && commonUtils.isArray(column.filterValues) && column.filterValues.length) {
                    var filterValues = [],
                        isExclude = "exclude" === column.filterType;
                    $.each(column.filterValues, function(_, filterValue) {
                        if (commonUtils.isArray(filterValue)) {
                            filter = isExclude ? invertFilterExpression(filterValue) : filterValue
                        } else {
                            if (column.deserializeValue && "date" !== column.dataType && "number" !== column.dataType) {
                                filterValue = column.deserializeValue(filterValue)
                            }
                            filter = column.createFilterExpression(filterValue, isExclude ? "<>" : "=", "headerFilter")
                        }
                        if (filter) {
                            filter.columnIndex = column.index
                        }
                        filterValues.push(filter)
                    });
                    filterValues = gridCore.combineFilters(filterValues, isExclude ? "and" : "or");
                    filters.push(filterValues)
                }
            });
            return gridCore.combineFilters(filters)
        }
    };
    gridCore.registerModule("headerFilter", {
        defaultOptions: function() {
            return {
                headerFilter: {
                    visible: false,
                    width: 252,
                    height: 300,
                    texts: {
                        emptyValue: messageLocalization.format("dxDataGrid-headerFilterEmptyValue"),
                        ok: messageLocalization.format("dxDataGrid-headerFilterOK"),
                        cancel: messageLocalization.format("dxDataGrid-headerFilterCancel")
                    }
                }
            }
        },
        controllers: {
            headerFilter: exports.HeaderFilterController
        },
        views: {
            headerFilterView: headerFilterCore.HeaderFilterView
        },
        extenders: {
            controllers: {
                data: DataControllerFilterRowExtender
            },
            views: {
                columnHeadersView: ColumnHeadersViewHeaderFilterExtender,
                headerPanel: HeaderPanelHeaderFilterExtender
            }
        }
    })
});
