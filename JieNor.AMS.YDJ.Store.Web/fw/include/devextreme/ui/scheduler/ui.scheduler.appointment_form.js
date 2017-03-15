/** 
 * DevExtreme (ui/scheduler/ui.scheduler.appointment_form.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var Form = require("../form"),
        messageLocalization = require("../../localization/message"),
        clickEvent = require("../../events/click");
    require("./ui.scheduler.recurrence_editor");
    require("./ui.scheduler.timezone_editor");
    require("../text_area");
    var RECURRENCE_EDITOR_ITEM_CLASS = "dx-scheduler-recurrence-rule-item";
    var SchedulerAppointmentForm = {
        _appointmentForm: {},
        _validateAppointmentFormDate: function(editor, value, previousValue) {
            var isCorrectDate = !!value;
            if (!isCorrectDate) {
                editor.option("value", previousValue)
            }
        },
        _getAllDayStartDate: function(startDate) {
            startDate.setHours(0);
            startDate.setMinutes(0);
            return startDate
        },
        _getAllDayEndDate: function(startDate) {
            var endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            return endDate
        },
        create: function(componentCreator, $container, isReadOnly, formData) {
            this._appointmentForm = componentCreator($container, Form, {
                items: this._editors,
                readOnly: isReadOnly,
                showValidationSummary: true,
                scrollingEnabled: true,
                formData: formData
            });
            return this._appointmentForm
        },
        prepareAppointmentFormEditors: function(allDay, dataExprs, schedulerInst) {
            var that = this;
            this._editors = [{
                dataField: dataExprs.textExpr,
                editorType: "dxTextBox",
                label: {
                    text: messageLocalization.format("dxScheduler-editorLabelTitle")
                }
            }, {
                itemType: "empty"
            }, {
                dataField: dataExprs.allDayExpr,
                editorType: "dxSwitch",
                label: {
                    text: messageLocalization.format("dxScheduler-allDay")
                },
                editorOptions: {
                    onValueChanged: function(args) {
                        var startDate, value = args.value,
                            startDateEditor = that._appointmentForm.getEditor(dataExprs.startDateExpr),
                            endDateEditor = that._appointmentForm.getEditor(dataExprs.endDateExpr);
                        if (startDateEditor && endDateEditor) {
                            startDateEditor.option("type", value ? "date" : "datetime");
                            endDateEditor.option("type", value ? "date" : "datetime");
                            startDate = new Date(startDateEditor.option("value"));
                            if (value) {
                                startDateEditor.option("value", that._getAllDayStartDate(startDate));
                                endDateEditor.option("value", that._getAllDayEndDate(startDate))
                            } else {
                                if (startDateEditor.option("value")) {
                                    startDate.setHours(schedulerInst.option("startDayHour"));
                                    startDateEditor.option("value", startDate);
                                    endDateEditor.option("value", schedulerInst._workSpace.calculateEndDate(startDateEditor.option("value")))
                                }
                            }
                        }
                    }
                }
            }, {
                dataField: dataExprs.startDateExpr,
                editorType: "dxDateBox",
                label: {
                    text: messageLocalization.format("dxScheduler-editorLabelStartDate")
                },
                editorOptions: {
                    type: allDay ? "date" : "datetime",
                    width: "100%",
                    onValueChanged: function(args) {
                        var value = args.value,
                            previousValue = args.previousValue,
                            endDateEditor = that._appointmentForm.getEditor(dataExprs.endDateExpr),
                            endValue = endDateEditor.option("value");
                        that._validateAppointmentFormDate(args.component, value, previousValue);
                        if (endValue <= value) {
                            var duration = endValue.getTime() - previousValue.getTime();
                            endDateEditor.option("value", new Date(value.getTime() + duration))
                        }
                    }
                }
            }, {
                dataField: dataExprs.startDateTimeZoneExpr,
                editorType: "dxSchedulerTimezoneEditor",
                label: {
                    text: " ",
                    showColon: false
                },
                editorOptions: {
                    observer: schedulerInst
                },
                visible: false
            }, {
                dataField: dataExprs.endDateExpr,
                editorType: "dxDateBox",
                label: {
                    text: messageLocalization.format("dxScheduler-editorLabelEndDate")
                },
                editorOptions: {
                    type: allDay ? "date" : "datetime",
                    width: "100%",
                    onValueChanged: function(args) {
                        var value = args.value,
                            previousValue = args.previousValue,
                            startDateEditor = that._appointmentForm.getEditor(dataExprs.startDateExpr),
                            startValue = startDateEditor.option("value");
                        that._validateAppointmentFormDate(args.component, value, previousValue);
                        if (value && startValue >= value) {
                            var duration = previousValue.getTime() - startValue.getTime();
                            startDateEditor.option("value", new Date(value.getTime() - duration))
                        }
                    }
                }
            }, {
                dataField: dataExprs.endDateTimeZoneExpr,
                editorType: "dxSchedulerTimezoneEditor",
                label: {
                    text: " ",
                    showColon: false
                },
                editorOptions: {
                    observer: schedulerInst
                },
                visible: false
            }, {
                itemType: "empty"
            }, {
                dataField: dataExprs.descriptionExpr,
                editorType: "dxTextArea",
                label: {
                    text: messageLocalization.format("dxScheduler-editorLabelDescription")
                }
            }, {
                dataField: dataExprs.recurrenceRuleExpr,
                editorType: "dxSchedulerRecurrenceEditor",
                editorOptions: {
                    observer: schedulerInst,
                    onContentReady: function(args) {
                        var $editorField = args.element.closest(".dx-field-item"),
                            $editorLabel = $editorField.find(".dx-field-item-label");
                        $editorLabel.off(clickEvent.name).on(clickEvent.name, function() {
                            args.component.toggle()
                        })
                    }
                },
                cssClass: RECURRENCE_EDITOR_ITEM_CLASS,
                label: {
                    text: messageLocalization.format("dxScheduler-editorLabelRecurrence")
                }
            }];
            if (!dataExprs.recurrenceRuleExpr) {
                this._editors.splice(9, 1)
            }
            return this._editors
        },
        concatResources: function(resources) {
            this._editors = this._editors.concat(resources)
        }
    };
    module.exports = SchedulerAppointmentForm
});
