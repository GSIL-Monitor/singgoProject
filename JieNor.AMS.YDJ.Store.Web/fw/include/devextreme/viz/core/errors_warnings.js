/** 
 * DevExtreme (viz/core/errors_warnings.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var errorUtils = require("../../core/utils/error"),
        errors = require("../../core/errors");
    module.exports = errorUtils(errors.ERROR_MESSAGES, {
        E2001: "Invalid data source",
        E2002: "Axis type and data type are incompatible",
        E2003: '"{0}" data source field contains data of unsupported type',
        E2004: '"{0}" data source field is inconsistent',
        E2101: "Unknown series type was specified: {0}",
        E2102: "Ambiguity occurred between two value axes with the same name",
        E2103: '"{0}" option must be a function',
        E2104: "Invalid logarithm base",
        E2105: 'Invalid value of a "{0}"',
        E2106: "Invalid visible range",
        E2202: "Invalid scale {0} value",
        E2203: 'The "{0}" field of the "selectedRange" configuration object is not valid',
        W2002: "The {0} data field is absent",
        W2003: "Tick interval is too small",
        W2101: 'The "{0}" pane does not exist; the last pane is used by default',
        W2102: 'Value axis with the "{0}" name was created automatically',
        W2103: "Chart title was hidden due to container size",
        W2104: "Legend was hidden due to container size",
        W2105: 'Title of "{0}" axis was hidden due to container size',
        W2106: 'Labels of "{0}" axis were hidden due to container size',
        W2107: "Export menu was hidden due to container size",
        W2301: "Invalid value range"
    })
});
