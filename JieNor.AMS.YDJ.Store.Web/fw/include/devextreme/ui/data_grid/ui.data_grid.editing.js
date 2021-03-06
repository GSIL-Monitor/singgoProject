/** 
 * DevExtreme (ui/data_grid/ui.data_grid.editing.js)
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
        Guid = require("../../core/guid"),
        commonUtils = require("../../core/utils/common"),
        objectUtils = require("../../core/utils/object"),
        gridCore = require("./ui.data_grid.core"),
        clickEvent = require("../../events/click"),
        gridCoreUtils = require("../grid_core/ui.grid_core.utils"),
        getIndexByKey = gridCoreUtils.getIndexByKey,
        eventUtils = require("../../events/utils"),
        addNamespace = eventUtils.addNamespace,
        dialog = require("../dialog"),
        messageLocalization = require("../../localization/message"),
        Button = require("../button"),
        errors = require("../widget/ui.errors"),
        devices = require("../../core/devices"),
        Form = require("../form"),
        holdEvent = require("../../events/hold");
    require("./ui.data_grid.editor_factory");
    var DATAGRID_LINK_CLASS = "dx-link",
        DATAGRID_EDITOR_CELL_CLASS = "dx-editor-cell",
        DATAGRID_ROW_SELECTED = "dx-selection",
        DATAGRID_EDIT_ROW = "dx-edit-row",
        DATAGRID_EDIT_FORM_CLASS = "dx-datagrid-edit-form",
        DATAGRID_EDIT_FORM_ITEM_CLASS = "dx-datagrid-edit-form-item",
        DATAGRID_EDIT_BUTTON_CLASS = "dx-edit-button",
        DATAGRID_INSERT_INDEX = "__DX_INSERT_INDEX__",
        DATAGRID_ROW_CLASS = "dx-row",
        DATAGRID_ROW_REMOVED = "dx-row-removed",
        DATAGRID_ROW_INSERTED = "dx-row-inserted",
        DATAGRID_ROW_MODIFIED = "dx-row-modified",
        DATAGRID_CELL_MODIFIED = "dx-cell-modified",
        DATAGRID_CELL_HIGHLIGHT_OUTLINE = "dx-highlight-outline",
        DATAGRID_EDITING_NAMESPACE = "dxDataGridEditing",
        DATAGRID_FOCUS_OVERLAY_CLASS = "dx-datagrid-focus-overlay",
        DATAGRID_READONLY_CLASS = "dx-datagrid-readonly",
        DATAGRID_DATA_ROW_CLASS = "dx-data-row",
        DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
        DATAGRID_EDIT_MODE_BATCH = "batch",
        DATAGRID_EDIT_MODE_ROW = "row",
        DATAGRID_EDIT_MODE_CELL = "cell",
        DATAGRID_EDIT_MODE_FORM = "form",
        DATA_EDIT_DATA_INSERT_TYPE = "insert",
        DATA_EDIT_DATA_UPDATE_TYPE = "update",
        DATA_EDIT_DATA_REMOVE_TYPE = "remove",
        DATAGRID_POINTER_EVENTS_NONE_CLASS = "dx-pointer-events-none",
        DATAGRID_POINTER_EVENTS_TARGET_CLASS = "dx-pointer-events-target";
    var getEditMode = function(that) {
        var editMode = that.option("editing.mode");
        if (editMode === DATAGRID_EDIT_MODE_BATCH || editMode === DATAGRID_EDIT_MODE_CELL || editMode === DATAGRID_EDIT_MODE_FORM) {
            return editMode
        }
        return DATAGRID_EDIT_MODE_ROW
    };
    var isRowEditMode = function(that) {
        var editMode = getEditMode(that);
        return editMode === DATAGRID_EDIT_MODE_ROW || editMode === DATAGRID_EDIT_MODE_FORM
    };
    exports.EditingController = gridCore.ViewController.inherit(function() {
        var getDefaultEditorTemplate = function(that) {
            return function(container, options) {
                var $editor = $("<div/>").appendTo(container);
                that.getController("editorFactory").createEditor($editor, $.extend({}, options.column, {
                    value: options.value,
                    setValue: options.setValue,
                    row: options.row,
                    parentType: "dataRow",
                    width: null,
                    readOnly: !options.setValue,
                    id: options.id
                }))
            }
        };
        return {
            init: function() {
                var that = this;
                that._insertIndex = 1;
                that._editRowIndex = -1;
                that._editData = [];
                that._editColumnIndex = -1;
                that._columnsController = that.getController("columns");
                that._dataController = that.getController("data");
                that._rowsView = that.getView("rowsView");
                if (!that._dataChangedHandler) {
                    that._dataChangedHandler = $.proxy(that._handleDataChanged, that);
                    that._dataController.changed.add(that._dataChangedHandler)
                }
                if (!that._saveEditorHandler) {
                    that.createAction("onInitNewRow", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowInserting", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowInserted", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onEditingStart", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowUpdating", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowUpdated", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowRemoving", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that.createAction("onRowRemoved", {
                        excludeValidators: ["disabled", "readOnly"]
                    });
                    that._saveEditorHandler = that.createAction(function(e) {
                        var isEditorPopup, isDomElement, isFocusOverlay, isAddRowButton, isCellEditMode, $target, event = e.jQueryEvent;
                        if (!isRowEditMode(that) && !that._editCellInProgress) {
                            $target = $(event.target);
                            isEditorPopup = $target.closest(".dx-dropdowneditor-overlay").length;
                            isDomElement = $target.closest(document).length;
                            isAddRowButton = $target.closest(".dx-datagrid-addrow-button").length;
                            isFocusOverlay = $target.hasClass(DATAGRID_FOCUS_OVERLAY_CLASS);
                            isCellEditMode = getEditMode(that) === DATAGRID_EDIT_MODE_CELL;
                            if (!isEditorPopup && !isFocusOverlay && !(isAddRowButton && isCellEditMode && that.isEditing()) && isDomElement) {
                                $.proxy(that._closeEditItem, that)($target)
                            }
                        }
                    });
                    $(document).on(clickEvent.name, that._saveEditorHandler)
                }
                that._updateEditColumn();
                that._updateEditButtons()
            },
            _closeEditItem: function($targetElement) {
                var isDataRow = $targetElement.closest("." + DATAGRID_DATA_ROW_CLASS).length,
                    $targetCell = $targetElement.closest("." + DATAGRID_ROW_CLASS + "> td"),
                    columnIndex = $targetCell[0] && $targetCell[0].cellIndex,
                    rowIndex = this.getView("rowsView").getRowIndex($targetCell.parent()),
                    visibleColumns = this._columnsController.getVisibleColumns(),
                    allowEditing = visibleColumns[columnIndex] && visibleColumns[columnIndex].allowEditing;
                if (this.isEditing() && (!isDataRow || isDataRow && !allowEditing && !this.isEditCell(rowIndex, columnIndex))) {
                    this.closeEditCell()
                }
            },
            _handleDataChanged: function(args) {
                if ("standard" === this.option("scrolling.mode")) {
                    this.resetRowAndPageIndices()
                }
                if ("prepend" === args.changeType) {
                    $.each(this._editData, function(_, editData) {
                        editData.rowIndex += args.items.length;
                        if (editData.type === DATA_EDIT_DATA_INSERT_TYPE) {
                            editData.key.rowIndex += args.items.length
                        }
                    })
                }
            },
            getEditMode: function() {
                return getEditMode(this)
            },
            getFirstEditableColumnIndex: function() {
                var columnIndex, columnsController = this.getController("columns"),
                    visibleColumns = columnsController.getVisibleColumns();
                $.each(visibleColumns, function(index, column) {
                    if (column.allowEditing) {
                        columnIndex = index;
                        return false
                    }
                });
                return columnIndex
            },
            getFirstEditableCellInRow: function(rowIndex) {
                return this.getView("rowsView").getCellElement(rowIndex ? rowIndex : 0, this.getFirstEditableColumnIndex())
            },
            getFocusedCellInRow: function(rowIndex) {
                return this.getFirstEditableCellInRow(rowIndex)
            },
            getIndexByKey: function(key, items) {
                return getIndexByKey(key, items)
            },
            hasChanges: function() {
                var that = this,
                    result = false;
                for (var i = 0; i < that._editData.length; i++) {
                    if (that._editData[i].type) {
                        result = true;
                        break
                    }
                }
                return result
            },
            dispose: function() {
                this.callBase();
                $(document).off(clickEvent.name, this._saveEditorHandler)
            },
            optionChanged: function(args) {
                if ("editing" === args.name) {
                    this.init();
                    args.handled = true
                } else {
                    this.callBase(args)
                }
            },
            publicMethods: function() {
                return ["insertRow", "addRow", "removeRow", "deleteRow", "undeleteRow", "editRow", "editCell", "closeEditCell", "saveEditData", "cancelEditData", "hasEditData"]
            },
            refresh: function() {
                if (getEditMode(this) !== DATAGRID_EDIT_MODE_BATCH) {
                    this.init()
                } else {
                    this._editRowIndex = -1;
                    this._editColumnIndex = -1
                }
            },
            isEditing: function() {
                return this._editRowIndex > -1
            },
            isEditRow: function(rowIndex) {
                var editMode = getEditMode(this);
                return this._editRowIndex === rowIndex && (editMode === DATAGRID_EDIT_MODE_ROW || editMode === DATAGRID_EDIT_MODE_FORM)
            },
            getEditRowKey: function() {
                var items = this._dataController.items(),
                    item = items[this._editRowIndex];
                return item && item.key
            },
            getEditFormRowIndex: function() {
                return getEditMode(this) === DATAGRID_EDIT_MODE_FORM ? this._editRowIndex : -1
            },
            isEditCell: function(rowIndex, columnIndex) {
                return this._editRowIndex === rowIndex && this._editColumnIndex === columnIndex
            },
            _needInsertItem: function(editData, changeType) {
                var that = this,
                    dataSource = that._dataController.dataSource(),
                    scrollingMode = that.option("scrolling.mode"),
                    pageIndex = dataSource.pageIndex(),
                    beginPageIndex = dataSource.beginPageIndex ? dataSource.beginPageIndex() : pageIndex,
                    endPageIndex = dataSource.endPageIndex ? dataSource.endPageIndex() : pageIndex;
                if ("standard" !== scrollingMode) {
                    switch (changeType) {
                        case "append":
                            return editData.key.pageIndex === endPageIndex;
                        case "prepend":
                            return editData.key.pageIndex === beginPageIndex;
                        case "refresh":
                            editData.key.rowIndex = 0;
                            editData.key.pageIndex = 0;
                            break;
                        default:
                            return editData.key.pageIndex >= beginPageIndex && editData.key.pageIndex <= endPageIndex
                    }
                }
                return editData.key.pageIndex === pageIndex
            },
            processItems: function(items, changeType) {
                var i, key, data, that = this,
                    editData = that._editData;
                that.update(changeType);
                for (i = 0; i < editData.length; i++) {
                    key = editData[i].key;
                    data = {
                        key: key
                    };
                    if (editData[i].type === DATA_EDIT_DATA_INSERT_TYPE && that._needInsertItem(editData[i], changeType)) {
                        data[DATAGRID_INSERT_INDEX] = key[DATAGRID_INSERT_INDEX];
                        items.splice(key.rowIndex, 0, data)
                    }
                }
                return items
            },
            processDataItem: function(item, columns, generateDataValues) {
                var editIndex, editData, data, editMode, that = this,
                    key = item.data[DATAGRID_INSERT_INDEX] ? item.data.key : item.key;
                editIndex = getIndexByKey(key, that._editData);
                if (editIndex >= 0) {
                    editMode = getEditMode(that);
                    editData = that._editData[editIndex];
                    data = editData.data;
                    switch (editData.type) {
                        case DATA_EDIT_DATA_INSERT_TYPE:
                            item.inserted = true;
                            item.key = key;
                            item.data = data;
                            break;
                        case DATA_EDIT_DATA_UPDATE_TYPE:
                            item.modified = true;
                            item.oldData = item.data;
                            item.data = $.extend(true, {}, item.data, data);
                            item.modifiedValues = generateDataValues(data, columns);
                            break;
                        case DATA_EDIT_DATA_REMOVE_TYPE:
                            if (editMode === DATAGRID_EDIT_MODE_BATCH) {
                                item.data = $.extend(true, {}, item.data, data)
                            }
                            item.removed = true
                    }
                }
            },
            insertRow: function() {
                errors.log("W0002", "dxDataGrid", "insertRow", "15.2", "Use the 'addRow' method instead");
                return this.addRow()
            },
            addRow: function() {
                var $firstCell, that = this,
                    dataController = that._dataController,
                    store = dataController.store(),
                    key = store && store.key(),
                    rowsView = that.getView("rowsView"),
                    param = {
                        data: {}
                    },
                    insertKey = {
                        pageIndex: dataController.pageIndex(),
                        rowIndex: rowsView ? rowsView.getTopVisibleItemIndex() : 0
                    },
                    oldEditRowIndex = that._editRowIndex,
                    editMode = getEditMode(that);
                if (editMode === DATAGRID_EDIT_MODE_CELL && that.hasChanges()) {
                    that.saveEditData()
                }
                that.refresh();
                if (editMode !== DATAGRID_EDIT_MODE_BATCH && that._insertIndex > 1) {
                    return
                }
                if (!key) {
                    param.data.__KEY__ = String(new Guid)
                }
                that.executeAction("onInitNewRow", param);
                if (editMode !== DATAGRID_EDIT_MODE_BATCH) {
                    that._editRowIndex = insertKey.rowIndex
                }
                insertKey[DATAGRID_INSERT_INDEX] = that._insertIndex++;
                that._addEditData({
                    key: insertKey,
                    data: param.data,
                    type: DATA_EDIT_DATA_INSERT_TYPE
                });
                dataController.updateItems({
                    changeType: "update",
                    rowIndices: [oldEditRowIndex, insertKey.rowIndex]
                });
                $firstCell = that.getFirstEditableCellInRow(insertKey.rowIndex);
                that._delayedInputFocus($firstCell, function() {
                    var $cell = that.getFirstEditableCellInRow(insertKey.rowIndex);
                    $cell && $cell.trigger(clickEvent.name)
                });
                that._afterInsertRow({
                    key: insertKey,
                    data: param.data
                })
            },
            _isEditingStart: function(options) {
                this.executeAction("onEditingStart", options);
                return options.cancel
            },
            _beforeEditCell: function(rowIndex, columnIndex, item) {
                if (getEditMode(this) === DATAGRID_EDIT_MODE_CELL && !item.inserted && this.hasChanges()) {
                    this.saveEditData();
                    if (this.hasChanges()) {
                        return true
                    }
                }
            },
            _beforeUpdateItems: function(rowIndices) {},
            editRow: function(rowIndex) {
                var $editingCell, that = this,
                    dataController = that._dataController,
                    items = dataController.items(),
                    item = items[rowIndex],
                    params = {
                        data: item.data,
                        cancel: false
                    },
                    oldEditRowIndex = that._editRowIndex;
                if (rowIndex === oldEditRowIndex) {
                    return true
                }
                if (!item.inserted) {
                    params.key = item.key
                }
                if (that._isEditingStart(params)) {
                    return
                }
                that.init();
                that._pageIndex = dataController.pageIndex();
                that._editRowIndex = items[0].inserted ? rowIndex - 1 : rowIndex;
                that._addEditData({
                    data: {},
                    key: item.key,
                    oldData: item.data
                });
                var rowIndices = [oldEditRowIndex, rowIndex];
                that._beforeUpdateItems(rowIndices, rowIndex, oldEditRowIndex);
                dataController.updateItems({
                    changeType: "update",
                    rowIndices: rowIndices
                });
                if (getEditMode(that) === DATAGRID_EDIT_MODE_ROW || getEditMode(that) === DATAGRID_EDIT_MODE_FORM) {
                    $editingCell = that.getFocusedCellInRow(that._editRowIndex);
                    that._delayedInputFocus($editingCell, function() {
                        $editingCell && that.component.focus($editingCell)
                    })
                }
            },
            editCell: function(rowIndex, columnIndex) {
                var $cell, showEditorAlways, that = this,
                    columnsController = that._columnsController,
                    dataController = that._dataController,
                    items = dataController.items(),
                    item = items[rowIndex],
                    params = {
                        data: item && item.data,
                        cancel: false
                    },
                    oldEditRowIndex = that._editRowIndex,
                    oldEditColumnIndex = that._editColumnIndex,
                    columns = columnsController.getVisibleColumns();
                if (commonUtils.isString(columnIndex)) {
                    columnIndex = columnsController.columnOption(columnIndex, "index");
                    columnIndex = columnsController.getVisibleIndex(columnIndex)
                }
                params.column = columnsController.getVisibleColumns()[columnIndex];
                showEditorAlways = params.column && params.column.showEditorAlways;
                if (params.column && item && ("data" === item.rowType || "detailAdaptive" === item.rowType) && !item.removed && !isRowEditMode(that)) {
                    if (this.isEditCell(rowIndex, columnIndex)) {
                        return true
                    }
                    if (that._beforeEditCell(rowIndex, columnIndex, item)) {
                        return true
                    }
                    if (!item.inserted) {
                        params.key = item.key
                    }
                    if (that._isEditingStart(params)) {
                        return true
                    }
                    that._editRowIndex = rowIndex;
                    that._editColumnIndex = columnIndex;
                    that._pageIndex = dataController.pageIndex();
                    that._addEditData({
                        data: {},
                        key: item.key,
                        oldData: item.data
                    });
                    if (!showEditorAlways || columns[oldEditColumnIndex] && !columns[oldEditColumnIndex].showEditorAlways) {
                        that._editCellInProgress = true;
                        that.getController("editorFactory").loseFocus();
                        dataController.updateItems({
                            changeType: "update",
                            rowIndices: [oldEditRowIndex, that._editRowIndex]
                        })
                    }
                    $cell = that.getView("rowsView").getCellElement(that._editRowIndex, that._editColumnIndex);
                    if ($cell && !$cell.find(":focus").length) {
                        that._focusEditingCell(function() {
                            that._editCellInProgress = false
                        }, $cell)
                    } else {
                        that._editCellInProgress = false
                    }
                    return true
                }
                return false
            },
            _delayedInputFocus: function($cell, beforeFocusCallback) {
                function inputFocus() {
                    if (beforeFocusCallback) {
                        beforeFocusCallback()
                    }
                    $cell && $cell.find("[tabindex], input").first().focus()
                }
                if (devices.real().ios || devices.real().android) {
                    inputFocus()
                } else {
                    setTimeout(inputFocus)
                }
            },
            _focusEditingCell: function(beforeFocusCallback, $editCell) {
                var that = this;
                $editCell = $editCell || that.getView("rowsView").getCellElement(that._editRowIndex, that._editColumnIndex);
                that._delayedInputFocus($editCell, beforeFocusCallback)
            },
            removeRow: function(rowIndex) {
                errors.log("W0002", "dxDataGrid", "removeRow", "15.2", "Use the 'deleteRow' method instead");
                return this.deleteRow(rowIndex)
            },
            deleteRow: function(rowIndex) {
                var removeByKey, showDialogTitle, that = this,
                    editingOptions = that.option("editing"),
                    editingTexts = editingOptions && editingOptions.texts,
                    confirmDeleteTitle = editingTexts && editingTexts.confirmDeleteTitle,
                    isBatchMode = editingOptions && editingOptions.mode === DATAGRID_EDIT_MODE_BATCH,
                    confirmDeleteMessage = editingTexts && editingTexts.confirmDeleteMessage,
                    dataController = that._dataController,
                    oldEditRowIndex = that._editRowIndex,
                    item = dataController.items()[rowIndex],
                    key = item && item.key;
                if (item) {
                    removeByKey = function(key) {
                        that.refresh();
                        var editIndex = getIndexByKey(key, that._editData);
                        if (editIndex >= 0) {
                            if (that._editData[editIndex].type === DATA_EDIT_DATA_INSERT_TYPE) {
                                that._editData.splice(editIndex, 1)
                            } else {
                                that._editData[editIndex].type = DATA_EDIT_DATA_REMOVE_TYPE
                            }
                        } else {
                            that._addEditData({
                                key: key,
                                oldData: item.data,
                                type: DATA_EDIT_DATA_REMOVE_TYPE
                            })
                        }
                        if (isBatchMode) {
                            dataController.updateItems({
                                changeType: "update",
                                rowIndices: [oldEditRowIndex, rowIndex]
                            })
                        } else {
                            that.saveEditData()
                        }
                    };
                    if (isBatchMode || !confirmDeleteMessage) {
                        removeByKey(key)
                    } else {
                        showDialogTitle = commonUtils.isDefined(confirmDeleteTitle) && confirmDeleteTitle.length > 0;
                        dialog.confirm(confirmDeleteMessage, confirmDeleteTitle, showDialogTitle).done(function(confirmResult) {
                            if (confirmResult) {
                                removeByKey(key)
                            }
                        })
                    }
                }
            },
            undeleteRow: function(rowIndex) {
                var that = this,
                    dataController = that._dataController,
                    item = dataController.items()[rowIndex],
                    oldEditRowIndex = that._editRowIndex,
                    key = item && item.key;
                if (item) {
                    var editData, editIndex = getIndexByKey(key, that._editData);
                    if (editIndex >= 0) {
                        editData = that._editData[editIndex];
                        if ($.isEmptyObject(editData.data)) {
                            that._editData.splice(editIndex, 1)
                        } else {
                            editData.type = DATA_EDIT_DATA_UPDATE_TYPE
                        }
                        dataController.updateItems({
                            changeType: "update",
                            rowIndices: [oldEditRowIndex, rowIndex]
                        })
                    }
                }
            },
            _saveEditDataCore: function(deferreds, processedKeys) {
                var that = this,
                    store = that._dataController.store(),
                    hasCanceledData = false;

                function executeEditingAction(actionName, params, func) {
                    var deferred = $.Deferred();
                    that.executeAction(actionName, params);

                    function createFailureHandler(deferred) {
                        return function(arg) {
                            var error = arg instanceof Error ? arg : new Error(arg && String(arg) || "Unknown error");
                            deferred.reject(error)
                        }
                    }
                    $.when(params.cancel).done(function(cancel) {
                        if (cancel) {
                            deferred.resolve("cancel")
                        } else {
                            func(params).done(deferred.resolve).fail(createFailureHandler(deferred))
                        }
                    }).fail(createFailureHandler(deferred));
                    return deferred
                }
                $.each(that._editData, function(index, editData) {
                    var deferred, doneDeferred, params, data = editData.data,
                        oldData = editData.oldData,
                        key = editData.key,
                        type = editData.type;
                    if (that._beforeSaveEditData(editData, index)) {
                        return
                    }
                    switch (type) {
                        case DATA_EDIT_DATA_REMOVE_TYPE:
                            params = {
                                data: oldData,
                                key: key,
                                cancel: false
                            };
                            deferred = executeEditingAction("onRowRemoving", params, function() {
                                return store.remove(key)
                            });
                            break;
                        case DATA_EDIT_DATA_INSERT_TYPE:
                            params = {
                                data: data,
                                cancel: false
                            };
                            deferred = executeEditingAction("onRowInserting", params, function() {
                                return store.insert(params.data)
                            });
                            break;
                        case DATA_EDIT_DATA_UPDATE_TYPE:
                            params = {
                                newData: data,
                                oldData: oldData,
                                key: key,
                                cancel: false
                            };
                            deferred = executeEditingAction("onRowUpdating", params, function() {
                                return store.update(key, params.newData)
                            })
                    }
                    if (deferred) {
                        doneDeferred = $.Deferred();
                        deferred.always(function() {
                            processedKeys.push(key)
                        }).always(doneDeferred.resolve);
                        deferreds.push(doneDeferred.promise())
                    }
                });
                return hasCanceledData
            },
            _processSaveEditDataResult: function(results, processedKeys) {
                var i, arg, editIndex, isError, that = this,
                    dataController = that._dataController,
                    hasSavedData = false,
                    editMode = getEditMode(that);
                for (i = 0; i < results.length; i++) {
                    arg = results[i];
                    editIndex = getIndexByKey(processedKeys[i], that._editData);
                    if (that._editData[editIndex]) {
                        isError = arg && arg instanceof Error;
                        if (isError) {
                            that._editData[editIndex].error = arg;
                            dataController.dataErrorOccurred.fire(arg);
                            if (editMode !== DATAGRID_EDIT_MODE_BATCH) {
                                break
                            }
                        } else {
                            if ("cancel" !== arg) {
                                that._editData.splice(editIndex, 1);
                                hasSavedData = true
                            }
                        }
                    }
                }
                return hasSavedData
            },
            _fireSaveEditDataEvents: function(editData) {
                var that = this;
                $.each(editData, function(_, itemData) {
                    var data = itemData.data,
                        key = itemData.key,
                        type = itemData.type,
                        params = {
                            key: key,
                            data: data
                        };
                    if (itemData.error) {
                        params.error = itemData.error
                    }
                    switch (type) {
                        case DATA_EDIT_DATA_REMOVE_TYPE:
                            that.executeAction("onRowRemoved", $.extend({}, params, {
                                data: itemData.oldData
                            }));
                            break;
                        case DATA_EDIT_DATA_INSERT_TYPE:
                            that.executeAction("onRowInserted", params);
                            break;
                        case DATA_EDIT_DATA_UPDATE_TYPE:
                            that.executeAction("onRowUpdated", params)
                    }
                })
            },
            saveEditData: function() {
                var that = this,
                    processedKeys = [],
                    deferreds = [],
                    dataController = that._dataController,
                    editData = $.extend({}, that._editData),
                    editMode = getEditMode(that),
                    result = $.Deferred();
                var resetEditIndices = function(that) {
                    that._editColumnIndex = -1;
                    that._editRowIndex = -1
                };
                if (that._beforeSaveEditData() || that._saving) {
                    that._afterSaveEditData();
                    return result.resolve().promise()
                }
                that._saveEditDataCore(deferreds, processedKeys);
                if (deferreds.length) {
                    that._saving = true;
                    $.when.apply($, deferreds).done(function() {
                        if (that._processSaveEditDataResult(arguments, processedKeys)) {
                            resetEditIndices(that);
                            $.when(dataController.refresh()).always(function() {
                                that._fireSaveEditDataEvents(editData);
                                that._afterSaveEditData();
                                result.resolve()
                            })
                        } else {
                            result.resolve()
                        }
                    }).fail(result.resolve);
                    return result.always(function() {
                        that._saving = false
                    }).promise()
                }
                if (isRowEditMode(that)) {
                    if (!that.hasChanges()) {
                        that.cancelEditData()
                    }
                } else {
                    if (editMode === DATAGRID_EDIT_MODE_BATCH || editMode === DATAGRID_EDIT_MODE_CELL) {
                        resetEditIndices(that);
                        dataController.updateItems()
                    } else {
                        that._focusEditingCell()
                    }
                }
                that._afterSaveEditData();
                return result.resolve().promise()
            },
            _updateEditColumn: function() {
                var that = this,
                    editing = that.option("editing"),
                    editMode = getEditMode(that),
                    isEditColumnVisible = editing && ((editing.allowUpdating || editing.allowAdding) && editMode === DATAGRID_EDIT_MODE_ROW || editing.allowUpdating && editMode === DATAGRID_EDIT_MODE_FORM || editing.allowDeleting);
                that._columnsController.addCommandColumn({
                    command: "edit",
                    visible: isEditColumnVisible,
                    cssClass: "dx-command-edit",
                    width: "auto"
                });
                that._columnsController.columnOption("command:edit", "visible", isEditColumnVisible)
            },
            _updateEditButtons: function() {
                var that = this,
                    headerPanel = that.getView("headerPanel"),
                    hasChanges = that.hasChanges();
                if (headerPanel) {
                    headerPanel.updateToolbarItemOption("saveButton", "disabled", !hasChanges);
                    headerPanel.updateToolbarItemOption("cancelButton", "disabled", !hasChanges)
                }
            },
            _applyModified: function($element) {
                $element && $element.addClass(DATAGRID_CELL_MODIFIED)
            },
            _beforeCloseEditCellInBatchMode: function(rowIndices) {},
            cancelEditData: function() {
                var that = this,
                    dataController = that._dataController;
                that._beforeCancelEditData();
                that.init();
                dataController.updateItems()
            },
            hasEditData: function() {
                return this.hasChanges()
            },
            closeEditCell: function() {
                var that = this,
                    editMode = getEditMode(that),
                    oldEditRowIndex = that._editRowIndex,
                    dataController = that._dataController;
                if (!isRowEditMode(that)) {
                    setTimeout(function() {
                        if (editMode === DATAGRID_EDIT_MODE_CELL && that.hasChanges()) {
                            that.saveEditData()
                        } else {
                            if (oldEditRowIndex >= 0) {
                                var rowIndices = [oldEditRowIndex];
                                that._editRowIndex = -1;
                                that._editColumnIndex = -1;
                                that._beforeCloseEditCellInBatchMode(rowIndices);
                                dataController.updateItems({
                                    changeType: "update",
                                    rowIndices: rowIndices
                                })
                            }
                        }
                    })
                }
            },
            update: function(changeType) {
                var that = this,
                    dataController = that._dataController;
                if (dataController && that._pageIndex !== dataController.pageIndex()) {
                    if ("refresh" === changeType) {
                        that.refresh()
                    }
                    that._pageIndex = dataController.pageIndex()
                }
                that._updateEditButtons()
            },
            updateFieldValue: function(options, value, text, forceUpdateRow) {
                var params, that = this,
                    data = {},
                    rowKey = options.key,
                    $cellElement = options.cellElement,
                    editMode = getEditMode(that);
                if (void 0 !== rowKey && options.column.setCellValue) {
                    if (editMode === DATAGRID_EDIT_MODE_BATCH) {
                        that._applyModified($cellElement, options)
                    }
                    options.value = value;
                    options.column.setCellValue(data, value, text);
                    if (text && options.column.displayValueMap) {
                        options.column.displayValueMap[value] = text
                    }
                    params = {
                        data: data,
                        key: rowKey,
                        oldData: options.data,
                        type: DATA_EDIT_DATA_UPDATE_TYPE
                    };
                    that._addEditData(params);
                    that._updateEditButtons();
                    if (options.column.showEditorAlways && getEditMode(that) === DATAGRID_EDIT_MODE_CELL && options.row && !options.row.inserted) {
                        that.saveEditData().always(function() {
                            that._editColumnIndex = options.columnIndex;
                            that._editRowIndex = options.row.rowIndex;
                            that._focusEditingCell()
                        })
                    } else {
                        if (options.row && (forceUpdateRow || options.column.setCellValue !== options.column.defaultSetCellValue)) {
                            that._dataController.updateItems({
                                changeType: "update",
                                rowIndices: [options.row.rowIndex]
                            })
                        }
                    }
                }
            },
            _addEditData: function(options) {
                var that = this,
                    editDataIndex = getIndexByKey(options.key, that._editData);
                if (editDataIndex < 0) {
                    editDataIndex = that._editData.length;
                    that._editData.push(options)
                }
                if (that._editData[editDataIndex]) {
                    options.type = that._editData[editDataIndex].type || options.type;
                    objectUtils.deepExtendArraySafe(that._editData[editDataIndex], {
                        data: options.data,
                        type: options.type
                    })
                }
                return editDataIndex
            },
            _getFormEditItemTemplate: function(cellOptions, column) {
                return column.editCellTemplate || getDefaultEditorTemplate(this)
            },
            renderFormEditTemplate: function(detailCellOptions, item, layoutManager, $container, isReadOnly) {
                var that = this,
                    column = item.column,
                    cellOptions = $.extend({}, detailCellOptions, {
                        cellElement: null,
                        item: item,
                        value: column.calculateCellValue(detailCellOptions.data),
                        column: $.extend({}, column, {
                            editorOptions: item.editorOptions
                        }),
                        id: layoutManager.getItemID(item.name || item.dataField),
                        columnIndex: column.index,
                        setValue: !isReadOnly && column.allowEditing && function(value) {
                            that.updateFieldValue(cellOptions, value)
                        }
                    }),
                    template = $.proxy(that._getFormEditItemTemplate, that)(cellOptions, column);
                if (that._rowsView.renderTemplate($container, template, cellOptions, !!$container.closest(document).length)) {
                    that._rowsView._updateCell($container, cellOptions)
                }
            },
            getFormEditorTemplate: function(cellOptions, item) {
                var that = this;
                return function(options, $container) {
                    $.proxy(that.renderFormEditTemplate, that)(cellOptions, item, options.component, $container)
                }
            },
            getEditFormTemplate: function() {
                var that = this;
                return function($container, detailOptions) {
                    var editFormOptions = that.option("editing.form"),
                        items = that.option("editing.form.items"),
                        userCustomizeItem = that.option("editing.form.customizeItem");
                    if (!items) {
                        var columns = that.getController("columns").getColumns();
                        items = [];
                        $.each(columns, function(_, column) {
                            if (!column.isBand) {
                                items.push({
                                    column: column,
                                    name: column.name,
                                    dataField: column.dataField
                                })
                            }
                        })
                    }
                    that._createComponent($("<div>").appendTo($container), Form, $.extend({}, editFormOptions, {
                        items: items,
                        formID: new Guid,
                        customizeItem: function(item) {
                            var column = item.column || that._columnsController.columnOption(item.name || item.dataField);
                            if (column) {
                                item.label = item.label || {};
                                item.label.text = item.label.text || column.caption;
                                item.template = item.template || that.getFormEditorTemplate(detailOptions, item);
                                item.column = column;
                                if (column.formItem) {
                                    $.extend(item, column.formItem)
                                }
                            }
                            userCustomizeItem && userCustomizeItem.call(this, item);
                            item.cssClass = commonUtils.isString(item.cssClass) ? item.cssClass + " " + DATAGRID_EDIT_FORM_ITEM_CLASS : DATAGRID_EDIT_FORM_ITEM_CLASS
                        }
                    }));
                    var $buttonsContainer = $("<div>").addClass("dx-datagrid-form-buttons-container").appendTo($container);
                    that._createComponent($("<div>").appendTo($buttonsContainer), Button, {
                        text: that.option("editing.texts.saveRowChanges"),
                        onClick: $.proxy(that.saveEditData, that)
                    });
                    that._createComponent($("<div>").appendTo($buttonsContainer), Button, {
                        text: that.option("editing.texts.cancelRowChanges"),
                        onClick: $.proxy(that.cancelEditData, that)
                    })
                }
            },
            getColumnTemplate: function(options) {
                var template, editingOptions, editingTexts, allowUpdating, editingStartOptions, that = this,
                    column = options.column,
                    rowIndex = options.row && options.row.rowIndex,
                    isRowMode = isRowEditMode(that),
                    isRowEditing = that.isEditRow(rowIndex),
                    isCellEditing = that.isEditCell(rowIndex, options.columnIndex);
                if ((column.showEditorAlways || column.setCellValue && (isRowEditing && column.allowEditing || isCellEditing)) && ("data" === options.rowType || "detailAdaptive" === options.rowType) && !column.command) {
                    allowUpdating = that.option("editing.allowUpdating");
                    if (((allowUpdating || isRowEditing) && column.allowEditing || isCellEditing) && (isRowMode && isRowEditing || !isRowMode)) {
                        if (column.showEditorAlways && !isRowMode) {
                            editingStartOptions = {
                                cancel: false,
                                key: options.row.key,
                                data: options.row.data,
                                column: column
                            };
                            that._isEditingStart(editingStartOptions)
                        }
                        if (!editingStartOptions || !editingStartOptions.cancel) {
                            options.setValue = function(value, text) {
                                that.updateFieldValue(options, value, text)
                            }
                        }
                    }
                    template = column.editCellTemplate || getDefaultEditorTemplate(that)
                } else {
                    if ("edit" === column.command && "data" === options.rowType) {
                        template = function(container, options) {
                            var createLink = function(container, text, methodName, options) {
                                var $link = $("<a />").addClass(DATAGRID_LINK_CLASS).text(text).on(addNamespace(clickEvent.name, DATAGRID_EDITING_NAMESPACE), that.createAction(function(params) {
                                    var e = params.jQueryEvent;
                                    e.stopPropagation();
                                    setTimeout(function() {
                                        options.row && that[methodName](options.row.rowIndex)
                                    })
                                }));
                                options.rtlEnabled ? container.prepend($link, "&nbsp;") : container.append($link, "&nbsp;")
                            };
                            container.css("text-align", "center");
                            options.rtlEnabled = that.option("rtlEnabled");
                            editingOptions = that.option("editing") || {};
                            editingTexts = editingOptions.texts || {};
                            if (options.row && options.row.rowIndex === that._editRowIndex && isRowMode) {
                                createLink(container, editingTexts.saveRowChanges, "saveEditData", options);
                                createLink(container, editingTexts.cancelRowChanges, "cancelEditData", options)
                            } else {
                                if (editingOptions.allowUpdating && isRowMode) {
                                    createLink(container, editingTexts.editRow, "editRow", options)
                                }
                                if (editingOptions.allowDeleting) {
                                    if (options.row.removed) {
                                        createLink(container, editingTexts.undeleteRow, "undeleteRow", options)
                                    } else {
                                        createLink(container, editingTexts.deleteRow, "deleteRow", options)
                                    }
                                }
                            }
                        }
                    } else {
                        if ("detail" === column.command && "detail" === options.rowType && isRowEditing) {
                            template = that.getEditFormTemplate(options)
                        }
                    }
                }
                return template
            },
            prepareEditButtons: function(headerPanel) {
                var that = this,
                    editingOptions = that.option("editing") || {},
                    editingTexts = that.option("editing.texts") || {},
                    titleButtonTextByClassNames = {
                        cancel: editingTexts.cancelAllChanges,
                        save: editingTexts.saveAllChanges,
                        addrow: editingTexts.addRow
                    },
                    buttonItems = [];
                var prepareButtonItem = function(className, methodName) {
                    var onInitialized = function(e) {
                            e.element.addClass(headerPanel._getToolbarButtonClass(DATAGRID_EDIT_BUTTON_CLASS + " dx-datagrid-" + className + "-button"))
                        },
                        hintText = titleButtonTextByClassNames[className],
                        isButtonDisabled = ("save" === className || "cancel" === className) && !that.hasChanges();
                    return {
                        widget: "dxButton",
                        options: {
                            onInitialized: onInitialized,
                            icon: "edit-button-" + className,
                            disabled: isButtonDisabled,
                            onClick: function(options) {
                                that[methodName]()
                            },
                            text: hintText,
                            hint: hintText
                        },
                        showText: "inMenu",
                        name: className + "Button",
                        disabled: isButtonDisabled,
                        location: "after",
                        locateInMenu: "auto"
                    }
                };
                if (editingOptions.allowAdding) {
                    buttonItems.push(prepareButtonItem("addrow", "addRow"))
                }
                if ((editingOptions.allowUpdating || editingOptions.allowAdding || editingOptions.allowDeleting) && getEditMode(that) === DATAGRID_EDIT_MODE_BATCH) {
                    buttonItems.push(prepareButtonItem("save", "saveEditData"));
                    buttonItems.push(prepareButtonItem("cancel", "cancelEditData"))
                }
                return buttonItems
            },
            showHighlighting: function($cell) {
                var $highlight = $cell.find("." + DATAGRID_CELL_HIGHLIGHT_OUTLINE);
                if ("TD" === $cell.get(0).tagName && !$highlight.length) {
                    $cell.wrapInner($("<div>").addClass(DATAGRID_CELL_HIGHLIGHT_OUTLINE + " " + DATAGRID_POINTER_EVENTS_TARGET_CLASS))
                }
            },
            resetRowAndPageIndices: function(alwaysRest) {
                var that = this;
                $.each(that._editData, function(_, editData) {
                    if (editData.pageIndex !== that._pageIndex || alwaysRest) {
                        delete editData.pageIndex;
                        delete editData.rowIndex
                    }
                })
            },
            _afterInsertRow: function(options) {},
            _beforeSaveEditData: function(editData, editIndex) {},
            _afterSaveEditData: function() {},
            _beforeCancelEditData: function() {}
        }
    }());
    gridCore.registerModule("editing", {
        defaultOptions: function() {
            return {
                editing: {
                    mode: "row",
                    allowAdding: false,
                    allowUpdating: false,
                    allowDeleting: false,
                    texts: {
                        editRow: messageLocalization.format("dxDataGrid-editingEditRow"),
                        saveAllChanges: messageLocalization.format("dxDataGrid-editingSaveAllChanges"),
                        saveRowChanges: messageLocalization.format("dxDataGrid-editingSaveRowChanges"),
                        cancelAllChanges: messageLocalization.format("dxDataGrid-editingCancelAllChanges"),
                        cancelRowChanges: messageLocalization.format("dxDataGrid-editingCancelRowChanges"),
                        addRow: messageLocalization.format("dxDataGrid-editingAddRow"),
                        deleteRow: messageLocalization.format("dxDataGrid-editingDeleteRow"),
                        undeleteRow: messageLocalization.format("dxDataGrid-editingUndeleteRow"),
                        confirmDeleteMessage: messageLocalization.format("dxDataGrid-editingConfirmDeleteMessage"),
                        confirmDeleteTitle: ""
                    },
                    form: {
                        colCount: 2
                    }
                }
            }
        },
        controllers: {
            editing: exports.EditingController
        },
        extenders: {
            controllers: {
                data: {
                    init: function() {
                        this._editingController = this.getController("editing");
                        this.callBase()
                    },
                    reload: function(full) {
                        var d, editingController = this.getController("editing");
                        this._editingController.refresh();
                        d = this.callBase(full);
                        return d && d.done(function() {
                            editingController.resetRowAndPageIndices(true)
                        })
                    },
                    _updateItemsCore: function(change) {
                        this.callBase(change);
                        var editFormItem = this.items()[this.getController("editing").getEditFormRowIndex()];
                        if (editFormItem) {
                            editFormItem.rowType = "detail"
                        }
                    },
                    _processItems: function(items, changeType) {
                        items = this._editingController.processItems(items, changeType);
                        return this.callBase(items, changeType)
                    },
                    _processDataItem: function(dataItem, options) {
                        this._editingController.processDataItem(dataItem, options.visibleColumns, this.generateDataValues);
                        return this.callBase(dataItem, options)
                    },
                    _processItem: function(item, options) {
                        item = this.callBase(item, options);
                        if (item.inserted) {
                            options.dataIndex--;
                            delete item.dataIndex
                        }
                        return item
                    }
                },
                columnsResizer: {
                    _startResizing: function(args) {
                        var that = this,
                            editingController = that.getController("editing"),
                            isCellEditing = function() {
                                var editingOptions = that.option("editing");
                                return editingOptions && editingOptions.mode !== DATAGRID_EDIT_MODE_ROW && editingController.isEditing()
                            };
                        that.callBase(args);
                        if (that.isResizing() && isCellEditing()) {
                            editingController.closeEditCell()
                        }
                    }
                }
            },
            views: {
                rowsView: {
                    init: function() {
                        this.callBase();
                        this._editingController = this.getController("editing")
                    },
                    getCellElements: function(rowIndex) {
                        var $cellElements = this.callBase(rowIndex),
                            editFormRowIndex = this._editingController.getEditFormRowIndex();
                        if (editFormRowIndex === rowIndex && $cellElements) {
                            return $cellElements.find("." + DATAGRID_EDIT_FORM_ITEM_CLASS)
                        }
                        return $cellElements
                    },
                    _getVisibleColumnIndex: function($cells, rowIndex, columnIdentificator) {
                        var item, visibleIndex = this.callBase($cells, rowIndex, columnIdentificator),
                            editFormRowIndex = this._editingController.getEditFormRowIndex();
                        if (editFormRowIndex === rowIndex) {
                            $.each($cells, function(index, cellElement) {
                                item = $(cellElement).find(".dx-field-item-content").data("dx-form-item");
                                if (item && item.column && item.column.visibleIndex === visibleIndex) {
                                    visibleIndex = index;
                                    return false
                                }
                            })
                        }
                        return visibleIndex
                    },
                    publicMethods: function() {
                        return this.callBase().concat(["cellValue"])
                    },
                    _getCellTemplate: function(options) {
                        var that = this,
                            template = that._editingController.getColumnTemplate(options);
                        return template || that.callBase(options)
                    },
                    _isNativeClick: function() {
                        return (devices.real().ios || devices.real().android) && this.option("editing.allowUpdating")
                    },
                    _createTable: function() {
                        var that = this,
                            $table = that.callBase.apply(that, arguments);
                        if (!isRowEditMode(that) && that.option("editing.allowUpdating")) {
                            $table.on(addNamespace(holdEvent.name, "dxDataGridRowsView"), "td:not(." + DATAGRID_EDITOR_CELL_CLASS + ")", that.createAction(function(e) {
                                var editingController = that._editingController;
                                if (editingController.isEditing()) {
                                    editingController.closeEditCell()
                                }
                            }))
                        }
                        return $table
                    },
                    _createRow: function(row) {
                        var editingController, isEditRow, isRowRemoved, isRowInserted, isRowModified, $row = this.callBase(row);
                        if (row) {
                            editingController = this._editingController;
                            isEditRow = editingController.isEditRow(row.rowIndex);
                            isRowRemoved = !!row.removed;
                            isRowInserted = !!row.inserted;
                            isRowModified = !!row.modified;
                            if (getEditMode(this) === DATAGRID_EDIT_MODE_BATCH) {
                                isRowRemoved && $row.addClass(DATAGRID_ROW_REMOVED)
                            } else {
                                isEditRow && $row.addClass(DATAGRID_EDIT_ROW)
                            }
                            isRowInserted && $row.addClass(DATAGRID_ROW_INSERTED);
                            isRowModified && $row.addClass(DATAGRID_ROW_MODIFIED);
                            if (isEditRow || isRowInserted || isRowRemoved) {
                                $row.removeClass(DATAGRID_ROW_SELECTED)
                            }
                            if (isEditRow && "detail" === row.rowType) {
                                $row.addClass(DATAGRID_EDIT_FORM_CLASS)
                            }
                        }
                        return $row
                    },
                    _getColumnIndexByElement: function($element) {
                        var $targetElement = $element.closest("." + DATAGRID_ROW_CLASS + "> td:not(.dx-master-detail-cell)");
                        return this.getCellIndex($targetElement)
                    },
                    _rowClick: function(e) {
                        var that = this,
                            editingController = that._editingController,
                            $targetElement = $(e.jQueryEvent.target),
                            columnIndex = that._getColumnIndexByElement($targetElement),
                            allowUpdating = that.option("editing.allowUpdating"),
                            column = that._columnsController.getVisibleColumns()[columnIndex],
                            allowEditing = column && (column.allowEditing || editingController.isEditCell(e.rowIndex, columnIndex));
                        if ($targetElement.closest("." + DATAGRID_ROW_CLASS + "> td").hasClass(DATAGRID_POINTER_EVENTS_NONE_CLASS)) {
                            return
                        }
                        if (!(allowUpdating && allowEditing && editingController.editCell(e.rowIndex, columnIndex)) && !editingController.isEditRow(e.rowIndex)) {
                            that.callBase(e)
                        }
                    },
                    _cellPrepared: function($cell, parameters) {
                        var columnIndex = parameters.columnIndex,
                            editingController = this._editingController,
                            isCommandCell = !!parameters.column.command,
                            isEditableCell = parameters.setValue;
                        parameters.isEditing = editingController.isEditCell(parameters.rowIndex, parameters.columnIndex) || editingController.isEditRow(parameters.rowIndex) && parameters.column.allowEditing;
                        if ("data" === parameters.rowType && !parameters.column.command && (parameters.isEditing || parameters.column.showEditorAlways)) {
                            var alignment = parameters.column.alignment;
                            $cell.addClass(DATAGRID_EDITOR_CELL_CLASS).toggleClass(DATAGRID_READONLY_CLASS, !isEditableCell).toggleClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS, !isEditableCell);
                            if (alignment) {
                                $cell.find("input").first().css("text-align", alignment)
                            }
                        }
                        var modifiedValues = parameters.row && (parameters.row.inserted ? parameters.row.values : parameters.row.modifiedValues);
                        if (modifiedValues && void 0 !== modifiedValues[columnIndex] && parameters.column && !isCommandCell && parameters.column.setCellValue) {
                            editingController.showHighlighting($cell);
                            $cell.addClass(DATAGRID_CELL_MODIFIED)
                        } else {
                            if (isEditableCell) {
                                editingController.showHighlighting($cell, true)
                            }
                        }
                        this.callBase.apply(this, arguments)
                    },
                    _formItemPrepared: function(cellOptions, $container) {},
                    _updateCell: function($cell, parameters) {
                        if ("detail" === parameters.rowType || "detailAdaptive" === parameters.rowType && parameters.item) {
                            this._formItemPrepared(parameters, $cell)
                        } else {
                            this.callBase($cell, parameters)
                        }
                    },
                    _update: function(change) {
                        this.callBase(change);
                        if ("updateSelection" === change.changeType) {
                            this.getTableElements().children("tbody").children("." + DATAGRID_EDIT_ROW).removeClass(DATAGRID_ROW_SELECTED)
                        }
                    },
                    cellValue: function(rowIndex, columnIdentificator, value, text) {
                        var cellOptions = this.getCellOptions(rowIndex, columnIdentificator);
                        if (cellOptions) {
                            if (void 0 === value) {
                                return cellOptions.value
                            } else {
                                this._editingController.updateFieldValue(cellOptions, value, text, true)
                            }
                        }
                    }
                },
                headerPanel: {
                    _getToolbarItems: function() {
                        var items = this.callBase(),
                            editButtonItems = this.getController("editing").prepareEditButtons(this);
                        return editButtonItems.concat(items)
                    },
                    optionChanged: function(args) {
                        switch (args.name) {
                            case "editing":
                                this._invalidateToolbarItems();
                                this.callBase(args);
                                break;
                            default:
                                this.callBase(args)
                        }
                    },
                    isVisible: function() {
                        var that = this,
                            editingOptions = that.getController("editing").option("editing");
                        return that.callBase() || editingOptions && (editingOptions.allowAdding || (editingOptions.allowUpdating || editingOptions.allowDeleting) && editingOptions.mode === DATAGRID_EDIT_MODE_BATCH)
                    }
                }
            }
        }
    })
});
