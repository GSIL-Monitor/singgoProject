/** 
 * DevExtreme (data/local_store.js)
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
        Class = require("../core/class"),
        abstract = Class.abstract,
        errors = require("./errors").errors,
        ArrayStore = require("./array_store");
    var LocalStoreBackend = Class.inherit({
        ctor: function(store, storeOptions) {
            this._store = store;
            this._dirty = false;
            var immediate = this._immediate = storeOptions.immediate;
            var flushInterval = Math.max(100, storeOptions.flushInterval || 1e4);
            if (!immediate) {
                var saveProxy = $.proxy(this.save, this);
                setInterval(saveProxy, flushInterval);
                $(window).on("beforeunload", saveProxy);
                if (window.cordova) {
                    document.addEventListener("pause", saveProxy, false)
                }
            }
        },
        notifyChanged: function() {
            this._dirty = true;
            if (this._immediate) {
                this.save()
            }
        },
        load: function() {
            this._store._array = this._loadImpl();
            this._dirty = false
        },
        save: function() {
            if (!this._dirty) {
                return
            }
            this._saveImpl(this._store._array);
            this._dirty = false
        },
        _loadImpl: abstract,
        _saveImpl: abstract
    });
    var DomLocalStoreBackend = LocalStoreBackend.inherit({
        ctor: function(store, storeOptions) {
            this.callBase(store, storeOptions);
            var name = storeOptions.name;
            if (!name) {
                throw errors.Error("E4013")
            }
            this._key = "dx-data-localStore-" + name
        },
        _loadImpl: function() {
            var raw = localStorage.getItem(this._key);
            if (raw) {
                return JSON.parse(raw)
            }
            return []
        },
        _saveImpl: function(array) {
            if (!array.length) {
                localStorage.removeItem(this._key)
            } else {
                localStorage.setItem(this._key, JSON.stringify(array))
            }
        }
    });
    var localStoreBackends = {
        dom: DomLocalStoreBackend
    };
    var LocalStore = ArrayStore.inherit({
        ctor: function(options) {
            if ("string" === typeof options) {
                options = {
                    name: options
                }
            } else {
                options = options || {}
            }
            this.callBase(options);
            this._backend = new localStoreBackends[options.backend || "dom"](this, options);
            this._backend.load()
        },
        clear: function() {
            this.callBase();
            this._backend.notifyChanged()
        },
        _insertImpl: function(values) {
            var b = this._backend;
            return this.callBase(values).done($.proxy(b.notifyChanged, b))
        },
        _updateImpl: function(key, values) {
            var b = this._backend;
            return this.callBase(key, values).done($.proxy(b.notifyChanged, b))
        },
        _removeImpl: function(key) {
            var b = this._backend;
            return this.callBase(key).done($.proxy(b.notifyChanged, b))
        }
    }, "local");
    module.exports = LocalStore
});
