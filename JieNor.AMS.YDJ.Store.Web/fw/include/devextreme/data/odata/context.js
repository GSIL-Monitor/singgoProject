/** 
 * DevExtreme (data/odata/context.js)
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
        Class = require("../../core/class"),
        commonUtils = require("../../core/utils/common"),
        errorsModule = require("../errors"),
        ODataStore = require("./store"),
        mixins = require("./mixins");
    require("./query_adapter");
    var ODataContext = Class.inherit({
        ctor: function(options) {
            var that = this;
            that._extractServiceOptions(options);
            that._errorHandler = options.errorHandler;
            $.each(options.entities || [], function(entityAlias, entityOptions) {
                that[entityAlias] = new ODataStore($.extend({}, options, {
                    url: that._url + "/" + encodeURIComponent(entityOptions.name || entityAlias)
                }, entityOptions))
            })
        },
        get: function(operationName, params) {
            return this.invoke(operationName, params, "GET")
        },
        invoke: function(operationName, params, httpMethod) {
            params = params || {};
            httpMethod = (httpMethod || "POST").toLowerCase();
            var payload, d = $.Deferred(),
                url = this._url + "/" + encodeURIComponent(operationName);
            if (4 === this.version()) {
                if ("get" === httpMethod) {
                    url = mixins.formatFunctionInvocationUrl(url, mixins.escapeServiceOperationParams(params, this.version()));
                    params = null
                } else {
                    if ("post" === httpMethod) {
                        payload = params;
                        params = null
                    }
                }
            }
            $.when(this._sendRequest(url, httpMethod, mixins.escapeServiceOperationParams(params, this.version()), payload)).done(function(r) {
                if ($.isPlainObject(r) && operationName in r) {
                    r = r[operationName]
                }
                d.resolve(r)
            }).fail([this._errorHandler, errorsModule._errorHandler, d.reject]);
            return d.promise()
        },
        objectLink: function(entityAlias, key) {
            var store = this[entityAlias];
            if (!store) {
                throw errorsModule.errors.Error("E4015", entityAlias)
            }
            if (!commonUtils.isDefined(key)) {
                return null
            }
            return {
                __metadata: {
                    uri: store._byKeyUrl(key, true)
                }
            }
        }
    }).include(mixins.SharedMethods);
    module.exports = ODataContext
});
