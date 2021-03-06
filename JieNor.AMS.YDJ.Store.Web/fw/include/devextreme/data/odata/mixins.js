/** 
 * DevExtreme (data/odata/mixins.js)
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
        stringUtils = require("../../core/utils/string"),
        odataUtils = require("./utils");
    require("./query_adapter");
    var DEFAULT_PROTOCOL_VERSION = 2;
    var formatFunctionInvocationUrl = function(baseUrl, args) {
        return stringUtils.format("{0}({1})", baseUrl, $.map(args || {}, function(value, key) {
            return stringUtils.format("{0}={1}", key, value)
        }).join(","))
    };
    var escapeServiceOperationParams = function(params, version) {
        if (!params) {
            return params
        }
        var result = {};
        $.each(params, function(k, v) {
            result[k] = odataUtils.serializeValue(v, version)
        });
        return result
    };
    var SharedMethods = {
        _extractServiceOptions: function(options) {
            options = options || {};
            this._url = String(options.url).replace(/\/+$/, "");
            this._beforeSend = options.beforeSend;
            this._jsonp = options.jsonp;
            this._version = options.version || DEFAULT_PROTOCOL_VERSION;
            this._withCredentials = options.withCredentials;
            this._deserializeDates = options.deserializeDates
        },
        _sendRequest: function(url, method, params, payload) {
            return odataUtils.sendRequest(this.version(), {
                url: url,
                method: method,
                params: params || {},
                payload: payload
            }, {
                beforeSend: this._beforeSend,
                jsonp: this._jsonp,
                withCredentials: this._withCredentials
            }, this._deserializeDates)
        },
        version: function() {
            return this._version
        }
    };
    exports.SharedMethods = SharedMethods;
    exports.escapeServiceOperationParams = escapeServiceOperationParams;
    exports.formatFunctionInvocationUrl = formatFunctionInvocationUrl
});
