/** 
 * DevExtreme (ui/scheduler/ui.scheduler.work_space_month.js)
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
        registerComponent = require("../../core/component_registrator"),
        SchedulerWorkSpace = require("./ui.scheduler.work_space"),
        dateUtils = require("../../core/utils/date"),
        dateLocalization = require("../../localization/date");
    var MONTH_CLASS = "dx-scheduler-work-space-month",
        DATE_TABLE_CURRENT_DATE_CLASS = "dx-scheduler-date-table-current-date",
        DATE_TABLE_OTHER_MONTH_DATE_CLASS = "dx-scheduler-date-table-other-month";
    var DAYS_IN_WEEK = 7,
        DAY_IN_MILLISECONDS = 864e5;
    var SchedulerWorkSpaceMonth = SchedulerWorkSpace.inherit({
        _getElementClass: function() {
            return MONTH_CLASS
        },
        _getRowCount: function() {
            return 6
        },
        _getCellCount: function() {
            return DAYS_IN_WEEK
        },
        _getDateByIndex: function(headerIndex) {
            var resultDate = new Date(this._firstViewDate);
            resultDate.setDate(this._firstViewDate.getDate() + headerIndex);
            return resultDate
        },
        _getFormat: function() {
            return "E"
        },
        _calculateCellIndex: function(rowIndex, cellIndex) {
            cellIndex %= this._getCellCount();
            return rowIndex * this._getCellCount() + cellIndex
        },
        _getInterval: function() {
            return DAY_IN_MILLISECONDS
        },
        _getIntervalBetween: function(currentDate) {
            var firstViewDate = this.getStartViewDate(),
                timeZoneOffset = dateUtils.getTimezonesDifference(firstViewDate, currentDate);
            return currentDate.getTime() - (firstViewDate.getTime() - 36e5 * this.option("startDayHour")) - timeZoneOffset
        },
        _getDateByCellIndexes: function(rowIndex, cellIndex) {
            var date = this.callBase(rowIndex, cellIndex);
            this._setStartDayHour(date);
            return date
        },
        _calculateHiddenInterval: function() {
            return 0
        },
        _getCellCoordinatesByIndex: function(index) {
            var rowIndex = Math.floor(index / this._getCellCount()),
                cellIndex = index - this._getCellCount() * rowIndex;
            return {
                rowIndex: rowIndex,
                cellIndex: cellIndex
            }
        },
        _renderTimePanel: $.noop,
        _renderAllDayPanel: $.noop,
        _getTableAllDay: $.noop,
        _toggleAllDayVisibility: $.noop,
        _changeAllDayVisibility: $.noop,
        _setFirstViewDate: function() {
            var firstMonthDate = dateUtils.getFirstMonthDate(this.option("currentDate"));
            this._firstViewDate = dateUtils.getFirstWeekDate(firstMonthDate, this.option("firstDayOfWeek") || dateLocalization.firstDayOfWeekIndex());
            this._setStartDayHour(this._firstViewDate)
        },
        _renderTableBody: function(options) {
            options.getCellText = $.proxy(this._getCellText, this);
            this.callBase(options)
        },
        _getCellText: function(rowIndex, cellIndex) {
            cellIndex %= this._getCellCount();
            var date = this._getDate(rowIndex, cellIndex);
            return dateLocalization.format(date, "dd")
        },
        _getDate: function(week, day) {
            var result = new Date(this._firstViewDate);
            result.setDate(result.getDate() + week * DAYS_IN_WEEK + day);
            return result
        },
        _updateIndex: function(index) {
            return index
        },
        _prepareCellData: function(cell, rowIndex, cellIndex) {
            var data = this.callBase(cell, rowIndex, cellIndex),
                $cell = $(cell);
            $cell.toggleClass(DATE_TABLE_CURRENT_DATE_CLASS, this._isCurrentDate(data.startDate)).toggleClass(DATE_TABLE_OTHER_MONTH_DATE_CLASS, this._isOtherMonth(data.startDate));
            return data
        },
        _isCurrentDate: function(cellDate) {
            var today = new Date;
            return dateUtils.sameDate(cellDate, today)
        },
        _isOtherMonth: function(cellDate) {
            return cellDate.getMonth() !== this.option("currentDate").getMonth()
        },
        getCellDuration: function() {
            return 36e5 * this._calculateDayDuration()
        },
        getTimePanelWidth: function() {
            return 0
        },
        getPositionShift: function() {
            return {
                top: 0,
                left: 0
            }
        },
        getCoordinatesByDates: function(startDate, endDate) {
            var result = [],
                date = new Date(startDate);
            while (date <= endDate) {
                result.push(this.getCoordinatesByDate(date));
                date.setDate(date.getDate() + 7);
                date = dateUtils.getFirstWeekDate(date, this.option("firstDayOfWeek") || dateLocalization.firstDayOfWeekIndex())
            }
            return result
        },
        getCellCountToLastViewDate: function(date) {
            var firstDateTime = dateUtils.makeDate(date).getTime(),
                lastDateTime = this.getEndViewDate().getTime(),
                dayDurationInMs = this.getCellDuration();
            return Math.ceil((lastDateTime - firstDateTime) / dayDurationInMs)
        },
        supportAllDayRow: function() {
            return false
        },
        calculateEndDate: function(startDate) {
            var startDateCopy = new Date(startDate);
            return new Date(startDateCopy.setHours(this.option("endDayHour")))
        },
        _getCellPositionByIndex: function(index, groupIndex) {
            var position = this.callBase(index, groupIndex),
                rowIndex = this._getCellCoordinatesByIndex(index).rowIndex,
                calculatedTopOffset = this.getCellHeight() * rowIndex;
            if (calculatedTopOffset) {
                position.top = calculatedTopOffset
            }
            return position
        },
        scrollToTime: $.noop
    });
    registerComponent("dxSchedulerWorkSpaceMonth", SchedulerWorkSpaceMonth);
    module.exports = SchedulerWorkSpaceMonth
});
