/** 
 * DevExtreme (events/utils.js)
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
        errors = require("../core/errors"),
        eventNS = $.event,
        hooksNS = eventNS.fixHooks;
    var eventSource = function() {
        var EVENT_SOURCES_REGEX = {
            dx: /^dx/i,
            mouse: /(mouse|wheel)/i,
            touch: /^touch/i,
            keyboard: /^key/i,
            pointer: /^(ms)?pointer/i
        };
        return function(e) {
            var result = "other";
            $.each(EVENT_SOURCES_REGEX, function(key) {
                if (this.test(e.type)) {
                    result = key;
                    return false
                }
            });
            return result
        }
    }();
    var isDxEvent = function(e) {
        return "dx" === eventSource(e)
    };
    var isNativeMouseEvent = function(e) {
        return "mouse" === eventSource(e)
    };
    var isNativeTouchEvent = function(e) {
        return "touch" === eventSource(e)
    };
    var isPointerEvent = function(e) {
        return "pointer" === eventSource(e)
    };
    var isMouseEvent = function(e) {
        return isNativeMouseEvent(e) || (isPointerEvent(e) || isDxEvent(e)) && "mouse" === e.pointerType
    };
    var isTouchEvent = function(e) {
        return isNativeTouchEvent(e) || (isPointerEvent(e) || isDxEvent(e)) && "touch" === e.pointerType
    };
    var isKeyboardEvent = function(e) {
        return "keyboard" === eventSource(e)
    };
    var isFakeClickEvent = function(e) {
        return 0 === e.screenX && !e.offsetX && 0 === e.pageX
    };
    var eventData = function(e) {
        return {
            x: e.pageX,
            y: e.pageY,
            time: e.timeStamp
        }
    };
    var eventDelta = function(from, to) {
        return {
            x: to.x - from.x,
            y: to.y - from.y,
            time: to.time - from.time || 1
        }
    };
    var hasTouches = function(e) {
        if (isNativeTouchEvent(e)) {
            return (e.originalEvent.touches || []).length
        }
        if (isDxEvent(e)) {
            return (e.pointers || []).length
        }
        return 0
    };
    var needSkipEvent = function(e) {
        var $target = $(e.target),
            touchInInput = $target.is("input, textarea, select");
        if ($target.is(".dx-skip-gesture-event *, .dx-skip-gesture-event")) {
            return true
        }
        if ("dxmousewheel" === e.type) {
            return $target.is("input[type='number'], textarea, select") && $target.is(":focus")
        }
        if (isMouseEvent(e)) {
            return touchInInput || e.which > 1
        }
        if (isTouchEvent(e)) {
            return touchInInput && $target.is(":focus")
        }
    };
    var createEvent = function(originalEvent, args) {
        var event = $.Event(originalEvent),
            fixHook = hooksNS[originalEvent.type] || eventNS.mouseHooks;
        var props = fixHook.props ? eventNS.props.concat(fixHook.props) : eventNS.props,
            propIndex = props.length;
        while (propIndex--) {
            var prop = props[propIndex];
            event[prop] = originalEvent[prop]
        }
        if (args) {
            $.extend(event, args)
        }
        return fixHook.filter ? fixHook.filter(event, originalEvent) : event
    };
    var fireEvent = function(props) {
        var event = createEvent(props.originalEvent, props);
        eventNS.trigger(event, null, props.delegateTarget || event.target);
        return event
    };
    var addNamespace = function(eventNames, namespace) {
        if (!namespace) {
            throw errors.Error("E0017")
        }
        if ("string" === typeof eventNames) {
            if (eventNames.indexOf(" ") === -1) {
                return eventNames + "." + namespace
            }
            return addNamespace(eventNames.split(/\s+/g), namespace)
        }
        $.each(eventNames, function(index, eventName) {
            eventNames[index] = eventName + "." + namespace
        });
        return eventNames.join(" ")
    };
    module.exports = {
        eventSource: eventSource,
        isPointerEvent: isPointerEvent,
        isMouseEvent: isMouseEvent,
        isTouchEvent: isTouchEvent,
        isKeyboardEvent: isKeyboardEvent,
        isFakeClickEvent: isFakeClickEvent,
        hasTouches: hasTouches,
        eventData: eventData,
        eventDelta: eventDelta,
        needSkipEvent: needSkipEvent,
        createEvent: createEvent,
        fireEvent: fireEvent,
        addNamespace: addNamespace
    }
});
