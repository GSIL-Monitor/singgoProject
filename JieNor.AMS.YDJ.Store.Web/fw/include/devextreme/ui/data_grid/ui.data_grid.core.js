/** 
 * DevExtreme (ui/data_grid/ui.data_grid.core.js)
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
        toComparable = require("../../core/utils/data").toComparable,
        stringUtils = require("../../core/utils/string"),
        modules = require("../grid_core/ui.grid_core.modules"),
        dataUtils = require("../../data/utils"),
        formatHelper = require("../../format_helper");
    var DATE_INTERVAL_SELECTORS = {
            year: function(value) {
                return value && value.getFullYear()
            },
            month: function(value) {
                return value && value.getMonth() + 1
            },
            day: function(value) {
                return value && value.getDate()
            },
            quarter: function(value) {
                return value && Math.floor(value.getMonth() / 3) + 1
            },
            hour: function(value) {
                return value && value.getHours()
            },
            minute: function(value) {
                return value && value.getMinutes()
            },
            second: function(value) {
                return value && value.getSeconds()
            }
        },
        DEFAULT_DATE_INTERVAL = ["year", "month", "day"];
    $.extend(exports, modules, function() {
        var getIntervalSelector = function() {
            var groupInterval, nameIntervalSelector, data = arguments[1],
                value = this.calculateCellValue(data);
            if (!commonUtils.isDefined(value)) {
                return null
            } else {
                if ("date" === this.dataType) {
                    nameIntervalSelector = arguments[0];
                    return DATE_INTERVAL_SELECTORS[nameIntervalSelector](value)
                } else {
                    if ("number" === this.dataType) {
                        groupInterval = arguments[0];
                        return Math.floor(Number(value) / groupInterval) * groupInterval
                    }
                }
            }
        };
        var getDateValues = function(dateValue) {
            if (commonUtils.isDate(dateValue)) {
                return [dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), dateValue.getHours(), dateValue.getMinutes(), dateValue.getSeconds()]
            }
            return $.map(("" + dateValue).split("/"), function(value, index) {
                return 1 === index ? Number(value) - 1 : Number(value)
            })
        };
        var getFilterExpressionForDate = function(filterValue, selectedFilterOperation, target) {
            var dateStart, dateEnd, column = this,
                selector = getFilterSelector(column, target),
                values = getDateValues(filterValue),
                dateInterval = exports.getGroupInterval(column)[values.length - 1];
            switch (dateInterval) {
                case "year":
                    dateStart = new Date(values[0], 0, 1), dateEnd = new Date(values[0] + 1, 0, 1);
                    break;
                case "month":
                    dateStart = new Date(values[0], values[1], 1), dateEnd = new Date(values[0], values[1] + 1, 1);
                    break;
                case "quarter":
                    dateStart = new Date(values[0], 3 * values[1], 1), dateEnd = new Date(values[0], 3 * values[1] + 3, 1);
                    break;
                case "hour":
                    dateStart = new Date(values[0], values[1], values[2], values[3]), dateEnd = new Date(values[0], values[1], values[2], values[3] + 1);
                    break;
                case "minute":
                    dateStart = new Date(values[0], values[1], values[2], values[3], values[4]), dateEnd = new Date(values[0], values[1], values[2], values[3], values[4] + 1);
                    break;
                case "second":
                    dateStart = new Date(values[0], values[1], values[2], values[3], values[4], values[5]), dateEnd = new Date(values[0], values[1], values[2], values[3], values[4], values[5] + 1);
                    break;
                default:
                    dateStart = new Date(values[0], values[1], values[2]), dateEnd = new Date(values[0], values[1], values[2] + 1)
            }
            switch (selectedFilterOperation) {
                case "<":
                    return [selector, "<", dateStart];
                case "<=":
                    return [selector, "<", dateEnd];
                case ">":
                    return [selector, ">=", dateEnd];
                case ">=":
                    return [selector, ">=", dateStart];
                case "<>":
                    return [
                        [selector, "<", dateStart], "or", [selector, ">=", dateEnd]
                    ];
                default:
                    return [
                        [selector, ">=", dateStart], "and", [selector, "<", dateEnd]
                    ]
            }
        };
        var getFilterExpressionForNumber = function(filterValue, selectedFilterOperation, target) {
            var interval, startFilterValue, endFilterValue, column = this,
                selector = getFilterSelector(column, target),
                values = ("" + filterValue).split("/"),
                value = Number(values[values.length - 1]),
                isExclude = "exclude" === column.filterType,
                groupInterval = exports.getGroupInterval(column);
            if ("headerFilter" === target && groupInterval && commonUtils.isDefined(filterValue)) {
                interval = groupInterval[values.length - 1];
                startFilterValue = [selector, isExclude ? "<" : ">=", value];
                endFilterValue = [selector, isExclude ? ">=" : "<", value + interval];
                return [startFilterValue, isExclude ? "or" : "and", endFilterValue]
            }
            return [selector, selectedFilterOperation || "=", filterValue]
        };
        var getFilterSelector = function(column, target) {
            var selector = column.dataField || column.selector;
            if ("search" === target) {
                selector = column.displayField || column.calculateDisplayValue || selector
            }
            return selector
        };
        var getFilterExpressionByRange = function(filterValue, selectedFilterOperation, target) {
            var column = this,
                dataField = column.dataField;
            if (commonUtils.isArray(filterValue) && commonUtils.isDefined(filterValue[0]) && commonUtils.isDefined(filterValue[1])) {
                return [
                    [dataField, ">=", filterValue[0]], "and", [dataField, "<=", filterValue[1]]
                ]
            }
        };
        return {
            formatValue: function(value, options) {
                var valueText = formatHelper.format(value, options.format, options.precision) || value && value.toString() || "",
                    formatObject = {
                        value: value,
                        valueText: options.getDisplayFormat ? options.getDisplayFormat(valueText) : valueText,
                        target: options.target || "row",
                        groupInterval: options.groupInterval
                    };
                return options.customizeText ? options.customizeText.call(options, formatObject) : formatObject.valueText
            },
            getFormatOptionsByColumn: function(column, target) {
                return {
                    format: column.format,
                    precision: column.precision,
                    getDisplayFormat: column.getDisplayFormat,
                    customizeText: column.customizeText,
                    target: target
                }
            },
            getDisplayValue: function(column, value, data, rowType) {
                if (column.displayValueMap && void 0 !== column.displayValueMap[value]) {
                    return column.displayValueMap[value]
                } else {
                    if (column.calculateDisplayValue && data && "group" !== rowType) {
                        return column.calculateDisplayValue(data)
                    } else {
                        if (column.lookup && !("group" === rowType && column.calculateGroupValue)) {
                            return column.lookup.calculateCellValue(value)
                        }
                    }
                }
                return value
            },
            getGroupRowSummaryText: function(summaryItems, summaryTexts) {
                var i, summaryItem, result = "(";
                for (i = 0; i < summaryItems.length; i++) {
                    summaryItem = summaryItems[i];
                    result += (i > 0 ? ", " : "") + exports.getSummaryText(summaryItem, summaryTexts)
                }
                return result += ")"
            },
            getSummaryText: function(summaryItem, summaryTexts) {
                var displayFormat = summaryItem.displayFormat || summaryItem.columnCaption && summaryTexts[summaryItem.summaryType + "OtherColumn"] || summaryTexts[summaryItem.summaryType];
                return this.formatValue(summaryItem.value, {
                    format: summaryItem.valueFormat,
                    precision: summaryItem.precision,
                    getDisplayFormat: function(valueText) {
                        return displayFormat ? stringUtils.format(displayFormat, valueText, summaryItem.columnCaption) : valueText
                    },
                    customizeText: summaryItem.customizeText
                })
            },
            getKeyHash: function(key) {
                if (commonUtils.isObject(key) || commonUtils.isArray(key)) {
                    try {
                        var keyHash = JSON.stringify(key);
                        return "{}" === keyHash ? key : keyHash
                    } catch (e) {
                        return key
                    }
                }
                return key
            },
            normalizeSortingInfo: function(sort) {
                sort = sort || [];
                var result, i;
                result = dataUtils.normalizeSortingInfo(sort);
                for (i = 0; i < sort.length; i++) {
                    if (sort && sort[i] && void 0 !== sort[i].isExpanded) {
                        result[i].isExpanded = sort[i].isExpanded
                    }
                    if (sort && sort[i] && void 0 !== sort[i].groupInterval) {
                        result[i].groupInterval = sort[i].groupInterval
                    }
                }
                return result
            },
            getFormatByDataType: function(dataType) {
                switch (dataType) {
                    case "date":
                        return "shortDate"
                }
            },
            defaultCalculateFilterExpression: function(filterValue, selectedFilterOperation, target) {
                var column = this,
                    selector = getFilterSelector(column, target),
                    isSearchByDisplayValue = column.calculateDisplayValue && "search" === target,
                    dataType = isSearchByDisplayValue && column.lookup && column.lookup.dataType || column.dataType,
                    filter = null;
                if ("headerFilter" === target && null === filterValue) {
                    filter = [selector, selectedFilterOperation || "=", null];
                    if ("string" === dataType) {
                        filter = [filter, "=" === selectedFilterOperation ? "or" : "and", [selector, selectedFilterOperation || "=", ""]]
                    }
                } else {
                    if ("string" === dataType && (!column.lookup || isSearchByDisplayValue)) {
                        filter = [selector, selectedFilterOperation || "contains", filterValue]
                    } else {
                        if ("between" === selectedFilterOperation) {
                            return getFilterExpressionByRange.apply(column, arguments)
                        } else {
                            if ("date" === dataType && commonUtils.isDefined(filterValue)) {
                                return getFilterExpressionForDate.apply(column, arguments)
                            } else {
                                if ("number" === dataType) {
                                    return getFilterExpressionForNumber.apply(column, arguments)
                                } else {
                                    if ("object" !== dataType) {
                                        filter = [selector, selectedFilterOperation || "=", filterValue]
                                    }
                                }
                            }
                        }
                    }
                }
                return filter
            },
            getHeaderFilterGroupParameters: function(column, remoteGrouping) {
                var result = [],
                    dataField = column.dataField || column.name,
                    groupInterval = this.getGroupInterval(column);
                if (column.calculateGroupValue) {
                    return remoteGrouping ? [{
                        selector: column.calculateGroupValue,
                        isExpanded: false
                    }] : $.proxy(column.calculateGroupValue, column)
                }
                if (groupInterval) {
                    $.each(groupInterval, function(index, interval) {
                        result.push(remoteGrouping ? {
                            selector: dataField,
                            groupInterval: interval,
                            isExpanded: false
                        } : $.proxy(getIntervalSelector, column, interval))
                    });
                    return result
                }
                return remoteGrouping ? [{
                    selector: dataField,
                    isExpanded: false
                }] : function(data) {
                    var result = column.calculateCellValue(data);
                    if (void 0 === result || "" === result) {
                        result = null
                    }
                    return result
                }
            },
            getGroupInterval: function(column) {
                var index, result = [],
                    dateIntervals = ["year", "month", "day", "hour", "minute", "second"],
                    groupInterval = column.headerFilter && column.headerFilter.groupInterval,
                    interval = "quarter" === groupInterval ? "month" : groupInterval;
                if ("date" === column.dataType) {
                    result = DEFAULT_DATE_INTERVAL;
                    index = $.inArray(interval, dateIntervals);
                    if (index >= 0) {
                        result = dateIntervals.slice(0, index);
                        result.push(groupInterval);
                        return result
                    }
                    return result
                } else {
                    if (commonUtils.isDefined(groupInterval)) {
                        return commonUtils.isArray(groupInterval) ? groupInterval : [groupInterval]
                    }
                }
            },
            checkChanges: function(changes, changeNames) {
                var i, changesWithChangeNamesCount = 0;
                for (i = 0; i < changeNames.length; i++) {
                    if (changes[changeNames[i]]) {
                        changesWithChangeNamesCount++
                    }
                }
                return changes.length && changes.length === changesWithChangeNamesCount
            },
            equalSortParameters: function(sortParameters1, sortParameters2, ignoreIsExpanded) {
                var i;
                sortParameters1 = exports.normalizeSortingInfo(sortParameters1);
                sortParameters2 = exports.normalizeSortingInfo(sortParameters2);
                if ($.isArray(sortParameters1) && $.isArray(sortParameters2)) {
                    if (sortParameters1.length !== sortParameters2.length) {
                        return false
                    } else {
                        for (i = 0; i < sortParameters1.length; i++) {
                            if (sortParameters1[i].selector !== sortParameters2[i].selector || sortParameters1[i].desc !== sortParameters2[i].desc || sortParameters1[i].groupInterval !== sortParameters2[i].groupInterval || !ignoreIsExpanded && Boolean(sortParameters1[i].isExpanded) !== Boolean(sortParameters2[i].isExpanded)) {
                                return false
                            }
                        }
                    }
                    return true
                } else {
                    return (!sortParameters1 || !sortParameters1.length) === (!sortParameters2 || !sortParameters2.length)
                }
            },
            equalFilterParameters: function(filter1, filter2) {
                var i;
                if ($.isArray(filter1) && $.isArray(filter2)) {
                    if (filter1.length !== filter2.length) {
                        return false
                    } else {
                        for (i = 0; i < filter1.length; i++) {
                            if (!exports.equalFilterParameters(filter1[i], filter2[i])) {
                                return false
                            }
                        }
                    }
                    return true
                } else {
                    if ($.isFunction(filter1) && filter1.columnIndex >= 0 && $.isFunction(filter2) && filter2.columnIndex >= 0) {
                        return filter1.columnIndex === filter2.columnIndex
                    } else {
                        return toComparable(filter1) == toComparable(filter2)
                    }
                }
            },
            proxyMethod: function(instance, methodName, defaultResult) {
                if (!instance[methodName]) {
                    instance[methodName] = function() {
                        var dataSource = this._dataSource;
                        return dataSource ? dataSource[methodName].apply(dataSource, arguments) : defaultResult
                    }
                }
            },
            combineFilters: function(filters, operation) {
                var i, resultFilter = [];
                operation = operation || "and";
                for (i = 0; i < filters.length; i++) {
                    if (!filters[i]) {
                        continue
                    }
                    if (resultFilter.length) {
                        resultFilter.push(operation)
                    }
                    resultFilter.push(filters[i])
                }
                if (1 === resultFilter.length) {
                    resultFilter = resultFilter[0]
                }
                if (resultFilter.length) {
                    return resultFilter
                }
            },
            getPointsByColumns: function(items, pointCreated, isVertical, startColumnIndex) {
                var point, i, item, offset, prevItemOffset, rtlEnabled, cellsLength = items.length,
                    notCreatePoint = false,
                    columnIndex = startColumnIndex || 0,
                    result = [];
                for (i = 0; i <= cellsLength; i++) {
                    if (i < cellsLength) {
                        item = items.eq(i);
                        offset = item.offset();
                        rtlEnabled = "rtl" === item.css("direction")
                    }
                    point = {
                        index: columnIndex,
                        x: offset ? offset.left + (!isVertical && rtlEnabled ^ i === cellsLength ? item.outerWidth() : 0) : 0,
                        y: offset ? offset.top + (isVertical && i === cellsLength ? item.outerHeight() : 0) : 0,
                        columnIndex: columnIndex
                    };
                    if (!isVertical && i > 0) {
                        prevItemOffset = items.eq(i - 1).offset();
                        if (prevItemOffset.top < point.y) {
                            point.y = prevItemOffset.top
                        }
                    }
                    if (pointCreated) {
                        notCreatePoint = pointCreated(point)
                    }
                    if (!notCreatePoint) {
                        result.push(point)
                    }
                    columnIndex++
                }
                return result
            }
        }
    }())
});
