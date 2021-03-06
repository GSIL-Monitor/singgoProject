/** 
 * DevExtreme (ui/widget/ui.errors.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var errorUtils = require("../../core/utils/error"),
        errors = require("../../core/errors");
    module.exports = errorUtils(errors.ERROR_MESSAGES, {
        E1001: "Module '{0}'. Controller '{1}' is already registered",
        E1002: "Module '{0}'. Controller '{1}' must be inheritor of DevExpress.ui.dxDataGrid.Controller",
        E1003: "Module '{0}'. View '{1}' is already registered",
        E1004: "Module '{0}'. View '{1}' must be inheritor of DevExpress.ui.dxDataGrid.View",
        E1005: "Public method '{0}' is already registered",
        E1006: "Public method '{0}.{1}' is not exists",
        E1007: "State storing can not be provided due to the restrictions of your browser",
        E1010: "A template should contain dxTextBox widget",
        E1011: "You have to implement 'remove' method in dataStore used by dxList to be able to delete items",
        E1012: "Editing type '{0}' with name '{1}' not supported",
        E1016: "Unexpected type of data source is provided for a lookup column",
        E1018: "The 'collapseAll' method cannot be called when using a remote data source",
        E1019: "Search mode '{0}' is unavailable",
        E1020: "Type can not be changed after initialization",
        E1021: "{0} '{1}' you are trying to remove does not exist",
        E1022: "Markers option should be an array",
        E1023: "Routes option should be an array",
        E1024: "Google provider cannot be used in WinJS application",
        E1025: "This layout is too complex to render",
        E1026: "The 'custom' value is set to a summary item's summaryType option, but a function for calculating the custom summary is not assigned to the grid's calculateCustomSummary option",
        E1030: "Unknown dxScrollView refresh strategy: '{0}'",
        E1031: "Unknown subscription is detected in the dxScheduler widget: '{0}'",
        E1032: "Unknown start date is detected in an appointment of the dxScheduler widget: '{0}'",
        E1033: "Unknown step is specified for the scheduler's navigator: '{0}'",
        E1034: "The current browser does not implement an API required for saving files",
        E1035: "The editor could not be created because of the internal error: {0}",
        E1036: "Validation rules are not defined for any form item",
        E1037: "Invalid structure of grouped data",
        E1038: "Your browser does not support local storage for local web pages",
        E0139: "The cell position can not be calculated",
        E1040: "The key value should be unique within the data array",
        W1001: "Key option can not be modified after initialization",
        W1002: "Item '{0}' you are trying to select does not exist",
        W1003: "Group with key '{0}' in which you are trying to select items does not exist",
        W1004: "Item '{0}' you are trying to select in group '{1}' does not exist",
        W1005: "Due to column data types being unspecified, data has been loaded twice in order to apply initial filter settings. To resolve this issue, specify data types for all grid columns."
    })
});
