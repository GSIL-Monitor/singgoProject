/** 
 * DevExtreme (events/dblclick.js)
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
        domUtils = require("../core/utils/dom"),
        Class = require("../core/class"),
        registerEvent = require("./core/event_registrator"),
        clickEvent = require("./click"),
        eventUtils = require("./utils");
    var DBLCLICK_EVENT_NAME = "dxdblclick",
        DBLCLICK_NAMESPACE = "dxDblClick",
        NAMESPACED_CLICK_EVENT = eventUtils.addNamespace(clickEvent.name, DBLCLICK_NAMESPACE),
        DBLCLICK_TIMEOUT = 300;
    var DblClick = Class.inherit({
        ctor: function() {
            this._handlerCount = 0;
            this._forgetLastClick()
        },
        _forgetLastClick: function() {
            this._firstClickTarget = null;
            this._lastClickTimeStamp = -DBLCLICK_TIMEOUT
        },
        add: function() {
            if (this._handlerCount <= 0) {
                $(document).on(NAMESPACED_CLICK_EVENT, $.proxy(this._clickHandler, this))
            }
            this._handlerCount++
        },
        _clickHandler: function(e) {
            var timeStamp = e.timeStamp || $.now();
            if (timeStamp - this._lastClickTimeStamp < DBLCLICK_TIMEOUT) {
                eventUtils.fireEvent({
                    type: DBLCLICK_EVENT_NAME,
                    target: domUtils.closestCommonParent(this._firstClickTarget, e.target),
                    originalEvent: e
                });
                this._forgetLastClick()
            } else {
                this._firstClickTarget = e.target;
                this._lastClickTimeStamp = timeStamp
            }
        },
        remove: function() {
            this._handlerCount--;
            if (this._handlerCount <= 0) {
                this._forgetLastClick();
                $(document).off(NAMESPACED_CLICK_EVENT)
            }
        }
    });
    registerEvent(DBLCLICK_EVENT_NAME, new DblClick);
    exports.name = DBLCLICK_EVENT_NAME
});
