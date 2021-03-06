/** 
 * DevExtreme (data/odata/store.js)
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
        commonUtils = require("../../core/utils/common"),
        odataUtils = require("./utils"),
        proxyUrlFormatter = require("../proxy_url_formatter"),
        errorsModule = require("../errors"),
        query = require("../query"),
        Store = require("../abstract_store"),
        mixins = require("./mixins");
    require("./query_adapter");
    var convertSimpleKey = function(keyType, keyValue) {
        var converter = odataUtils.keyConverters[keyType];
        if (!converter) {
            throw errorsModule.errors.Error("E4014", keyType)
        }
        return converter(keyValue)
    };
    var ODataStore = Store.inherit({
        ctor: function(options) {
            this.callBase(options);
            this._extractServiceOptions(options);
            this._keyType = options.keyType;
            if (2 === this.version()) {
                this._updateMethod = "MERGE"
            } else {
                this._updateMethod = "PATCH"
            }
        },
        _customLoadOptions: function() {
            return ["expand", "customQueryParams"]
        },
        _byKeyImpl: function(key, extraOptions) {
            var params = {};
            if (extraOptions) {
                if (extraOptions.expand) {
                    params.$expand = $.map($.makeArray(extraOptions.expand), odataUtils.serializePropName).join()
                }
            }
            return this._sendRequest(this._byKeyUrl(key), "GET", params)
        },
        createQuery: function(loadOptions) {
            var url, queryOptions;
            loadOptions = loadOptions || {};
            queryOptions = {
                adapter: "odata",
                beforeSend: this._beforeSend,
                errorHandler: this._errorHandler,
                jsonp: this._jsonp,
                version: this._version,
                withCredentials: this._withCredentials,
                deserializeDates: this._deserializeDates,
                expand: loadOptions.expand,
                requireTotalCount: loadOptions.requireTotalCount
            };
            if (commonUtils.isDefined(loadOptions.urlOverride)) {
                url = loadOptions.urlOverride
            } else {
                url = this._url
            }
            if ("customQueryParams" in loadOptions) {
                var params = mixins.escapeServiceOperationParams(loadOptions.customQueryParams, this.version());
                if (4 === this.version()) {
                    url = mixins.formatFunctionInvocationUrl(url, params)
                } else {
                    queryOptions.params = params
                }
            }
            return query(url, queryOptions)
        },
        _insertImpl: function(values) {
            this._requireKey();
            var that = this,
                d = $.Deferred();
            $.when(this._sendRequest(this._url, "POST", null, values)).done(function(serverResponse) {
                d.resolve(values, that.keyOf(serverResponse))
            }).fail(d.reject);
            return d.promise()
        },
        _updateImpl: function(key, values) {
            var d = $.Deferred();
            $.when(this._sendRequest(this._byKeyUrl(key), this._updateMethod, null, values)).done(function() {
                d.resolve(key, values)
            }).fail(d.reject);
            return d.promise()
        },
        _removeImpl: function(key) {
            var d = $.Deferred();
            $.when(this._sendRequest(this._byKeyUrl(key), "DELETE")).done(function() {
                d.resolve(key)
            }).fail(d.reject);
            return d.promise()
        },
        _byKeyUrl: function(key, useOriginalHost) {
            var keyObj = key,
                keyType = this._keyType,
                baseUrl = useOriginalHost ? proxyUrlFormatter.formatLocalUrl(this._url) : this._url;
            if ($.isPlainObject(keyType)) {
                keyObj = {};
                $.each(keyType, function(subKeyName, subKeyType) {
                    keyObj[subKeyName] = convertSimpleKey(subKeyType, key[subKeyName])
                })
            } else {
                if (keyType) {
                    keyObj = convertSimpleKey(keyType, key)
                }
            }
            return baseUrl + "(" + encodeURIComponent(odataUtils.serializeKey(keyObj, this._version)) + ")"
        }
    }, "odata").include(mixins.SharedMethods);
    module.exports = ODataStore
});
