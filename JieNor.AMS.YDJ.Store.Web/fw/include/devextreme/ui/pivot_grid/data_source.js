/** 
 * DevExtreme (ui/pivot_grid/data_source.js)
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
        DataSource = require("../../data/data_source/data_source").DataSource,
        Store = require("../../data/abstract_store"),
        ArrayStore = require("../../data/array_store"),
        commonUtils = require("../../core/utils/common"),
        isDefined = commonUtils.isDefined,
        each = $.each,
        when = $.when,
        Class = require("../../core/class"),
        EventsMixin = require("../../core/events_mixin"),
        inflector = require("../../core/utils/inflector"),
        normalizeIndexes = require("../../core/utils/array").normalizeIndexes,
        localStore = require("./local_store"),
        xmlaStore = require("./xmla_store/xmla_store"),
        summaryDisplayModes = require("./ui.pivot_grid.summary_display_modes"),
        pivotGridUtils = require("./ui.pivot_grid.utils"),
        foreachTree = pivotGridUtils.foreachTree,
        foreachTreeAsync = pivotGridUtils.foreachTreeAsync,
        findField = pivotGridUtils.findField,
        formatValue = pivotGridUtils.formatValue,
        getCompareFunction = pivotGridUtils.getCompareFunction,
        createPath = pivotGridUtils.createPath,
        foreachDataLevel = pivotGridUtils.foreachDataLevel,
        setFieldProperty = pivotGridUtils.setFieldProperty,
        DESCRIPTION_NAME_BY_AREA = {
            row: "rows",
            column: "columns",
            data: "values",
            filter: "filters"
        },
        STATE_PROPERTIES = ["area", "areaIndex", "sortOrder", "filterType", "filterValues", "sortBy", "sortBySummaryField", "sortBySummaryPath", "expanded", "summaryType", "summaryDisplayMode"],
        CALCULATED_PROPERTIES = ["format", "selector", "customizeText", "caption"];

    function createCaption(field) {
        var caption = field.dataField || field.groupName || "",
            summaryType = (field.summaryType || "").toLowerCase();
        if (commonUtils.isString(field.groupInterval)) {
            caption += "_" + field.groupInterval
        }
        if (summaryType && "custom" !== summaryType) {
            summaryType = summaryType.replace(/^./, summaryType[0].toUpperCase());
            if (caption.length) {
                summaryType = " (" + summaryType + ")"
            }
        } else {
            summaryType = ""
        }
        return inflector.titleize(caption) + summaryType
    }

    function resetFieldState(field, properties) {
        var initialProperties = field._initProperties || {};
        $.each(properties, function(_, prop) {
            if (initialProperties.hasOwnProperty(prop)) {
                field[prop] = initialProperties[prop]
            }
        })
    }

    function updateCalculatedFieldProperties(field, calculatedProperties) {
        resetFieldState(field, calculatedProperties);
        if (!isDefined(field.caption)) {
            setFieldProperty(field, "caption", createCaption(field))
        }
    }

    function areExpressionsUsed(descriptions) {
        var expressionsUsed = false;
        each(descriptions.values, function(_, field) {
            if (field.summaryDisplayMode || field.calculateSummaryValue || field.runningTotal) {
                expressionsUsed = true;
                return false
            }
        });
        return expressionsUsed
    }
    module.exports = Class.inherit(function() {
        var findHeaderItem = function(headerItems, path) {
            if (headerItems._cacheByPath) {
                return headerItems._cacheByPath[path.join(".")] || null
            }
        };
        var getHeaderItemsLastIndex = function(headerItems, grandTotalIndex) {
            var i, headerItem, lastIndex = -1;
            if (headerItems) {
                for (i = 0; i < headerItems.length; i++) {
                    headerItem = headerItems[i];
                    lastIndex = Math.max(lastIndex, headerItem.index);
                    if (headerItem.children) {
                        lastIndex = Math.max(lastIndex, getHeaderItemsLastIndex(headerItem.children))
                    } else {
                        if (headerItem.collapsedChildren) {
                            lastIndex = Math.max(lastIndex, getHeaderItemsLastIndex(headerItem.collapsedChildren))
                        }
                    }
                }
            }
            if (isDefined(grandTotalIndex)) {
                lastIndex = Math.max(lastIndex, grandTotalIndex)
            }
            return lastIndex
        };
        var updateHeaderItemChildren = function(headerItems, headerItem, children, grandTotalIndex) {
            var index, applyingHeaderItemsCount = getHeaderItemsLastIndex(children) + 1,
                emptyIndex = getHeaderItemsLastIndex(headerItems, grandTotalIndex) + 1,
                applyingItemIndexesToCurrent = [],
                d = $.Deferred();
            for (index = 0; index < applyingHeaderItemsCount; index++) {
                applyingItemIndexesToCurrent[index] = emptyIndex++
            }
            headerItem.children = children;
            when(foreachTreeAsync(headerItem.children, function(items) {
                items[0].index = applyingItemIndexesToCurrent[items[0].index]
            })).done(function() {
                d.resolve(applyingItemIndexesToCurrent)
            });
            return d
        };
        var updateHeaderItems = function(headerItems, newHeaderItems) {
            var d = $.Deferred();
            var applyingItemIndexesToCurrent = [];
            when(foreachTreeAsync(headerItems, function(items) {
                delete items[0].collapsedChildren
            })).done(function() {
                when(foreachTreeAsync(newHeaderItems, function(items) {
                    var headerItem = findHeaderItem(headerItems, createPath(items));
                    if (headerItem) {
                        applyingItemIndexesToCurrent[items[0].index] = headerItem.index
                    }
                })).done(function() {
                    d.resolve(applyingItemIndexesToCurrent)
                })
            });
            return d
        };
        var updateDataSourceCells = function(dataSource, newDataSourceCells, newRowItemIndexesToCurrent, newColumnItemIndexesToCurrent) {
            var newRowIndex, newColumnIndex, newRowCells, newCell, rowIndex, columnIndex, dataSourceCells = dataSource.values;
            if (newDataSourceCells) {
                for (newRowIndex = 0; newRowIndex <= newDataSourceCells.length; newRowIndex++) {
                    newRowCells = newDataSourceCells[newRowIndex];
                    rowIndex = newRowItemIndexesToCurrent[newRowIndex];
                    if (!isDefined(rowIndex)) {
                        rowIndex = dataSource.grandTotalRowIndex
                    }
                    if (newRowCells && isDefined(rowIndex)) {
                        if (!dataSourceCells[rowIndex]) {
                            dataSourceCells[rowIndex] = []
                        }
                        for (newColumnIndex = 0; newColumnIndex <= newRowCells.length; newColumnIndex++) {
                            newCell = newRowCells[newColumnIndex];
                            columnIndex = newColumnItemIndexesToCurrent[newColumnIndex];
                            if (!isDefined(columnIndex)) {
                                columnIndex = dataSource.grandTotalColumnIndex
                            }
                            if (isDefined(newCell) && isDefined(columnIndex)) {
                                dataSourceCells[rowIndex][columnIndex] = newCell
                            }
                        }
                    }
                }
            }
        };

        function createStore(dataSourceOptions) {
            var store, storeOptions;
            if ($.isPlainObject(dataSourceOptions) && dataSourceOptions.load) {
                store = new localStore.LocalStore(dataSourceOptions)
            } else {
                if (dataSourceOptions && !dataSourceOptions.store) {
                    dataSourceOptions = {
                        store: dataSourceOptions
                    }
                }
                storeOptions = dataSourceOptions.store;
                if ("xmla" === storeOptions.type) {
                    store = new xmlaStore.XmlaStore(storeOptions)
                } else {
                    if ($.isPlainObject(storeOptions) && storeOptions.type || storeOptions instanceof Store || $.isArray(storeOptions)) {
                        store = new localStore.LocalStore(dataSourceOptions)
                    } else {
                        if (storeOptions instanceof Class) {
                            store = storeOptions
                        }
                    }
                }
            }
            return store
        }

        function getExpandedPaths(dataSource, loadOptions, dimensionName) {
            var result = [],
                fields = loadOptions && loadOptions[dimensionName] || [];
            foreachTree(dataSource[dimensionName], function(items) {
                var item = items[0],
                    path = createPath(items);
                if (item.children && fields[path.length - 1] && !fields[path.length - 1].expanded) {
                    path.length < fields.length && result.push(path.slice())
                }
            }, true);
            return result
        }

        function setFieldProperties(field, srcField, skipInitPropertySave, properties) {
            if (srcField) {
                each(properties, function(_, name) {
                    if (skipInitPropertySave) {
                        field[name] = srcField[name]
                    } else {
                        if (("summaryType" === name || "summaryDisplayMode" === name) && void 0 === srcField[name]) {
                            return
                        }
                        setFieldProperty(field, name, srcField[name])
                    }
                })
            } else {
                resetFieldState(field, properties)
            }
            return field
        }

        function getFieldsState(fields, properties) {
            var result = [];
            each(fields, function(_, field) {
                result.push(setFieldProperties({
                    dataField: field.dataField,
                    name: field.name
                }, field, true, properties))
            });
            return result
        }

        function getFieldStateId(field) {
            if (field.name) {
                return field.name
            }
            return field.dataField + ""
        }

        function getFieldsById(fields, id) {
            var result = [];
            each(fields || [], function(_, field) {
                if (getFieldStateId(field) === id) {
                    result.push(field)
                }
            });
            return result
        }

        function setFieldsStateCore(stateFields, fields) {
            stateFields = stateFields || [];
            each(fields, function(index, field) {
                setFieldProperties(field, stateFields[index], false, STATE_PROPERTIES);
                updateCalculatedFieldProperties(field, CALCULATED_PROPERTIES)
            });
            return fields
        }

        function setFieldsState(stateFields, fields) {
            stateFields = stateFields || [];
            var id, fieldsById = {};
            each(fields, function(_, field) {
                id = getFieldStateId(field);
                if (!fieldsById[id]) {
                    fieldsById[id] = getFieldsById(fields, getFieldStateId(field))
                }
            });
            each(fieldsById, function(id, fields) {
                setFieldsStateCore(getFieldsById(stateFields, id), fields)
            });
            return fields
        }

        function getFieldsByGroup(fields, groupingField) {
            return $.map(fields, function(field) {
                if (field.groupName === groupingField.groupName && commonUtils.isNumber(field.groupIndex) && false !== field.visible) {
                    return $.extend(field, {
                        areaIndex: groupingField.areaIndex,
                        area: groupingField.area,
                        expanded: isDefined(field.expanded) ? field.expanded : groupingField.expanded,
                        dataField: field.dataField || groupingField.dataField,
                        dataType: field.dataType || groupingField.dataType,
                        sortBy: field.sortBy || groupingField.sortBy,
                        sortOrder: field.sortOrder || groupingField.sortOrder,
                        sortBySummaryField: field.sortBySummaryField || groupingField.sortBySummaryField,
                        sortBySummaryPath: field.sortBySummaryPath || groupingField.sortBySummaryPath,
                        visible: field.visible || groupingField.visible,
                        showTotals: isDefined(field.showTotals) ? field.showTotals : groupingField.showTotals,
                        showGrandTotals: isDefined(field.showGrandTotals) ? field.showGrandTotals : groupingField.showGrandTotals
                    })
                }
                return null
            }).sort(function(a, b) {
                return a.groupIndex - b.groupIndex
            })
        }

        function sortFieldsByAreaIndex(fields) {
            fields.sort(function(field1, field2) {
                return field1.areaIndex - field2.areaIndex
            })
        }

        function isAreaField(field, area) {
            return field.area === area && !isDefined(field.groupIndex) && false !== field.visible
        }

        function getFieldId(field, retrieveFieldsOptionValue) {
            var groupName = field.groupName || "";
            return (field.dataField || groupName) + (field.groupInterval ? groupName + field.groupInterval : "NOGROUP") + (retrieveFieldsOptionValue ? "" : groupName)
        }

        function mergeFields(fields, storeFields, retrieveFieldsOptionValue) {
            var result = [],
                fieldsDictionary = {},
                removedFields = {},
                mergedGroups = [],
                dataTypes = getFieldsDataType(fields);
            if (storeFields) {
                each(storeFields, function(_, field) {
                    fieldsDictionary[getFieldId(field, retrieveFieldsOptionValue)] = field
                });
                each(fields, function(_, field) {
                    var mergedField, fieldKey = getFieldId(field, retrieveFieldsOptionValue),
                        storeField = fieldsDictionary[fieldKey] || removedFields[fieldKey];
                    if (storeField) {
                        mergedField = $.extend({}, storeField, field)
                    } else {
                        fieldsDictionary[fieldKey] = mergedField = field
                    }
                    $.extend(mergedField, {
                        dataType: dataTypes[field.dataField]
                    });
                    delete fieldsDictionary[fieldKey];
                    removedFields[fieldKey] = storeField;
                    result.push(mergedField)
                });
                if (retrieveFieldsOptionValue) {
                    each(fieldsDictionary, function(_, field) {
                        result.push(field)
                    })
                }
            } else {
                result = fields
            }
            result.push.apply(result, mergedGroups);
            return result
        }

        function getFieldsDataType(fields) {
            var result = {};
            each(fields, function(_, field) {
                result[field.dataField] = result[field.dataField] || field.dataType
            });
            return result
        }

        function getFields(that) {
            var mergedFields, result = $.Deferred(),
                store = that._store,
                storeFields = store && store.getFields(getFieldsDataType(that._fields));
            when(storeFields).done(function(storeFields) {
                that._storeFields = storeFields;
                mergedFields = mergeFields(that._fields, storeFields, that._retrieveFields);
                result.resolve(mergedFields)
            }).fail(function() {
                result.resolve(that._fields)
            });
            return result
        }

        function getSliceIndex(items, path) {
            var index = null,
                pathValue = (path || []).join(".");
            if (pathValue.length) {
                foreachTree(items, function(items) {
                    var item = items[0],
                        itemPath = createPath(items).join("."),
                        textPath = $.map(items, function(item) {
                            return item.text
                        }).reverse().join(".");
                    if (pathValue === itemPath || item.key && textPath === pathValue) {
                        index = items[0].index;
                        return false
                    }
                })
            }
            return index
        }

        function getFieldSummaryValueSelector(field, dataSource, loadOptions, dimensionName) {
            var values = dataSource.values,
                sortBySummaryFieldIndex = findField(loadOptions.values, field.sortBySummaryField),
                areRows = "rows" === dimensionName,
                sortByDimension = areRows ? dataSource.columns : dataSource.rows,
                grandTotalIndex = areRows ? dataSource.grandTotalRowIndex : dataSource.grandTotalColumnIndex,
                sortBySummaryPath = field.sortBySummaryPath || [],
                sliceIndex = sortBySummaryPath.length ? getSliceIndex(sortByDimension, sortBySummaryPath) : grandTotalIndex;
            if (values && values.length && sortBySummaryFieldIndex >= 0 && isDefined(sliceIndex)) {
                return function(field) {
                    var rowIndex = areRows ? field.index : sliceIndex,
                        columnIndex = areRows ? sliceIndex : field.index;
                    return ((values[rowIndex] || [
                        []
                    ])[columnIndex] || [])[sortBySummaryFieldIndex] || null
                }
            }
        }

        function getSortingMethod(field, dataSource, loadOptions, dimensionName, getAscOrder) {
            var sortOrder = getAscOrder ? "asc" : field.sortOrder,
                sortBy = getAscOrder ? "value" : "displayText" === field.sortBy ? "text" : "value",
                defaultCompare = field.sortingMethod || getCompareFunction(function(item) {
                    return item[sortBy]
                }),
                summaryValueSelector = !getAscOrder && getFieldSummaryValueSelector(field, dataSource, loadOptions, dimensionName),
                summaryCompare = summaryValueSelector && getCompareFunction(summaryValueSelector),
                sortingMethod = function(a, b) {
                    var result = summaryCompare && summaryCompare(a, b) || 0;
                    if (0 === result) {
                        result = defaultCompare(a, b)
                    }
                    return "desc" === sortOrder ? -result : result
                };
            return sortingMethod
        }

        function sortDimension(dataSource, loadOptions, dimensionName, getAscOrder) {
            var fields = loadOptions[dimensionName] || [],
                baseIndex = loadOptions.headerName === dimensionName ? loadOptions.path.length : 0,
                sortingMethodByLevel = [];
            foreachDataLevel(dataSource[dimensionName], function(item, index) {
                var field = fields[index] || {},
                    sortingMethod = sortingMethodByLevel[index] = sortingMethodByLevel[index] || getSortingMethod(field, dataSource, loadOptions, dimensionName, getAscOrder);
                item.sort(sortingMethod)
            }, baseIndex)
        }

        function sort(loadOptions, dataSource, getAscOrder) {
            sortDimension(dataSource, loadOptions, "rows", getAscOrder);
            sortDimension(dataSource, loadOptions, "columns", getAscOrder)
        }

        function formatHeaderItems(data, loadOptions, headerName) {
            return foreachTreeAsync(data[headerName], function(items) {
                var item = items[0];
                item.text = item.text || formatValue(item.value, loadOptions[headerName][createPath(items).length - 1])
            })
        }

        function formatHeaders(loadOptions, data) {
            return when(formatHeaderItems(data, loadOptions, "columns"), formatHeaderItems(data, loadOptions, "rows"))
        }

        function updateCache(headerItems) {
            var d = $.Deferred();
            var cacheByPath = {};
            when(foreachTreeAsync(headerItems, function(items) {
                var path = createPath(items).join(".");
                cacheByPath[path] = items[0]
            })).done(d.resolve);
            headerItems._cacheByPath = cacheByPath;
            return d
        }
        return {
            ctor: function(options) {
                options = options || {};
                var that = this,
                    store = createStore(options);
                that._store = store;
                that._data = {
                    rows: [],
                    columns: [],
                    values: []
                };
                that._loadingCount = 0;
                each(["changed", "loadError", "loadingChanged", "fieldsPrepared", "expandValueChanging"], $.proxy(function(_, eventName) {
                    var optionName = "on" + eventName[0].toUpperCase() + eventName.slice(1);
                    if (options.hasOwnProperty(optionName)) {
                        this.on(eventName, options[optionName])
                    }
                }, this));
                that._retrieveFields = isDefined(options.retrieveFields) ? options.retrieveFields : true;
                that._fields = options.fields || [];
                that._descriptions = options.descriptions ? $.extend(that._createDescriptions(), options.descriptions) : void 0;
                if (!store) {
                    $.extend(true, that._data, options.store || options)
                }
            },
            getData: function() {
                return this._data
            },
            getAreaFields: function(area, collectGroups) {
                var descriptions, areaFields = [];
                if (collectGroups || "data" === area) {
                    each(this._fields, function() {
                        if (isAreaField(this, area)) {
                            areaFields.push(this)
                        }
                    });
                    sortFieldsByAreaIndex(areaFields)
                } else {
                    descriptions = this._descriptions || {};
                    areaFields = descriptions[DESCRIPTION_NAME_BY_AREA[area]] || []
                }
                return areaFields
            },
            fields: function(fields) {
                var that = this;
                if (fields) {
                    that._fields = mergeFields(fields, that._storeFields, that._retrieveFields);
                    that._fieldsPrepared(that._fields)
                }
                return that._fields
            },
            field: function(id, options) {
                var levels, that = this,
                    fields = that._fields,
                    field = fields && fields[commonUtils.isNumber(id) ? id : findField(fields, id)];
                if (field && options) {
                    each(options, function(optionName, optionValue) {
                        var isInitialization = $.inArray(optionName, STATE_PROPERTIES) < 0;
                        setFieldProperty(field, optionName, optionValue, isInitialization);
                        if ("sortOrder" === optionName) {
                            levels = field.levels || [];
                            for (var i = 0; i < levels.length; i++) {
                                levels[i][optionName] = optionValue
                            }
                        }
                    });
                    updateCalculatedFieldProperties(field, CALCULATED_PROPERTIES);
                    that._descriptions = that._createDescriptions(field)
                }
                return field
            },
            getFieldValues: function(index) {
                var that = this,
                    field = this._fields && this._fields[index],
                    store = this.store(),
                    loadFields = [],
                    loadOptions = {
                        columns: loadFields,
                        rows: [],
                        values: this.getAreaFields("data"),
                        filters: []
                    },
                    d = $.Deferred();
                if (field && store) {
                    each(field.levels || [field], function() {
                        loadFields.push($.extend({}, this, {
                            expanded: true,
                            filterValues: null,
                            sortOrder: "asc",
                            sortBySummaryField: null
                        }))
                    });
                    store.load(loadOptions).done(function(data) {
                        formatHeaders(loadOptions, data);
                        that._sort(loadOptions, data);
                        d.resolve(data.columns)
                    }).fail(d)
                } else {
                    d.reject()
                }
                return d
            },
            reload: function() {
                return this.load({
                    reload: true
                })
            },
            filter: function() {
                var store = this._store;
                return store.filter.apply(store, arguments)
            },
            load: function(options) {
                var that = this,
                    d = $.Deferred();
                options = options || {};
                that._changeLoadingCount(1);
                d.progress(function(progress) {
                    that._changeLoadingCount(0, .8 * progress)
                });
                d.fail(function(e) {
                    that.fireEvent("loadError", [e])
                }).always(function() {
                    that._changeLoadingCount(-1)
                });

                function loadTask() {
                    that._delayedLoadTask = void 0;
                    if (!that._descriptions) {
                        when(getFields(that)).done(function(fields) {
                            that._fieldsPrepared(fields);
                            that._loadCore(options, d)
                        }).fail(d.reject).fail(that._loadErrorHandler)
                    } else {
                        that._loadCore(options, d)
                    }
                }
                if (that.store()) {
                    that._delayedLoadTask = commonUtils.executeAsync(loadTask)
                } else {
                    loadTask()
                }
                return d
            },
            createDrillDownDataSource: function(params) {
                function createCustomStoreMethod(methodName) {
                    return function(options) {
                        var d;
                        if (arrayStore) {
                            d = arrayStore[methodName](options)
                        } else {
                            d = $.Deferred();
                            when(items).done(function(data) {
                                arrayStore = new ArrayStore(data);
                                arrayStore[methodName](options).done(d.resolve).fail(d.reject)
                            }).fail(d.reject)
                        }
                        return d
                    }
                }
                var arrayStore, items = this._store.getDrillDownItems(this._descriptions, params),
                    dataSource = new DataSource({
                        load: createCustomStoreMethod("load"),
                        totalCount: createCustomStoreMethod("totalCount"),
                        key: this._store.key()
                    });
                return dataSource
            },
            _createDescriptions: function(currentField) {
                var that = this,
                    fields = that.fields(),
                    descriptions = {
                        rows: [],
                        columns: [],
                        values: [],
                        filters: []
                    };
                each(["row", "column", "data", "filter"], function(_, areaName) {
                    var areaFields = [];
                    each(fields, function(index, field) {
                        if (isAreaField(field, areaName)) {
                            areaFields.push(field)
                        }
                    });
                    normalizeIndexes(areaFields, "areaIndex", currentField)
                });
                each(fields || [], function(_, field) {
                    var descriptionName = DESCRIPTION_NAME_BY_AREA[field.area],
                        dimension = descriptions[descriptionName],
                        groupName = field.groupName;
                    if (groupName && !commonUtils.isNumber(field.groupIndex)) {
                        field.levels = getFieldsByGroup(fields, field)
                    }
                    if (!dimension || groupName && commonUtils.isNumber(field.groupIndex) || false === field.visible && "data" !== field.area && "filter" !== field.area) {
                        return
                    }
                    if (field.levels && dimension !== descriptions.filters && dimension !== descriptions.values) {
                        dimension.push.apply(dimension, field.levels);
                        if (field.filterValues && field.filterValues.length) {
                            descriptions.filters.push(field)
                        }
                    } else {
                        dimension.push(field)
                    }
                });
                each(descriptions, function(_, fields) {
                    sortFieldsByAreaIndex(fields)
                });
                var indices = {};
                each(descriptions.values, function(_, field) {
                    var expression = field.calculateSummaryValue;
                    if (commonUtils.isFunction(expression)) {
                        var summaryCell = summaryDisplayModes.createMockSummaryCell(descriptions, fields, indices);
                        expression(summaryCell)
                    }
                });
                return descriptions
            },
            _fieldsPrepared: function(fields) {
                var that = this;
                that._fields = fields;
                each(fields, function(index, field) {
                    field.index = index;
                    updateCalculatedFieldProperties(field, CALCULATED_PROPERTIES.concat(["allowSorting", "allowSortingBySummary", "allowFiltering", "allowExpandAll"]))
                });
                var currentFieldState = getFieldsState(fields, ["caption"]);
                that.fireEvent("fieldsPrepared", [fields]);
                for (var i = 0; i < fields.length; i++) {
                    if (fields[i].caption !== currentFieldState[i].caption) {
                        setFieldProperty(fields[i], "caption", fields[i].caption, true)
                    }
                }
                that._descriptions = that._createDescriptions()
            },
            isLoading: function() {
                return this._loadingCount > 0
            },
            state: function(state) {
                var that = this;
                if (arguments.length) {
                    state = $.extend({
                        rowExpandedPaths: [],
                        columnExpandedPaths: []
                    }, state);
                    if (!that._descriptions) {
                        that._changeLoadingCount(1);
                        when(getFields(that)).done(function(fields) {
                            that._fields = setFieldsState(state.fields, fields);
                            that._fieldsPrepared(fields);
                            that.load(state)
                        }).always(function() {
                            that._changeLoadingCount(-1)
                        })
                    } else {
                        that._fields = setFieldsState(state.fields, that._fields);
                        that._descriptions = that._createDescriptions();
                        that.load(state)
                    }
                } else {
                    return {
                        fields: getFieldsState(that._fields, STATE_PROPERTIES),
                        columnExpandedPaths: getExpandedPaths(that._data, that._descriptions, "columns"),
                        rowExpandedPaths: getExpandedPaths(that._data, that._descriptions, "rows")
                    }
                }
            },
            _changeLoadingCount: function(increment, progress) {
                var newLoading, oldLoading = this.isLoading();
                this._loadingCount += increment;
                newLoading = this.isLoading();
                if (oldLoading ^ newLoading || progress) {
                    this.fireEvent("loadingChanged", [newLoading, progress])
                }
            },
            _loadCore: function(options, deferred) {
                var that = this,
                    store = this._store,
                    descriptions = this._descriptions,
                    headerName = DESCRIPTION_NAME_BY_AREA[options.area];
                options = options || {};
                if (store) {
                    $.extend(options, descriptions);
                    options.columnExpandedPaths = options.columnExpandedPaths || getExpandedPaths(this._data, options, "columns");
                    options.rowExpandedPaths = options.rowExpandedPaths || getExpandedPaths(this._data, options, "rows");
                    if (headerName) {
                        options.headerName = headerName
                    }
                    that._changeLoadingCount(1);
                    deferred.always(function() {
                        that._changeLoadingCount(-1)
                    });
                    when(store.load(options)).progress(deferred.notify).done(function(data) {
                        if (options.path) {
                            that.applyPartialDataSource(options.area, options.path, data, deferred)
                        } else {
                            $.extend(that._data, data);
                            that._update(deferred)
                        }
                    }).fail(deferred.reject)
                } else {
                    that._update(deferred)
                }
            },
            _sort: function(descriptions, data, getAscOrder) {
                var store = this._store;
                if (store) {
                    sort(descriptions, data, getAscOrder)
                }
            },
            _update: function(deferred) {
                var that = this,
                    descriptions = that._descriptions,
                    loadedData = that._data,
                    expressionsUsed = areExpressionsUsed(descriptions);
                when(formatHeaders(descriptions, loadedData), updateCache(loadedData.rows), updateCache(loadedData.columns)).done(function() {
                    if (expressionsUsed) {
                        that._sort(descriptions, loadedData, expressionsUsed);
                        summaryDisplayModes.applyDisplaySummaryMode(descriptions, loadedData)
                    }
                    that._sort(descriptions, loadedData);
                    that._data = loadedData;
                    when(deferred).done(function() {
                        that.fireEvent("changed");
                        if (isDefined(that._data.grandTotalRowIndex)) {
                            loadedData.grandTotalRowIndex = that._data.grandTotalRowIndex
                        }
                        if (isDefined(that._data.grandTotalColumnIndex)) {
                            loadedData.grandTotalColumnIndex = that._data.grandTotalColumnIndex
                        }
                    });
                    deferred && deferred.resolve(that._data)
                })
            },
            store: function() {
                return this._store
            },
            collapseHeaderItem: function(area, path) {
                var that = this,
                    headerItems = "column" === area ? that._data.columns : that._data.rows,
                    headerItem = findHeaderItem(headerItems, path),
                    field = that.getAreaFields(area)[path.length - 1];
                if (headerItem && headerItem.children) {
                    that.fireEvent("expandValueChanging", [{
                        area: area,
                        path: path,
                        expanded: false
                    }]);
                    if (field) {
                        field.expanded = false
                    }
                    headerItem.collapsedChildren = headerItem.children;
                    delete headerItem.children;
                    that._update();
                    return true
                }
                return false
            },
            collapseAll: function(id) {
                var dataChanged = false,
                    field = this.field(id) || {},
                    areaOffset = $.inArray(field, this.getAreaFields(field.area));
                field.expanded = false;
                foreachTree(this._data[field.area + "s"], function(items) {
                    var item = items[0],
                        path = createPath(items);
                    if (item && item.children && areaOffset === path.length - 1) {
                        item.collapsedChildren = item.children;
                        delete item.children;
                        dataChanged = true
                    }
                }, true);
                dataChanged && this._update()
            },
            expandAll: function(id) {
                var field = this.field(id);
                if (field && field.area) {
                    field.expanded = true;
                    this.load()
                }
            },
            expandHeaderItem: function(area, path) {
                var hasCache, options, that = this,
                    headerItems = "column" === area ? that._data.columns : that._data.rows,
                    headerItem = findHeaderItem(headerItems, path);
                if (headerItem && !headerItem.children) {
                    hasCache = !!headerItem.collapsedChildren;
                    options = {
                        area: area,
                        path: path,
                        expanded: true,
                        needExpandData: !hasCache
                    };
                    that.fireEvent("expandValueChanging", [options]);
                    if (hasCache) {
                        headerItem.children = headerItem.collapsedChildren;
                        delete headerItem.collapsedChildren;
                        that._update()
                    } else {
                        that.load(options)
                    }
                    return hasCache
                }
                return false
            },
            applyPartialDataSource: function(area, path, dataSource, deferred) {
                var headerItem, newRowItemIndexesToCurrent, newColumnItemIndexesToCurrent, that = this,
                    loadedData = that._data,
                    headerItems = "column" === area ? loadedData.columns : loadedData.rows;
                if (dataSource && dataSource.values) {
                    dataSource.rows = dataSource.rows || [];
                    dataSource.columns = dataSource.columns || [];
                    headerItem = findHeaderItem(headerItems, path);
                    if (headerItem) {
                        if ("column" === area) {
                            newColumnItemIndexesToCurrent = updateHeaderItemChildren(headerItems, headerItem, dataSource.columns, loadedData.grandTotalColumnIndex);
                            newRowItemIndexesToCurrent = updateHeaderItems(loadedData.rows, dataSource.rows)
                        } else {
                            newRowItemIndexesToCurrent = updateHeaderItemChildren(headerItems, headerItem, dataSource.rows, loadedData.grandTotalRowIndex);
                            newColumnItemIndexesToCurrent = updateHeaderItems(loadedData.columns, dataSource.columns)
                        }
                        when(newRowItemIndexesToCurrent, newColumnItemIndexesToCurrent).done(function(newRowItemIndexesToCurrent, newColumnItemIndexesToCurrent) {
                            updateDataSourceCells(loadedData, dataSource.values, newRowItemIndexesToCurrent, newColumnItemIndexesToCurrent);
                            that._update(deferred)
                        })
                    }
                }
            },
            dispose: function() {
                var that = this,
                    delayedLoadTask = that._delayedLoadTask;
                this._disposeEvents();
                if (delayedLoadTask) {
                    delayedLoadTask.abort()
                }
                this._isDisposed = true
            },
            isDisposed: function() {
                return !!this._isDisposed
            }
        }
    }()).include(EventsMixin)
});
