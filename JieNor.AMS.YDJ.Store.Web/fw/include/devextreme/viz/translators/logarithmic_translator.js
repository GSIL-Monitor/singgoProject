/** 
 * DevExtreme (viz/translators/logarithmic_translator.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var numericTranslator = require("./numeric_translator"),
        vizUtils = require("../core/utils"),
        commonUtils = require("../../core/utils/common"),
        raiseTo = vizUtils.raiseTo,
        getLog = vizUtils.getLog;
    module.exports = {
        translate: function(bp) {
            var that = this,
                specialValue = that.translateSpecialCase(bp);
            if (commonUtils.isDefined(specialValue)) {
                return specialValue
            }
            return numericTranslator.translate.call(that, getLog(bp, that._businessRange.base))
        },
        untranslate: function() {
            var result = numericTranslator.untranslate.apply(this, arguments);
            return null === result ? result : raiseTo(result, this._businessRange.base)
        },
        getInterval: numericTranslator.getInterval,
        _getValue: function(value) {
            return Math.pow(this._canvasOptions.base, value)
        },
        zoom: numericTranslator.zoom,
        getMinScale: numericTranslator.getMinScale,
        getScale: function(val1, val2) {
            var base = this._businessRange.base;
            val1 = commonUtils.isDefined(val1) ? getLog(val1, base) : void 0;
            val2 = commonUtils.isDefined(val2) ? getLog(val2, base) : void 0;
            return numericTranslator.getScale.call(this, val1, val2)
        },
        isValid: function(value) {
            return numericTranslator.isValid.call(this, getLog(value, this._businessRange.base))
        },
        parse: numericTranslator.parse,
        to: function(value) {
            return numericTranslator.to.call(this, getLog(value, this._businessRange.base))
        },
        from: function(position) {
            return raiseTo(numericTranslator.from.call(this, position), this._businessRange.base)
        },
        _add: function(value, diff, dir) {
            var b = this._businessRange.base;
            return raiseTo(numericTranslator._add(getLog(value, b), diff, dir), b)
        },
        isValueProlonged: numericTranslator.isValueProlonged
    }
});
