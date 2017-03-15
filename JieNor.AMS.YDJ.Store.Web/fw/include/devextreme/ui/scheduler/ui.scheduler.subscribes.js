/** 
 * DevExtreme (ui/scheduler/ui.scheduler.subscribes.js)
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
        array = require("../../core/utils/array"),
        recurrenceUtils = require("./utils.recurrence"),
        dateUtils = require("../../core/utils/date"),
        translator = require("../../animation/translator"),
        commonUtils = require("../../core/utils/common"),
        dateLocalization = require("../../localization/date"),
        SchedulerTimezones = require("./ui.scheduler.timezones");
    var subscribes = {
        currentViewUpdated: function(currentView) {
            this.option("currentView", currentView)
        },
        currentDateUpdated: function(date) {
            this.option("currentDate", date)
        },
        setCellDataCacheAlias: function(appointment, geometry) {
            this._workSpace.setCellDataCacheAlias(appointment, geometry)
        },
        needCoordinates: function(options) {
            var appointmentData = options.appointmentData,
                startDate = options.startDate,
                recurrenceRule = this.fire("getField", "recurrenceRule", appointmentData),
                recurrenceException = this.fire("getField", "recurrenceException", appointmentData),
                dateRange = this._workSpace.getDateRange(),
                startViewDate = this.appointmentTakesAllDay(appointmentData) ? dateUtils.trimTime(new Date(dateRange[0])) : dateRange[0],
                originalStartDate = options.originalStartDate || startDate;
            var dates = recurrenceUtils.getDatesByRecurrence(recurrenceRule, originalStartDate, startViewDate, dateRange[1], recurrenceException);
            if (!dates.length) {
                dates.push(startDate)
            }
            var itemResources = this._resourcesManager.getResourcesFromItem(appointmentData),
                allDay = this.appointmentTakesAllDay(appointmentData) && this._workSpace.supportAllDayRow();
            options.callback(this._getCoordinates(dates, itemResources, allDay))
        },
        showAppointmentTooltip: function(options) {
            options.skipDateCalculation = true;
            options.$appointment = $(options.target);
            var appointmentData = options.data,
                singleAppointmentData = this._getSingleAppointmentData(appointmentData, options);
            this.showAppointmentTooltip(appointmentData, singleAppointmentData, options.target)
        },
        hideAppointmentTooltip: function() {
            this._hideTooltip()
        },
        showAddAppointmentPopup: function(appointmentData) {
            var processedData = {};
            $.each(["startDate", "endDate", "allDay"], $.proxy(function(_, field) {
                if (void 0 !== appointmentData[field]) {
                    this.fire("setField", field, processedData, appointmentData[field]);
                    delete appointmentData[field]
                }
            }, this));
            this.showAppointmentPopup($.extend(processedData, appointmentData), true)
        },
        showEditAppointmentPopup: function(options) {
            var appointmentData = options.data;
            options.$appointment = $(options.target);
            options.skipHoursProcessing = true;
            var singleAppointmentData = this._getSingleAppointmentData(appointmentData, options),
                startDate = this.fire("getField", "startDate", singleAppointmentData);
            this.showAppointmentPopup(appointmentData, false, singleAppointmentData, startDate)
        },
        updateAppointmentAfterResize: function(options) {
            var targetAppointment = options.target,
                singleAppointment = this._getSingleAppointmentData(targetAppointment, options),
                startDate = this.fire("getField", "startDate", singleAppointment),
                updatedData = $.extend(true, {}, options.data);
            var processedStartDate = this.fire("convertDateByTimezoneBack", this.fire("getField", "startDate", updatedData), this.fire("getField", "startDateTimeZone", updatedData));
            var processedEndDate = this.fire("convertDateByTimezoneBack", this.fire("getField", "endDate", updatedData), this.fire("getField", "endDateTimeZone", updatedData));
            this.fire("setField", "startDate", updatedData, processedStartDate);
            this.fire("setField", "endDate", updatedData, processedEndDate);
            this._checkRecurringAppointment(targetAppointment, singleAppointment, startDate, $.proxy(function() {
                this._updateAppointment(targetAppointment, updatedData, function() {
                    this._appointments.moveAppointmentBack()
                })
            }, this))
        },
        updateAppointmentAfterDrag: function(options) {
            var target = options.data,
                updatedData = this._getUpdatedData(options),
                newCellIndex = this._workSpace.getDroppableCellIndex(),
                oldCellIndex = this._workSpace.getCellIndexByCoordinates(options.coordinates),
                becomeAllDay = this.fire("getField", "allDay", updatedData),
                wasAllDay = this.fire("getField", "allDay", target);
            var appointment = $.extend({}, target, updatedData);
            var movedToAllDay = this._workSpace.supportAllDayRow() && becomeAllDay,
                cellData = this._workSpace.getCellDataByCoordinates(options.coordinates, movedToAllDay),
                movedBetweenAllDayAndSimple = this._workSpace.supportAllDayRow() && (wasAllDay && !becomeAllDay || !wasAllDay && becomeAllDay);
            if (newCellIndex !== oldCellIndex || movedBetweenAllDayAndSimple) {
                this._checkRecurringAppointment(target, appointment, cellData.startDate, $.proxy(function() {
                    var processedStartDate = this.fire("convertDateByTimezoneBack", this.fire("getField", "startDate", updatedData), this.fire("getField", "startDateTimeZone", updatedData));
                    var processedEndDate = this.fire("convertDateByTimezoneBack", this.fire("getField", "endDate", updatedData), this.fire("getField", "endDateTimeZone", updatedData));
                    this.fire("setField", "startDate", appointment, processedStartDate);
                    this.fire("setField", "endDate", appointment, processedEndDate);
                    this._updateAppointment(target, appointment, function() {
                        this._appointments.moveAppointmentBack()
                    })
                }, this))
            } else {
                this._appointments.moveAppointmentBack()
            }
        },
        deleteAppointment: function(options) {
            options.$appointment = $(options.target);
            var appointmentData = options.data,
                singleAppointmentData = this._getSingleAppointmentData(appointmentData, options),
                startDate = this.fire("getField", "startDate", singleAppointmentData);
            this._checkRecurringAppointment(appointmentData, singleAppointmentData, startDate, $.proxy(function() {
                this.deleteAppointment(appointmentData)
            }, this), true)
        },
        getAppointmentColor: function(options) {
            var resourcesManager = this._resourcesManager,
                resourceForPainting = resourcesManager.getResourceForPainting(this.option("groups")),
                response = $.Deferred().resolve().promise();
            if (resourceForPainting) {
                var field = resourcesManager.getField(resourceForPainting),
                    groupIndex = options.groupIndex,
                    groups = this._workSpace._getCellGroups(groupIndex),
                    resourceValues = array.wrapToArray(options.itemData[field]),
                    groupId = resourceValues.length ? resourceValues[0] : void 0;
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].name === field) {
                        groupId = groups[i].id;
                        break
                    }
                }
                response = resourcesManager.getResourceColor(field, groupId)
            }
            options.callback(response)
        },
        getResourcesFromItem: function(options) {
            options.callback(this._resourcesManager.getResourcesFromItem(options.itemData))
        },
        getCellDimensions: function(options) {
            if (this._workSpace) {
                options.callback(this._workSpace.getCellWidth(), this._workSpace.getCellHeight(), this._workSpace.getAllDayHeight())
            }
        },
        getBoundOffset: function(options) {
            options.callback({
                top: -this.getWorkSpaceAllDayHeight()
            })
        },
        appointmentTakesAllDay: function(options) {
            var appointment = {};
            this.fire("setField", "startDate", appointment, options.startDate);
            this.fire("setField", "endDate", appointment, options.endDate);
            options.callback(this.appointmentTakesAllDay(appointment))
        },
        appointmentTakesSeveralDays: function(appointment) {
            return this._appointmentModel.appointmentTakesSeveralDays(appointment)
        },
        checkContainerVisibility: function(options) {
            options.callback(this.element().is(":hidden"))
        },
        appointmentFocused: function() {
            this._workSpace.restoreScrollTop()
        },
        getResizableAppointmentArea: function(options) {
            var area, allDay = options.allDay;
            if (this.option("groups") && this.option("groups").length && (allDay || "month" === this.option("currentView"))) {
                var groupBounds = this._workSpace.getGroupBounds(options.coordinates);
                area = {
                    left: groupBounds.left,
                    right: groupBounds.right,
                    top: 0,
                    bottom: 0
                }
            }
            options.callback(area)
        },
        getDraggableAppointmentArea: function(options) {
            options.callback(this.getWorkSpaceScrollableContainer())
        },
        getDragEventTargetElements: function(options) {
            options.callback(this.element)
        },
        correctAppointmentCoordinates: function(options) {
            var isAllDay = options.allDay,
                containerSign = options.isFixedContainer ? -1 : 1;
            var scrollTop = !isAllDay ? this.getWorkSpaceScrollableScrollTop() : 0,
                allDayPanelTopOffset = !isAllDay ? this.getWorkSpaceAllDayHeight() : 0,
                headerHeight = this.getWorkSpaceHeaderPanelHeight(),
                scrollLeft = this.getWorkSpaceScrollableScrollLeft(),
                tableLeftOffset = this.getWorkSpaceDateTableOffset();
            var topOffset = -scrollTop + allDayPanelTopOffset + headerHeight,
                leftOffset = -scrollLeft - tableLeftOffset;
            options.callback({
                top: options.coordinates.top + containerSign * topOffset,
                left: options.coordinates.left + containerSign * leftOffset
            })
        },
        allDayPanelToggled: function() {
            this._appointments.updateDraggablesBoundOffsets()
        },
        normalizeAppointmentDates: function(options) {
            var appointmentData = options.appointmentData,
                startDate = dateUtils.makeDate(this.fire("getField", "startDate", appointmentData)),
                endDate = dateUtils.makeDate(this.fire("getField", "endDate", appointmentData));
            this.fire("setField", "startDate", appointmentData, startDate);
            this.fire("setField", "endDate", appointmentData, endDate);
            options.callback(appointmentData)
        },
        formatDates: function(options) {
            var startDate = options.startDate,
                endDate = options.endDate,
                formatType = options.formatType;
            var formatTypes = {
                DATETIME: function() {
                    var dateTimeFormat = "mediumdatemediumtime",
                        startDateString = dateLocalization.format(startDate, dateTimeFormat) + " - ";
                    var endDateString = startDate.getDate() === endDate.getDate() ? dateLocalization.format(endDate, "shorttime") : dateLocalization.format(endDate, dateTimeFormat);
                    return startDateString + endDateString
                },
                TIME: function() {
                    return dateLocalization.format(startDate, "shorttime") + " - " + dateLocalization.format(endDate, "shorttime")
                },
                DATE: function() {
                    var dateTimeFormat = "d MMMM",
                        startDateString = dateLocalization.format(startDate, dateTimeFormat),
                        isDurationMoreThanDay = endDate.getTime() - startDate.getTime() > 864e5;
                    var endDateString = isDurationMoreThanDay || endDate.getDate() !== startDate.getDate() ? " - " + dateLocalization.format(endDate, dateTimeFormat) : "";
                    return startDateString + endDateString
                }
            };
            options.callback(formatTypes[formatType]())
        },
        getFullWeekAppointmentWidth: function(options) {
            var groupIndex = options.groupIndex,
                groupWidth = this._workSpace.getGroupWidth(groupIndex);
            options.callback(groupWidth)
        },
        getMaxAppointmentWidth: function(options) {
            var cellCountToLastViewDate = this._workSpace.getCellCountToLastViewDate(options.date);
            options.callback(cellCountToLastViewDate * this._workSpace.getCellWidth())
        },
        updateAppointmentStartDate: function(options) {
            var updatedStartDate, appointment = options.appointment,
                firstViewDate = this._workSpace.getStartViewDate(),
                startDate = new Date(options.startDate);
            if (this.appointmentTakesAllDay(appointment)) {
                updatedStartDate = dateUtils.normalizeDate(startDate, firstViewDate)
            } else {
                var startDayHour = this.option("startDayHour");
                if (startDate.getTime() < firstViewDate.getTime()) {
                    startDate = firstViewDate
                } else {
                    if (startDate.getHours() < startDayHour) {
                        startDate.setHours(startDayHour);
                        startDate.setMinutes(0)
                    }
                }
                updatedStartDate = dateUtils.normalizeDate(options.startDate, new Date(startDate))
            }
            options.callback(updatedStartDate)
        },
        updateAppointmentEndDate: function(options) {
            var endDate = new Date(options.endDate),
                updatedEndDate = endDate;
            if (endDate.getHours() >= this.option("endDayHour")) {
                updatedEndDate.setHours(this.option("endDayHour"));
                updatedEndDate.setMinutes(0)
            }
            options.callback(updatedEndDate)
        },
        renderDropDownAppointments: function(options) {
            this._dropDownAppointments.render(options, this)
        },
        getGroupCount: function(options) {
            var groupCount = this._workSpace._getGroupCount();
            options.callback(groupCount)
        },
        updateResizableArea: function() {
            var $allResizableElements = this.element().find(".dx-scheduler-appointment.dx-resizable");
            var horizontalResizables = $.grep($allResizableElements, function(el) {
                var $el = $(el),
                    resizableInst = $el.dxResizable("instance"),
                    area = resizableInst.option("area");
                return $.inArray(resizableInst.option("handles"), ["right left", "left right"]) > -1 && $.isPlainObject(area)
            });
            $.each(horizontalResizables, $.proxy(function(_, el) {
                var $el = $(el),
                    position = translator.locate($el),
                    appointmentData = this._appointments._getItemData($el);
                var area = this._appointments._calculateResizableArea({
                    left: position.left
                }, appointmentData);
                $el.dxResizable("instance").option("area", area)
            }, this))
        },
        recurrenceEditorVisibilityChanged: function(options) {
            this.recurrenceEditorVisibilityChanged(options.visible)
        },
        getField: function(field, obj) {
            if (!commonUtils.isDefined(this._dataAccessors.getter[field])) {
                return
            }
            return this._dataAccessors.getter[field](obj)
        },
        setField: function(field, obj, value) {
            if (!commonUtils.isDefined(this._dataAccessors.setter[field])) {
                return
            }
            var splittedExprStr = this.option(field + "Expr").split("."),
                rootField = splittedExprStr[0];
            if (void 0 === obj[rootField] && splittedExprStr.length > 1) {
                var emptyChain = function(arr) {
                    var result = {},
                        tmp = result,
                        arrLength = arr.length - 1;
                    for (var i = 1; i < arrLength; i++) {
                        tmp = tmp[arr[i]] = {}
                    }
                    return result
                }(splittedExprStr);
                obj[rootField] = emptyChain
            }
            this._dataAccessors.setter[field](obj, value);
            return obj
        },
        prerenderFilter: function() {
            var allDay, dateRange = this.getWorkSpace().getDateRange(),
                resources = this._resourcesManager.getResourcesData();
            if (!this.option("showAllDayPanel") && this._workSpace.supportAllDayRow()) {
                allDay = false
            }
            return this._appointmentModel.filterLoadedAppointments({
                startDayHour: this.option("startDayHour"),
                endDayHour: this.option("endDayHour"),
                min: dateRange[0],
                max: dateRange[1],
                resources: resources,
                allDay: allDay
            }, this._subscribes.convertDateByTimezone.bind(this))
        },
        dayHasAppointment: function(day, appointment, trimTime) {
            return this.dayHasAppointment(day, appointment, trimTime)
        },
        createResourcesTree: function() {
            return this._resourcesManager.createResourcesTree(this._loadedResources)
        },
        getResourceTreeLeaves: function(tree, appointmentResources) {
            return this._resourcesManager.getResourceTreeLeaves(tree, appointmentResources)
        },
        createReducedResourcesTree: function() {
            var tree = this._resourcesManager.createResourcesTree(this._loadedResources),
                existingAppointments = this.getAppointmentsInstance().option("items");
            return this._resourcesManager.reduceResourcesTree(tree, existingAppointments)
        },
        groupAppointmentsByResources: function(appointments) {
            var result = {
                0: appointments
            };
            if (this.option("groups") && this.option("groups").length && this._resourcesManager.getResourcesData().length) {
                result = this._resourcesManager.groupAppointmentsByResources(appointments, this._loadedResources)
            }
            var totalResourceCount = 0;
            $.each(this._loadedResources, function(i, resource) {
                if (!i) {
                    totalResourceCount = resource.items.length
                } else {
                    totalResourceCount *= resource.items.length
                }
            });
            for (var j = 0; j < totalResourceCount; j++) {
                var index = j.toString();
                if (result[index]) {
                    continue
                }
                result[index] = []
            }
            return result
        },
        getAgendaRows: function(options) {
            var renderingStrategy = this._appointments._renderingStrategy,
                calculateRows = $.proxy(renderingStrategy.calculateRows, renderingStrategy),
                d = $.Deferred();

            function rowsCalculated(appointments) {
                var result = calculateRows(appointments, options.agendaDuration, options.currentDate);
                this._dataSourceLoadedCallback.remove(rowsCalculated);
                d.resolve(result)
            }
            this._dataSourceLoadedCallback.add(rowsCalculated);
            return d.promise()
        },
        getAgendaVerticalStepHeight: function() {
            return this.getWorkSpace().getAgendaVerticalStepHeight()
        },
        getStartViewDate: function() {
            return this.getStartViewDate()
        },
        getEndViewDate: function() {
            return this.getEndViewDate()
        },
        agendaIsReady: function(rows, innerRowOffset, outerRowOffset) {
            var $appts = this.getAppointmentsInstance()._itemElements(),
                total = 0;
            $appts.css("margin-bottom", innerRowOffset);
            var applyOffset = function(_, count) {
                var index = count + total - 1;
                $appts.eq(index).css("margin-bottom", outerRowOffset);
                total += count
            };
            for (var i = 0; i < rows.length; i++) {
                $.each(rows[i], applyOffset)
            }
        },
        getTimezone: function() {
            return this._getTimezoneOffsetByOption()
        },
        getClientTimezoneOffset: function() {
            return SchedulerTimezones.getClientTimezoneOffset()
        },
        convertDateByTimezone: function(date, appointmentTimezone) {
            date = new Date(date);
            var clientTzOffset = -(this._subscribes.getClientTimezoneOffset() / 36e5);
            var commonTimezoneOffset = this._getTimezoneOffsetByOption(date);
            var appointmentTimezoneOffset = this._calculateTimezoneByValue(appointmentTimezone, date);
            if ("number" !== typeof appointmentTimezoneOffset) {
                appointmentTimezoneOffset = clientTzOffset
            }
            var dateInUTC = date.getTime() - 36e5 * clientTzOffset;
            date = new Date(dateInUTC + 36e5 * appointmentTimezoneOffset);
            if ("number" === typeof commonTimezoneOffset) {
                date = new Date(date.getTime() + 36e5 * (commonTimezoneOffset - appointmentTimezoneOffset))
            }
            return date
        },
        convertDateByTimezoneBack: function(date, appointmentTimezone) {
            date = new Date(date);
            var clientTzOffset = -(this._subscribes.getClientTimezoneOffset() / 36e5);
            var commonTimezoneOffset = this._getTimezoneOffsetByOption(date);
            var appointmentTimezoneOffset = this._calculateTimezoneByValue(appointmentTimezone, date);
            if ("number" !== typeof appointmentTimezoneOffset) {
                appointmentTimezoneOffset = clientTzOffset
            }
            var dateInUTC = date.getTime() + 36e5 * clientTzOffset;
            date = new Date(dateInUTC - 36e5 * appointmentTimezoneOffset);
            if ("number" === typeof commonTimezoneOffset) {
                date = new Date(date.getTime() - 36e5 * (commonTimezoneOffset - appointmentTimezoneOffset))
            }
            return date
        },
        getTimezonesDisplayName: function() {
            return SchedulerTimezones.getTimezonesDisplayName()
        },
        getTimezoneDisplayNameById: function(id) {
            return SchedulerTimezones.getTimezoneDisplayNameById(id)
        },
        getSimilarTimezones: function(id) {
            return SchedulerTimezones.getSimilarTimezones(id)
        },
        getTimezonesIdsByDisplayName: function(displayName) {
            return SchedulerTimezones.getTimezonesIdsByDisplayName(displayName)
        },
        getTargetedAppointmentData: function(appointmentData, appointmentElement, appointmentIndex) {
            var recurringData = this._getSingleAppointmentData(appointmentData, {
                    skipDateCalculation: true,
                    $appointment: appointmentElement
                }),
                result = {};
            $.extend(true, result, appointmentData, recurringData);
            this.setTargetedAppointmentResources(result, appointmentElement, appointmentIndex);
            return result
        }
    };
    module.exports = subscribes
});
