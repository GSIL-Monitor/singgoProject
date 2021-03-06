/** 
 * DevExtreme (localization/ru/widgets-web.ru.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: 
 */
"use strict";
define(function(require, exports, module) {
    ! function(root, factory) {
        if ("function" === typeof define && define.amd) {
            define(function(require, exports, module) {
                factory(require("../message"))
            })
        } else {
            factory(DevExpress.localization.message)
        }
    }(this, function(message) {
        message.load({
            ru: {
                "dxDataGrid-columnChooserTitle": "Выбор столбцов",
                "dxDataGrid-columnChooserEmptyText": "Перетащите столбец сюда, чтобы скрыть его",
                "dxDataGrid-groupContinuesMessage": "Продолжение на следующей странице",
                "dxDataGrid-groupContinuedMessage": "Продолжение с предыдущей страницы",
                "dxDataGrid-groupHeaderText": "Сгруппировать данные по этому столбцу",
                "dxDataGrid-ungroupHeaderText": "Разгруппировать данные по этому столбцу",
                "dxDataGrid-ungroupAllText": "Сбросить группирование",
                "dxDataGrid-editingEditRow": "Редактировать",
                "dxDataGrid-editingSaveRowChanges": "Сохранить",
                "dxDataGrid-editingCancelRowChanges": "Отменить",
                "dxDataGrid-editingDeleteRow": "Удалить",
                "dxDataGrid-editingUndeleteRow": "Восстановить",
                "dxDataGrid-editingConfirmDeleteMessage": "Вы уверены, что хотите удалить эту запись?",
                "dxDataGrid-validationCancelChanges": "Отменить изменения",
                "dxDataGrid-groupPanelEmptyText": "Перетащите столбец сюда, чтобы сгруппировать по нему",
                "dxDataGrid-noDataText": "Нет данных",
                "dxDataGrid-searchPanelPlaceholder": "Искать...",
                "dxDataGrid-filterRowShowAllText": "(Все)",
                "dxDataGrid-filterRowResetOperationText": "Сбросить",
                "dxDataGrid-filterRowOperationEquals": "Равно",
                "dxDataGrid-filterRowOperationNotEquals": "Не равно",
                "dxDataGrid-filterRowOperationLess": "Меньше",
                "dxDataGrid-filterRowOperationLessOrEquals": "Меньше или равно",
                "dxDataGrid-filterRowOperationGreater": "Больше",
                "dxDataGrid-filterRowOperationGreaterOrEquals": "Больше или равно",
                "dxDataGrid-filterRowOperationStartsWith": "Начинается с",
                "dxDataGrid-filterRowOperationContains": "Содержит",
                "dxDataGrid-filterRowOperationNotContains": "Не содержит",
                "dxDataGrid-filterRowOperationEndsWith": "Заканчивается на",
                "dxDataGrid-filterRowOperationBetween": "В диапазоне",
                "dxDataGrid-filterRowOperationBetweenStartText": "Начало",
                "dxDataGrid-filterRowOperationBetweenEndText": "Конец",
                "dxDataGrid-applyFilterText": "Применить фильтр",
                "dxDataGrid-trueText": "Да",
                "dxDataGrid-falseText": "Нет",
                "dxDataGrid-sortingAscendingText": "Сортировать по возрастанию",
                "dxDataGrid-sortingDescendingText": "Сортировать по убыванию",
                "dxDataGrid-sortingClearText": "Сбросить сортировку",
                "dxDataGrid-editingSaveAllChanges": "Сохранить изменения",
                "dxDataGrid-editingCancelAllChanges": "Отменить изменения",
                "dxDataGrid-editingAddRow": "Добавить строку",
                "dxDataGrid-summaryMin": "Мин: {0}",
                "dxDataGrid-summaryMinOtherColumn": "Мин по {1} : {0}",
                "dxDataGrid-summaryMax": "Макс: {0}",
                "dxDataGrid-summaryMaxOtherColumn": "Макс по {1} : {0}",
                "dxDataGrid-summaryAvg": "Срзнач: {0}",
                "dxDataGrid-summaryAvgOtherColumn": "Срзнач по {1} : {0}",
                "dxDataGrid-summarySum": "Сумм: {0}",
                "dxDataGrid-summarySumOtherColumn": "Сумм по {1} : {0}",
                "dxDataGrid-summaryCount": "Кол-во: {0}",
                "dxDataGrid-columnFixingFix": "Закрепить",
                "dxDataGrid-columnFixingUnfix": "Открепить",
                "dxDataGrid-columnFixingLeftPosition": "Налево",
                "dxDataGrid-columnFixingRightPosition": "Направо",
                "dxDataGrid-exportTo": "Экспортировать",
                "dxDataGrid-exportToExcel": "Экспортировать в Excel файл",
                "dxDataGrid-excelFormat": "Excel файл",
                "dxDataGrid-selectedRows": "Выбранные строки",
                "dxDataGrid-exportAll": "Экспортировать всё",
                "dxDataGrid-exportSelectedRows": "Экспортировать выбранные строки",
                "dxDataGrid-headerFilterEmptyValue": "(Пустое)",
                "dxDataGrid-headerFilterOK": "ОК",
                "dxDataGrid-headerFilterCancel": "Отменить",
                "dxDataGrid-ariaColumn": "Столбец",
                "dxDataGrid-ariaValue": "Значение",
                "dxDataGrid-ariaFilterCell": "Фильтр",
                "dxDataGrid-ariaCollapse": "Свернуть",
                "dxDataGrid-ariaExpand": "Развернуть",
                "dxDataGrid-ariaDataGrid": "Таблица данных",
                "dxDataGrid-ariaSearchInGrid": "Искать в таблице данных",
                "dxDataGrid-ariaSelectAll": "Выбрать всё",
                "dxDataGrid-ariaSelectRow": "Выбрать строку",
                "dxPager-infoText": "Страница {0} из {1} (Всего элементов: {2})",
                "dxPager-pagesCountText": "из",
                "dxPivotGrid-grandTotal": "Итого",
                "dxPivotGrid-total": "{0} Всего",
                "dxPivotGrid-fieldChooserTitle": "Выбор полей",
                "dxPivotGrid-showFieldChooser": "Показать выбор полей",
                "dxPivotGrid-expandAll": "Раскрыть все",
                "dxPivotGrid-collapseAll": "Свернуть все",
                "dxPivotGrid-sortColumnBySummary": 'Сортировать "{0}" по этой колонке',
                "dxPivotGrid-sortRowBySummary": 'Сортировать "{0}" по этой строке',
                "dxPivotGrid-removeAllSorting": "Сбросить все сортировки",
                "dxPivotGrid-rowFields": "Поля строк",
                "dxPivotGrid-columnFields": "Поля столбцов",
                "dxPivotGrid-dataFields": "Поля данных",
                "dxPivotGrid-filterFields": "Поля фильтров",
                "dxPivotGrid-allFields": "Все поля",
                "dxPivotGrid-columnFieldArea": "Перетащите поля колонок cюда",
                "dxPivotGrid-dataFieldArea": "Перетащите поля данных cюда",
                "dxPivotGrid-rowFieldArea": "Перетащите поля строк cюда",
                "dxPivotGrid-filterFieldArea": "Перетащите поля фильтров cюда",
                "dxScheduler-editorLabelTitle": "Название",
                "dxScheduler-editorLabelStartDate": "Дата начала",
                "dxScheduler-editorLabelEndDate": "Дата завершения",
                "dxScheduler-editorLabelDescription": "Описание",
                "dxScheduler-editorLabelRecurrence": "Повторение",
                "dxScheduler-openAppointment": "Открыть задачу",
                "dxScheduler-recurrenceNever": "Никогда",
                "dxScheduler-recurrenceDaily": "Ежедневно",
                "dxScheduler-recurrenceWeekly": "Еженедельно",
                "dxScheduler-recurrenceMonthly": "Ежемесячно",
                "dxScheduler-recurrenceYearly": "Ежегодно",
                "dxScheduler-recurrenceEvery": "Интервал",
                "dxScheduler-recurrenceEnd": "Завершить повторение",
                "dxScheduler-recurrenceAfter": "Количество повторений",
                "dxScheduler-recurrenceOn": "Повторять до",
                "dxScheduler-recurrenceRepeatDaily": "дней(дня)",
                "dxScheduler-recurrenceRepeatWeekly": "недели(недель)",
                "dxScheduler-recurrenceRepeatMonthly": "месяца(месяцев)",
                "dxScheduler-recurrenceRepeatYearly": "года(лет)",
                "dxScheduler-recurrenceRepeatOnDate": "до даты",
                "dxScheduler-recurrenceRepeatCount": "повторений",
                "dxScheduler-switcherDay": "День",
                "dxScheduler-switcherWeek": "Неделя",
                "dxScheduler-switcherWorkWeek": "Рабочая неделя",
                "dxScheduler-switcherMonth": "Месяц",
                "dxScheduler-switcherTimelineDay": "Хронология дня",
                "dxScheduler-switcherTimelineWeek": "Хронология недели",
                "dxScheduler-switcherTimelineWorkWeek": "Хронология рабочей недели",
                "dxScheduler-switcherTimelineMonth": "Хронология месяца",
                "dxScheduler-switcherAgenda": "Расписание",
                "dxScheduler-allDay": "Весь день",
                "dxScheduler-confirmRecurrenceEditMessage": "Вы хотите отредактировать только это событие или всю серию?",
                "dxScheduler-confirmRecurrenceDeleteMessage": "Вы хотите удалить только это событие или всю серию?",
                "dxScheduler-confirmRecurrenceEditSeries": "Всю серию",
                "dxScheduler-confirmRecurrenceDeleteSeries": "Всю серию",
                "dxScheduler-confirmRecurrenceEditOccurrence": "Только это событие",
                "dxScheduler-confirmRecurrenceDeleteOccurrence": "Только это событие",
                "dxScheduler-noTimezoneTitle": "Часовой пояс не выбран",
                "dxCalendar-todayButtonText": "Сегодня",
                "dxCalendar-ariaWidgetName": "Календарь",
                "dxColorView-ariaRed": "Красный",
                "dxColorView-ariaGreen": "Зеленый",
                "dxColorView-ariaBlue": "Синий",
                "dxColorView-ariaAlpha": "Прозрачность",
                "dxColorView-ariaHex": "Код цвета",
                "vizExport-printingButtonText": "Печать",
                "vizExport-titleMenuText": "Экспорт/Печать",
                "vizExport-exportButtonText": "{0} файл"
            }
        })
    })
});
