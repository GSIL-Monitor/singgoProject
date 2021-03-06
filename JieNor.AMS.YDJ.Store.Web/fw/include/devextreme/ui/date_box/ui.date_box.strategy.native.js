/** 
 * DevExtreme (ui/date_box/ui.date_box.strategy.native.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        DateBoxStrategy = require("./ui.date_box.strategy"),
        support = require("../../core/utils/support"),
        dateUtils = require("./ui.date_utils"),
        dateLocalization = require("../../localization/date");
    var NativeStrategy = DateBoxStrategy.inherit({
        NAME: "Native",
        popupConfig: $.noop,
        getParsedText: function(text) {
            if (!text) {
                return null
            }
            if ("datetime" === this.dateBox.option("type")) {
                return new Date(text.replace(/-/g, "/").replace("T", " ").split(".")[0])
            }
            return dateUtils.fromStandardDateFormat(text)
        },
        renderPopupContent: $.noop,
        _getWidgetName: $.noop,
        _getWidgetOptions: $.noop,
        _getDateBoxType: function() {
            var type = this.dateBox.option("type");
            if ($.inArray(type, dateUtils.SUPPORTED_FORMATS) === -1) {
                type = "date"
            } else {
                if ("datetime" === type && !support.inputType(type)) {
                    type = "datetime-local"
                }
            }
            return type
        },
        getDefaultOptions: function() {
            return {
                mode: this._getDateBoxType()
            }
        },
        getDisplayFormat: function(displayFormat) {
            var type = this._getDateBoxType();
            return displayFormat || dateLocalization.getPatternByFormat(dateUtils.FORMATS_MAP[type])
        },
        renderInputMinMax: function($input) {
            $input.attr({
                min: dateLocalization.format(this.dateBox.dateOption("min"), "yyyy-MM-dd"),
                max: dateLocalization.format(this.dateBox.dateOption("max"), "yyyy-MM-dd")
            })
        }
    });
    module.exports = NativeStrategy
});
