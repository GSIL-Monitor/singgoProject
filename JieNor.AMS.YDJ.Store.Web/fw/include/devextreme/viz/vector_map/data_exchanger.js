/** 
 * DevExtreme (viz/vector_map/data_exchanger.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var _Callbacks = require("jquery").Callbacks;

    function DataExchanger() {
        this._store = {}
    }
    DataExchanger.prototype = {
        constructor: DataExchanger,
        dispose: function() {
            this._store = null;
            return this
        },
        _get: function(category, name) {
            var store = this._store[category] || (this._store[category] = {});
            return store[name] || (store[name] = {
                callbacks: _Callbacks()
            })
        },
        set: function(category, name, data) {
            var item = this._get(category, name);
            item.data = data;
            item.callbacks.fire(data);
            return this
        },
        bind: function(category, name, callback) {
            var item = this._get(category, name);
            item.callbacks.add(callback);
            item.data && callback(item.data);
            return this
        },
        unbind: function(category, name, callback) {
            var item = this._get(category, name);
            item.callbacks.remove(callback);
            return this
        }
    };
    exports.DataExchanger = DataExchanger
});
