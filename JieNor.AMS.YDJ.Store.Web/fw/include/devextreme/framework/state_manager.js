/** 
 * DevExtreme (framework/state_manager.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var Class = require("../core/class"),
        $ = require("jquery");
    var MemoryKeyValueStorage = Class.inherit({
        ctor: function() {
            this.storage = {}
        },
        getItem: function(key) {
            return this.storage[key]
        },
        setItem: function(key, value) {
            this.storage[key] = value
        },
        removeItem: function(key) {
            delete this.storage[key]
        }
    });
    var StateManager = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.storage = options.storage || new MemoryKeyValueStorage;
            this.stateSources = options.stateSources || []
        },
        addStateSource: function(stateSource) {
            this.stateSources.push(stateSource)
        },
        removeStateSource: function(stateSource) {
            var index = $.inArray(stateSource, this.stateSources);
            if (index > -1) {
                this.stateSources.splice(index, 1);
                stateSource.removeState(this.storage)
            }
        },
        saveState: function() {
            var that = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.saveState(that.storage)
            })
        },
        restoreState: function() {
            var that = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.restoreState(that.storage)
            })
        },
        clearState: function() {
            var that = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.removeState(that.storage)
            })
        }
    });
    module.exports = StateManager;
    module.exports.MemoryKeyValueStorage = MemoryKeyValueStorage
});
