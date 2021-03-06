/** 
 * DevExtreme (viz/vector_map/event_emitter.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery");
    var eventEmitterMethods = {
        _initEvents: function() {
            var i, names = this._eventNames,
                ii = names.length,
                events = this._events = {};
            for (i = 0; i < ii; ++i) {
                events[names[i]] = $.Callbacks()
            }
        },
        _disposeEvents: function() {
            var name, events = this._events;
            for (name in events) {
                events[name].empty()
            }
            this._events = null
        },
        on: function(handlers) {
            var name, events = this._events;
            for (name in handlers) {
                events[name].add(handlers[name])
            }
            return dispose;

            function dispose() {
                for (name in handlers) {
                    events[name].remove(handlers[name])
                }
            }
        },
        _fire: function(name, arg) {
            this._events[name].fire(arg)
        }
    };
    exports.makeEventEmitter = function(target) {
        var name, prot = target.prototype;
        for (name in eventEmitterMethods) {
            prot[name] = eventEmitterMethods[name]
        }
    }
});
