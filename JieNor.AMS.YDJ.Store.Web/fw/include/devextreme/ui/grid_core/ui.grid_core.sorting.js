/** 
 * DevExtreme (ui/grid_core/ui.grid_core.sorting.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var commonUtils = require("../../core/utils/common");
    var DATAGRID_SORT_CLASS = "dx-sort",
        DATAGRID_SORT_NONE_CLASS = "dx-sort-none",
        DATAGRID_SORTUP_CLASS = "dx-sort-up",
        DATAGRID_SORTDOWN_CLASS = "dx-sort-down",
        DATAGRID_HEADERS_ACTION_CLASS = "dx-datagrid-action",
        DATAGRID_COLUMN_INDICATORS_CLASS = "dx-column-indicators",
        DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content";
    exports.sortingMixin = {
        _applyColumnState: function(options) {
            var side, ariaSortState, $sortIndicator, that = this,
                sortingMode = that.option("sorting.mode"),
                rootElement = options.rootElement,
                column = options.column,
                $indicatorsContainer = rootElement.find("." + DATAGRID_COLUMN_INDICATORS_CLASS);
            if ("sort" === options.name) {
                side = that.option("rtlEnabled") ? "right" : "left", rootElement.find("." + DATAGRID_SORT_CLASS).remove();
                !$indicatorsContainer.children().length && $indicatorsContainer.remove();
                rootElement.children("." + DATAGRID_CELL_CONTENT_CLASS).css("margin-" + side, "");
                if (("single" === sortingMode || "multiple" === sortingMode) && column.allowSorting || commonUtils.isDefined(column.sortOrder)) {
                    ariaSortState = "asc" === column.sortOrder ? "ascending" : "descending", $sortIndicator = that.callBase(options).toggleClass(DATAGRID_SORTUP_CLASS, "asc" === column.sortOrder).toggleClass(DATAGRID_SORTDOWN_CLASS, "desc" === column.sortOrder);
                    options.rootElement.addClass(DATAGRID_HEADERS_ACTION_CLASS);
                    if ("center" === column.alignment && !$sortIndicator.hasClass(DATAGRID_SORT_NONE_CLASS)) {
                        rootElement.children("." + DATAGRID_CELL_CONTENT_CLASS).css("margin-" + side, $sortIndicator.outerWidth(true))
                    }
                }
                if (!commonUtils.isDefined(column.sortOrder)) {
                    that.setAria("sort", "none", rootElement)
                } else {
                    that.setAria("sort", ariaSortState, rootElement)
                }
                return $sortIndicator
            } else {
                return that.callBase(options)
            }
        },
        _getIndicatorClassName: function(name) {
            if ("sort" === name) {
                return DATAGRID_SORT_CLASS
            }
            return this.callBase(name)
        },
        _renderIndicator: function(options) {
            var rtlEnabled, column = options.column,
                $container = options.container,
                $indicator = options.indicator;
            if ("sort" === options.name) {
                rtlEnabled = this.option("rtlEnabled");
                if (!commonUtils.isDefined(column.sortOrder)) {
                    $indicator && $indicator.addClass(DATAGRID_SORT_NONE_CLASS)
                }
                if ($container.children().length && (!rtlEnabled && "left" === options.columnAlignment || rtlEnabled && "right" === options.columnAlignment)) {
                    $container.prepend($indicator);
                    return
                }
            }
            this.callBase(options)
        },
        _updateIndicator: function($cell, column, indicatorName) {
            if ("sort" === indicatorName && commonUtils.isDefined(column.groupIndex)) {
                return
            }
            this.callBase.apply(this, arguments)
        }
    }
});
