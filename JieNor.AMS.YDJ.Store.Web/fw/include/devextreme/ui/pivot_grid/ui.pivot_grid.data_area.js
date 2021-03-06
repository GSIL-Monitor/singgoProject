/** 
 * DevExtreme (ui/pivot_grid/ui.pivot_grid.data_area.js)
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
        areaItem = require("./ui.pivot_grid.area_item");
    var PIVOTGRID_AREA_CLASS = "dx-pivotgrid-area",
        PIVOTGRID_AREA_DATA_CLASS = "dx-pivotgrid-area-data",
        PIVOTGRID_TOTAL_CLASS = "dx-total",
        PIVOTGRID_GRAND_TOTAL_CLASS = "dx-grandtotal",
        PIVOTGRID_ROW_TOTAL_CLASS = "dx-row-total";
    exports.DataArea = areaItem.AreaItem.inherit({
        _getAreaName: function() {
            return "data"
        },
        _createGroupElement: function() {
            return $("<div>").addClass(PIVOTGRID_AREA_CLASS).addClass(PIVOTGRID_AREA_DATA_CLASS)
        },
        _applyCustomStyles: function(options) {
            var cell = options.cell,
                classArray = options.classArray;
            if ("T" === cell.rowType || "T" === cell.columnType) {
                classArray.push(PIVOTGRID_TOTAL_CLASS)
            }
            if ("GT" === cell.rowType || "GT" === cell.columnType) {
                classArray.push(PIVOTGRID_GRAND_TOTAL_CLASS)
            }
            if ("T" === cell.rowType || "GT" === cell.rowType) {
                classArray.push(PIVOTGRID_ROW_TOTAL_CLASS)
            }
            if (options.rowIndex === options.rowsCount - 1) {
                options.cssArray.push("border-bottom: 0px")
            }
            this.callBase(options)
        },
        _moveFakeTable: function(scrollPos) {
            this._moveFakeTableLeft(scrollPos.x);
            this._moveFakeTableTop(scrollPos.y);
            this.callBase()
        },
        processScroll: function(useNativeScrolling) {
            this._groupElement.css("border-top-width", 0).dxScrollable({
                useNative: !!useNativeScrolling,
                useSimulatedScrollbar: !useNativeScrolling,
                direction: "both",
                bounceEnabled: false,
                updateManually: true
            })
        },
        setVirtualContentParams: function(params) {
            this.callBase(params);
            this._virtualContent.parent().height(params.height);
            this.tableElement().css({
                top: params.top,
                left: params.left
            })
        }
    })
});
