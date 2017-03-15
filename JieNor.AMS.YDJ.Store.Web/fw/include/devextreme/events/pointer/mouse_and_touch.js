/** 
 * DevExtreme (events/pointer/mouse_and_touch.js)
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
        MouseStrategy = require("./mouse"),
        TouchStrategy = require("./touch"),
        eventUtils = require("../utils");
    var eventMap = {
        dxpointerdown: "touchstart mousedown",
        dxpointermove: "touchmove mousemove",
        dxpointerup: "touchend mouseup",
        dxpointercancel: "touchcancel",
        dxpointerover: "mouseover",
        dxpointerout: "mouseout",
        dxpointerenter: "mouseenter",
        dxpointerleave: "mouseleave"
    };
    var activated = false;
    var activateStrategy = function() {
        if (activated) {
            return
        }
        MouseStrategy.activate();
        activated = true
    };
    var MouseAndTouchStrategy = BaseStrategy.inherit({
        EVENT_LOCK_TIMEOUT: 100,
        ctor: function() {
            this.callBase.apply(this, arguments);
            activateStrategy()
        },
        _handler: function(e) {
            var isMouseEvent = eventUtils.isMouseEvent(e);
            if (!isMouseEvent) {
                this._skipNextEvents = true
            }
            if (isMouseEvent && this._mouseLocked) {
                return
            }
            if (isMouseEvent && this._skipNextEvents) {
                this._skipNextEvents = false;
                this._mouseLocked = true;
                clearTimeout(this._unlockMouseTimer);
                var that = this;
                this._unlockMouseTimer = setTimeout(function() {
                    that._mouseLocked = false
                }, this.EVENT_LOCK_TIMEOUT);
                return
            }
            return this.callBase(e)
        },
        _fireEvent: function(args) {
            var isMouseEvent = eventUtils.isMouseEvent(args.originalEvent),
                normalizer = isMouseEvent ? MouseStrategy.normalize : TouchStrategy.normalize;
            return this.callBase($.extend(normalizer(args.originalEvent), args))
        },
        dispose: function() {
            this.callBase();
            this._skipNextEvents = false;
            this._mouseLocked = false;
            clearTimeout(this._unlockMouseTimer)
        }
    });
    MouseAndTouchStrategy.map = eventMap;
    MouseAndTouchStrategy.resetObserver = MouseStrategy.resetObserver;
    module.exports = MouseAndTouchStrategy
});
