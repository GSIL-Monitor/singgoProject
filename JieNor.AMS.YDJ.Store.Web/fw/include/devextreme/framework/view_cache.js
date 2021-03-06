/** 
 * DevExtreme (framework/view_cache.js)
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
        EventsMixin = require("../core/events_mixin");
    var ViewCache = Class.inherit({
        ctor: function() {
            this._cache = {}
        },
        setView: function(key, viewInfo) {
            this._cache[key] = viewInfo
        },
        getView: function(key) {
            return this._cache[key]
        },
        removeView: function(key) {
            var result = this._cache[key];
            if (result) {
                delete this._cache[key];
                this.fireEvent("viewRemoved", [{
                    viewInfo: result
                }])
            }
            return result
        },
        clear: function() {
            var that = this;
            $.each(this._cache, function(key) {
                that.removeView(key)
            })
        },
        hasView: function(key) {
            return key in this._cache
        }
    }).include(EventsMixin);
    var NullViewCache = ViewCache.inherit({
        setView: function(key, viewInfo) {
            this.callBase(key, viewInfo);
            this.removeView(key)
        }
    });
    var ConditionalViewCacheDecorator = Class.inherit({
        ctor: function(options) {
            this._filter = options.filter;
            this._viewCache = options.viewCache;
            this.viewRemoved = this._viewCache.viewRemoved;
            this._events = this._viewCache._events
        },
        setView: function(key, viewInfo) {
            this._viewCache.setView(key, viewInfo);
            if (!this._filter(key, viewInfo)) {
                this._viewCache.removeView(key)
            }
        },
        getView: function(key) {
            return this._viewCache.getView(key)
        },
        removeView: function(key) {
            return this._viewCache.removeView(key)
        },
        clear: function() {
            return this._viewCache.clear()
        },
        hasView: function(key) {
            return this._viewCache.hasView(key)
        }
    }).include(EventsMixin);
    var DEFAULT_VIEW_CACHE_CAPACITY = 5;
    var CapacityViewCacheDecorator = Class.inherit({
        ctor: function(options) {
            this._keys = [];
            this._size = options.size || DEFAULT_VIEW_CACHE_CAPACITY;
            this._viewCache = options.viewCache;
            this.viewRemoved = this._viewCache.viewRemoved;
            this._events = this._viewCache._events
        },
        setView: function(key, viewInfo) {
            if (!this.hasView(key)) {
                if (this._keys.length === this._size) {
                    this.removeView(this._keys[0])
                }
                this._keys.push(key)
            }
            this._viewCache.setView(key, viewInfo)
        },
        getView: function(key) {
            var index = $.inArray(key, this._keys);
            if (index < 0) {
                return null
            }
            this._keys.push(key);
            this._keys.splice(index, 1);
            return this._viewCache.getView(key)
        },
        removeView: function(key) {
            var index = $.inArray(key, this._keys);
            if (index > -1) {
                this._keys.splice(index, 1)
            }
            return this._viewCache.removeView(key)
        },
        clear: function() {
            this._keys = [];
            return this._viewCache.clear()
        },
        hasView: function(key) {
            return this._viewCache.hasView(key)
        }
    }).include(EventsMixin);
    var HistoryDependentViewCacheDecorator = Class.inherit({
        ctor: function(options) {
            this._viewCache = options.viewCache || new ViewCache;
            this._navigationManager = options.navigationManager;
            this._navigationManager.on("itemRemoved", $.proxy(this._onNavigationItemRemoved, this));
            this.viewRemoved = this._viewCache.viewRemoved;
            this._events = this._viewCache._events
        },
        _onNavigationItemRemoved: function(item) {
            this.removeView(item.key)
        },
        setView: function(key, viewInfo) {
            this._viewCache.setView(key, viewInfo)
        },
        getView: function(key) {
            return this._viewCache.getView(key)
        },
        removeView: function(key) {
            return this._viewCache.removeView(key)
        },
        clear: function() {
            return this._viewCache.clear()
        },
        hasView: function(key) {
            return this._viewCache.hasView(key)
        }
    }).include(EventsMixin);
    module.exports = ViewCache;
    module.exports.NullViewCache = NullViewCache;
    module.exports.ConditionalViewCacheDecorator = ConditionalViewCacheDecorator;
    module.exports.CapacityViewCacheDecorator = CapacityViewCacheDecorator;
    module.exports.HistoryDependentViewCacheDecorator = HistoryDependentViewCacheDecorator
});
