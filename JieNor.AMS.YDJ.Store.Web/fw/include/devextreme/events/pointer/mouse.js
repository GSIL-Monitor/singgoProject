/** 
 * DevExtreme (events/pointer/mouse.js)
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
        BaseStrategy = require("./base"),
        Observer = require("./observer");
    var eventMap = {
        dxpointerdown: "mousedown",
        dxpointermove: "mousemove",
        dxpointerup: "mouseup",
        dxpointercancel: "",
        dxpointerover: "mouseover",
        dxpointerout: "mouseout",
        dxpointerenter: "mouseenter",
        dxpointerleave: "mouseleave"
    };
    var normalizeMouseEvent = function(e) {
        e.pointerId = 1;
        return {
            pointers: observer.pointers(),
            pointerId: 1
        }
    };
    var observer;
    var activated = false;
    var activateStrategy = function() {
        if (activated) {
            return
        }
        observer = new Observer(eventMap, function(a, b) {
            return true
        });
        activated = true
    };
    var MouseStrategy = BaseStrategy.inherit({
        ctor: function() {
            this.callBase.apply(this, arguments);
            activateStrategy()
        },
        _fireEvent: function(args) {
            return this.callBase($.extend(normalizeMouseEvent(args.originalEvent), args))
        }
    });
    MouseStrategy.map = eventMap;
    MouseStrategy.normalize = normalizeMouseEvent;
    MouseStrategy.activate = activateStrategy;
    MouseStrategy.resetObserver = function() {
        observer.reset()
    };
    module.exports = MouseStrategy
});
