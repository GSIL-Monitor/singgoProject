/** 
 * DevExtreme (events/pointer/base.js)
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
        browser = require("../../core/utils/browser"),
        Class = require("../../core/class"),
        eventUtils = require("../utils");
    var POINTER_EVENTS_NAMESPACE = "dxPointerEvents";
    var BaseStrategy = Class.inherit({
        ctor: function(eventName, originalEvents) {
            this._eventName = eventName;
            this._originalEvents = eventUtils.addNamespace(originalEvents, POINTER_EVENTS_NAMESPACE);
            this._handlerCount = 0;
            this.noBubble = this._isNoBubble()
        },
        _isNoBubble: function() {
            var eventName = this._eventName;
            return "dxpointerenter" === eventName || "dxpointerleave" === eventName
        },
        _handler: function(e) {
            var delegateTarget = this._getDelegateTarget(e);
            return this._fireEvent({
                type: this._eventName,
                pointerType: e.pointerType || eventUtils.eventSource(e),
                originalEvent: e,
                delegateTarget: delegateTarget,
                timeStamp: browser.mozilla ? (new Date).getTime() : e.timeStamp
            })
        },
        _getDelegateTarget: function(e) {
            var delegateTarget;
            if (this.noBubble) {
                delegateTarget = e.delegateTarget
            }
            return delegateTarget
        },
        _fireEvent: function(args) {
            return eventUtils.fireEvent(args)
        },
        setup: function() {
            return true
        },
        add: function(element, handleObj) {
            if (this._handlerCount <= 0 || this.noBubble) {
                this._selector = handleObj.selector;
                element = this.noBubble ? element : document;
                var that = this;
                $(element).on(this._originalEvents, this._selector, function(e) {
                    that._handler(e)
                })
            }
            if (!this.noBubble) {
                this._handlerCount++
            }
        },
        remove: function(element) {
            if (!this.noBubble) {
                this._handlerCount--
            }
        },
        teardown: function(element) {
            if (this._handlerCount && !this.noBubble) {
                return
            }
            element = this.noBubble ? element : document;
            if (this._originalEvents !== "." + POINTER_EVENTS_NAMESPACE) {
                $(element).off(this._originalEvents, this._selector)
            }
        },
        dispose: function(element) {
            element = this.noBubble ? element : document;
            $(element).off(this._originalEvents)
        }
    });
    module.exports = BaseStrategy
});
