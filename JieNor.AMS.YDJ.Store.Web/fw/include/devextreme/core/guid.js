/** 
 * DevExtreme (core/guid.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var Class = require("./class");
    var Guid = Class.inherit({
        ctor: function(value) {
            if (value) {
                value = String(value)
            }
            this._value = this._normalize(value || this._generate())
        },
        _normalize: function(value) {
            value = value.replace(/[^a-f0-9]/gi, "").toLowerCase();
            while (value.length < 32) {
                value += "0"
            }
            return [value.substr(0, 8), value.substr(8, 4), value.substr(12, 4), value.substr(16, 4), value.substr(20, 12)].join("-")
        },
        _generate: function() {
            var value = "";
            for (var i = 0; i < 32; i++) {
                value += Math.round(15 * Math.random()).toString(16)
            }
            return value
        },
        toString: function() {
            return this._value
        },
        valueOf: function() {
            return this._value
        },
        toJSON: function() {
            return this._value
        }
    });
    module.exports = Guid
});
