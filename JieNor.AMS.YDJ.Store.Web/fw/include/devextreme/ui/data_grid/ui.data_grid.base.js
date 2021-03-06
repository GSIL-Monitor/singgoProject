/** 
 * DevExtreme (ui/data_grid/ui.data_grid.base.js)
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
        commonUtils = require("../../core/utils/common"),
        logger = require("../../core/utils/console").logger,
        browser = require("../../core/utils/browser"),
        Widget = require("../widget/ui.widget"),
        gridCore = require("./ui.data_grid.core"),
        callModuleItemsMethod = gridCore.callModuleItemsMethod;
    var DATAGRID_ROW_SELECTOR = ".dx-row",
        DATAGRID_DEPRECATED_TEMPLATE_WARNING = "Specifying grid templates with the name of a jQuery selector is now deprecated. Instead, use the jQuery object that references this selector.";
    require("./ui.data_grid.column_headers_view");
    require("./ui.data_grid.columns_controller");
    require("./ui.data_grid.data_controller");
    require("./ui.data_grid.sorting_module");
    require("./ui.data_grid.rows_view");
    require("./ui.data_grid.context_menu_view");
    require("./ui.data_grid.error_handling");
    require("./ui.data_grid.grid_view");
    require("./ui.data_grid.header_panel");
    gridCore.registerModulesOrder(["stateStoring", "columns", "selection", "editorFactory", "columnChooser", "editing", "grouping", "masterDetail", "validating", "adaptivity", "data", "virtualScrolling", "columnHeaders", "filterRow", "headerPanel", "headerFilter", "sorting", "search", "rows", "pager", "columnsResizingReordering", "contextMenu", "keyboardNavigation", "errorHandling", "summary", "fixedColumns", "export", "gridView"]);
    var DataGrid = Widget.inherit({
        _activeStateUnit: DATAGRID_ROW_SELECTOR,
        _getDefaultOptions: function() {
            var that = this,
                result = that.callBase();
            $.each(gridCore.modules, function() {
                if ($.isFunction(this.defaultOptions)) {
                    $.extend(true, result, this.defaultOptions())
                }
            });
            return result
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                "editing.editMode": {
                    since: "15.2",
                    alias: "editing.mode"
                },
                "editing.editEnabled": {
                    since: "15.2",
                    alias: "editing.allowUpdating"
                },
                "editing.insertEnabled": {
                    since: "15.2",
                    alias: "editing.allowAdding"
                },
                "editing.removeEnabled": {
                    since: "15.2",
                    alias: "editing.allowDeleting"
                },
                "grouping.groupContinuedMessage": {
                    since: "16.1",
                    alias: "grouping.texts.groupContinuedMessage"
                },
                "grouping.groupContinuesMessage": {
                    since: "16.1",
                    alias: "grouping.texts.groupContinuesMessage"
                },
                "export.texts.excelFormat": {
                    since: "16.1",
                    alias: "export.texts.exportAll"
                },
                "export.texts.exportToExcel": {
                    since: "16.1",
                    alias: "export.texts.exportAll"
                },
                "export.texts.selectedRows": {
                    since: "16.1",
                    alias: "export.texts.exportSelectedRows"
                }
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: {
                    platform: "ios"
                },
                options: {
                    showRowLines: true
                }
            }, {
                device: function() {
                    return browser.webkit
                },
                options: {
                    loadingTimeout: 30,
                    loadPanel: {
                        animation: {
                            show: {
                                easing: "cubic-bezier(1, 0, 1, 0)",
                                duration: 500,
                                from: {
                                    opacity: 0
                                },
                                to: {
                                    opacity: 1
                                }
                            }
                        }
                    }
                }
            }, {
                device: function(device) {
                    return "desktop" !== device.deviceType
                },
                options: {
                    grouping: {
                        expandMode: "rowClick"
                    }
                }
            }])
        },
        _init: function() {
            var that = this;
            that.callBase();
            gridCore.processModules(that, gridCore);
            callModuleItemsMethod(that, "init")
        },
        _clean: $.noop,
        _optionChanged: function(args) {
            var that = this;
            callModuleItemsMethod(that, "optionChanged", [args]);
            if (!args.handled) {
                that.callBase(args)
            }
        },
        _dimensionChanged: function() {
            this.updateDimensions(true)
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this.updateDimensions()
            }
        },
        _renderContentImpl: function() {
            this.getView("gridView").render(this.element())
        },
        _renderContent: function() {
            var that = this;
            commonUtils.deferRender(function() {
                that._renderContentImpl()
            })
        },
        _getTemplate: function(templateName) {
            var template = templateName;
            if (commonUtils.isString(template) && "#" === template[0]) {
                template = $(templateName);
                logger.warn(DATAGRID_DEPRECATED_TEMPLATE_WARNING)
            }
            return this.callBase(template)
        },
        _dispose: function() {
            var that = this;
            that.callBase();
            callModuleItemsMethod(that, "dispose")
        },
        isReady: function() {
            return this.getController("data").isReady()
        },
        beginUpdate: function() {
            var that = this;
            that.callBase();
            callModuleItemsMethod(that, "beginUpdate")
        },
        endUpdate: function() {
            var that = this;
            callModuleItemsMethod(that, "endUpdate");
            that.callBase()
        },
        getController: function(name) {
            return this._controllers[name]
        },
        getView: function(name) {
            return this._views[name]
        },
        focus: function(element) {
            this.callBase();
            if (commonUtils.isDefined(element)) {
                this.getController("keyboardNavigation").focus(element)
            }
        }
    });
    DataGrid.registerModule = gridCore.registerModule.bind(gridCore);
    registerComponent("dxDataGrid", DataGrid);
    module.exports = DataGrid
});
