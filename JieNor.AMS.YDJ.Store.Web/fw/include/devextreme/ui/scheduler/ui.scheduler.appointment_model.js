/** 
 * DevExtreme (ui/scheduler/ui.scheduler.appointment_model.js)
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
        recurrenceUtils = require("./utils.recurrence"),
        dateUtils = require("../../core/utils/date"),
        commonUtils = require("../../core/utils/common"),
        arrayUtils = require("../../core/utils/array"),
        query = require("../../data/query");
    var FilterMaker = Class.inherit({
        ctor: function(dataExpressions) {
            this._filterRegistry = null;
            this._dataExpressions = dataExpressions
        },
        isRegistered: function() {
            return !!this._filterRegistry
        },
        make: function(type, args) {
            if (!this._filterRegistry) {
                this._filterRegistry = {}
            }
            this._make[type].apply(this, args)
        },
        _make: {
            date: function(min, max) {
                var startDate = this._dataExpressions.startDateExpr,
                    endDate = this._dataExpressions.endDateExpr,
                    recurrenceRule = this._dataExpressions.recurrenceRuleExpr;
                this._filterRegistry.date = [
                    [
                        [endDate, ">", min],
                        [startDate, "<", max]
                    ], "or", [recurrenceRule, "startswith", "freq"], "or", [
                        [endDate, min],
                        [startDate, min]
                    ]
                ];
                if (!recurrenceRule) {
                    this._filterRegistry.date.splice(1, 2)
                }
            },
            user: function(userFilter) {
                this._filterRegistry.user = userFilter
            }
        },
        combine: function() {
            var filter = [];
            this._filterRegistry.date && filter.push(this._filterRegistry.date);
            this._filterRegistry.user && filter.push(this._filterRegistry.user);
            return filter
        }
    });
    var AppointmentModel = Class.inherit({
        _createFilter: function(min, max, remoteFiltering) {
            this._filterMaker.make("date", [min, max]);
            this._filterMaker.make("user", [this._dataSource.filter()]);
            if (remoteFiltering) {
                this._dataSource.filter(this._filterMaker.combine())
            }
        },
        _getStoreKey: function(target) {
            var store = this._dataSource.store();
            return store.keyOf(target)
        },
        _filterAppointmentByResources: function(appointment, resources) {
            var result = false;

            function checkAppointmentResourceValues() {
                var resource, resourceGetter = this._dataAccessors.getter.resources[resourceName];
                if ($.isFunction(resourceGetter)) {
                    resource = resourceGetter(appointment)
                }
                var appointmentResourceValues = arrayUtils.wrapToArray(resource),
                    resourceData = $.map(resources[i].items, function(item) {
                        return item.id
                    });
                for (var j = 0, itemDataCount = appointmentResourceValues.length; j < itemDataCount; j++) {
                    if ($.inArray(appointmentResourceValues[j], resourceData) > -1) {
                        return true
                    }
                }
                return false
            }
            for (var i = 0, len = resources.length; i < len; i++) {
                var resourceName = resources[i].name;
                result = checkAppointmentResourceValues.call(this);
                if (!result) {
                    return false
                }
            }
            return result
        },
        _filterAppointmentByRRule: function(appointment, min, max, startDayHour, endDayHour) {
            var rrule = appointment.rrule,
                recurrenceException = appointment.recurrenceException,
                allDay = appointment.allDay,
                result = true,
                appointmentStartDate = appointment.startDate,
                appointmentEndDate = appointment.endDate;
            if (allDay || this._appointmentPartInInterval(appointmentStartDate, appointmentEndDate, startDayHour, endDayHour)) {
                var trimmedDates = this._trimDates(min, max);
                min = trimmedDates.min, max = new Date(trimmedDates.max.getTime() - 6e4)
            }
            if (rrule && !recurrenceUtils.getRecurrenceRule(rrule).isValid) {
                result = appointmentEndDate > min && appointmentStartDate <= max
            }
            if (result && recurrenceUtils.getRecurrenceRule(rrule).isValid) {
                result = recurrenceUtils.dateInRecurrenceRange(rrule, appointmentStartDate, min, max, recurrenceException)
            }
            return result
        },
        _appointmentPartInInterval: function(startDate, endDate, startDayHour, endDayHour) {
            var apptStartDayHour = startDate.getHours(),
                apptEndDayHour = endDate.getHours();
            return apptStartDayHour <= startDayHour && apptEndDayHour <= endDayHour && apptEndDayHour >= startDayHour || apptEndDayHour >= endDayHour && apptStartDayHour <= endDayHour && apptStartDayHour >= startDayHour
        },
        _createCombinedFilter: function(filterOptions, timeZoneProcessor) {
            var dataAccessors = this._dataAccessors,
                startDayHour = filterOptions.startDayHour,
                endDayHour = filterOptions.endDayHour,
                min = dateUtils.makeDate(filterOptions.min),
                max = dateUtils.makeDate(filterOptions.max),
                resources = filterOptions.resources,
                that = this;
            return [
                [function(appointment) {
                    var rrule, result = true,
                        startDate = dateUtils.makeDate(dataAccessors.getter.startDate(appointment)),
                        endDate = dateUtils.makeDate(dataAccessors.getter.endDate(appointment)),
                        appointmentTakesAllDay = that.appointmentTakesAllDay(appointment, startDayHour, endDayHour),
                        isAllDay = dataAccessors.getter.allDay(appointment),
                        apptStartHour = startDate.getHours(),
                        hiddenInterval = 36e5 * (24 - endDayHour + startDayHour),
                        apptDuration = endDate.getTime() - startDate.getTime(),
                        delta = (hiddenInterval - apptDuration) / 36e5,
                        useRecurrence = commonUtils.isDefined(dataAccessors.getter.recurrenceRule);
                    if (useRecurrence) {
                        rrule = dataAccessors.getter.recurrenceRule(appointment)
                    }
                    if (resources && resources.length) {
                        result = that._filterAppointmentByResources(appointment, resources)
                    }
                    if (appointmentTakesAllDay && false === filterOptions.allDay) {
                        result = false
                    }
                    if (result && useRecurrence) {
                        result = that._filterAppointmentByRRule({
                            startDate: startDate,
                            endDate: endDate,
                            rrule: rrule,
                            recurrenceException: dataAccessors.getter.recurrenceException(appointment),
                            allDay: appointmentTakesAllDay
                        }, min, max, startDayHour, endDayHour)
                    }
                    var startDateTimeZone = dataAccessors.getter.startDateTimeZone(appointment),
                        endDateTimeZone = dataAccessors.getter.endDateTimeZone(appointment),
                        comparableStartDate = timeZoneProcessor(startDate, startDateTimeZone),
                        comparableEndDate = timeZoneProcessor(endDate, endDateTimeZone);
                    if (result && void 0 !== startDayHour) {
                        result = comparableStartDate.getHours() >= startDayHour || comparableEndDate.getHours() >= startDayHour || appointmentTakesAllDay
                    }
                    if (result && void 0 !== endDayHour) {
                        result = comparableStartDate.getHours() < endDayHour || appointmentTakesAllDay && comparableStartDate <= max;
                        if (apptDuration < hiddenInterval) {
                            if (apptStartHour > endDayHour && delta <= apptStartHour - endDayHour) {
                                result = false
                            }
                        }
                    }
                    if (result && useRecurrence && !rrule) {
                        if (comparableEndDate.getTime() < min.getTime() && !isAllDay) {
                            result = false
                        }
                    }
                    return result
                }]
            ]
        },
        ctor: function(dataSource, dataExpressions, dataAccessors) {
            this.setDataSource(dataSource);
            this._filterMaker = new FilterMaker(dataExpressions);
            this.setDataAccessors(dataAccessors)
        },
        setDataSource: function(dataSource) {
            this._dataSource = dataSource
        },
        setDataAccessors: function(dataAccessors) {
            this._dataAccessors = dataAccessors
        },
        filterByDate: function(min, max, remoteFiltering) {
            if (!this._dataSource) {
                return
            }
            var trimmedDates = this._trimDates(min, max);
            if (!this._filterMaker.isRegistered()) {
                this._createFilter(trimmedDates.min, trimmedDates.max, remoteFiltering)
            } else {
                this._filterMaker.make("date", [trimmedDates.min, trimmedDates.max]);
                if (this._dataSource.filter() && this._dataSource.filter().length > 1) {
                    this._filterMaker.make("user", [this._dataSource.filter()[1]])
                }
                if (remoteFiltering) {
                    this._dataSource.filter(this._filterMaker.combine())
                }
            }
        },
        filterLoadedAppointments: function(filterOptions, timeZoneProcessor) {
            if (!$.isFunction(timeZoneProcessor)) {
                timeZoneProcessor = function(date) {
                    return date
                }
            }
            var combinedFilter = this._createCombinedFilter(filterOptions, timeZoneProcessor);
            if (this._filterMaker.isRegistered()) {
                var trimmedDates = this._trimDates(filterOptions.min, filterOptions.max);
                this._filterMaker.make("date", [trimmedDates.min, trimmedDates.max]);
                var dateFilter = this.customizeDateFilter(this._filterMaker.combine(), timeZoneProcessor);
                combinedFilter.push([dateFilter])
            }
            return query(this._dataSource.items()).filter(combinedFilter).toArray()
        },
        _trimDates: function(min, max) {
            var minCopy = dateUtils.trimTime(new Date(min)),
                maxCopy = dateUtils.trimTime(new Date(max));
            maxCopy.setDate(maxCopy.getDate() + 1);
            return {
                min: minCopy,
                max: maxCopy
            }
        },
        hasAllDayAppointments: function(items, startDayHour, endDayHour) {
            if (!items) {
                return false
            }
            var that = this;
            var result = false;
            $.each(items, function(index, item) {
                if (that.appointmentTakesAllDay(item, startDayHour, endDayHour)) {
                    result = true;
                    return false
                }
            });
            return result
        },
        appointmentTakesAllDay: function(appointment, startDayHour, endDayHour) {
            var dataAccessors = this._dataAccessors,
                startDate = dataAccessors.getter.startDate(appointment),
                endDate = dataAccessors.getter.endDate(appointment),
                allDay = dataAccessors.getter.allDay(appointment);
            return allDay || this._appointmentHasAllDayDuration(startDate, endDate, startDayHour, endDayHour)
        },
        _appointmentHasAllDayDuration: function(startDate, endDate, startDayHour, endDayHour) {
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            var etalonDayDurationInHours = endDayHour - startDayHour,
                appointmentDurationInHours = (endDate.getTime() - startDate.getTime()) / 36e5;
            return appointmentDurationInHours >= etalonDayDurationInHours
        },
        appointmentTakesSeveralDays: function(appointment) {
            var dataAccessors = this._dataAccessors,
                startDate = dataAccessors.getter.startDate(appointment),
                endDate = dataAccessors.getter.endDate(appointment);
            var startDateCopy = dateUtils.trimTime(new Date(startDate)),
                endDateCopy = dateUtils.trimTime(new Date(endDate));
            return startDateCopy.getTime() !== endDateCopy.getTime()
        },
        _mapDateFieldsDependOnTZ: function(appointment, tz) {
            function convert(date) {
                date = dateUtils.makeDate(date);
                var tzDiff = 36e5 * tz.value + tz.clientOffset;
                return new Date(date.getTime() - tzDiff)
            }
            var startDate = this._dataAccessors.getter.startDate(appointment),
                endDate = this._dataAccessors.getter.endDate(appointment);
            this._dataAccessors.setter.startDate(appointment, convert(startDate));
            this._dataAccessors.setter.endDate(appointment, convert(endDate))
        },
        customizeDateFilter: function(dateFilter, timeZoneProcessor) {
            var currentFilter = $.extend(true, [], dateFilter);
            return $.proxy(function(appointment) {
                appointment = $.extend(true, {}, appointment);
                var startDate = this._dataAccessors.getter.startDate(appointment),
                    endDate = this._dataAccessors.getter.endDate(appointment),
                    startDateTimeZone = this._dataAccessors.getter.startDateTimeZone(appointment),
                    endDateTimeZone = this._dataAccessors.getter.endDateTimeZone(appointment);
                var comparableStartDate = timeZoneProcessor(startDate, startDateTimeZone),
                    comparableEndDate = timeZoneProcessor(endDate, endDateTimeZone);
                this._dataAccessors.setter.startDate(appointment, comparableStartDate);
                this._dataAccessors.setter.endDate(appointment, comparableEndDate);
                return query([appointment]).filter(currentFilter).toArray().length > 0
            }, this)
        },
        add: function(data, tz) {
            if (tz && void 0 !== tz.value) {
                this._mapDateFieldsDependOnTZ(data, tz)
            }
            return this._dataSource.store().insert(data).done($.proxy(function() {
                this._dataSource.load()
            }, this))
        },
        update: function(target, data) {
            var key = this._getStoreKey(target);
            return this._dataSource.store().update(key, data).done($.proxy(function() {
                this._dataSource.load()
            }, this))
        },
        remove: function(target) {
            var key = this._getStoreKey(target);
            return this._dataSource.store().remove(key).done($.proxy(function() {
                this._dataSource.load()
            }, this))
        }
    });
    module.exports = AppointmentModel
});
