/** 
 * DevExtreme (ui/scroll_view/animator.js)
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
        Class = require("../../core/class"),
        abstract = Class.abstract,
        animationFrame = require("../../animation/frame");
    var Animator = Class.inherit({
        ctor: function() {
            this._finished = true;
            this._stopped = false;
            this._proxiedStepCore = $.proxy(this._stepCore, this)
        },
        start: function() {
            this._stopped = false;
            this._finished = false;
            this._stepCore()
        },
        stop: function() {
            this._stopped = true;
            animationFrame.cancelAnimationFrame(this._stepAnimationFrame)
        },
        _stepCore: function() {
            if (this._isStopped()) {
                this._stop();
                return
            }
            if (this._isFinished()) {
                this._finished = true;
                this._complete();
                return
            }
            this._step();
            this._stepAnimationFrame = animationFrame.requestAnimationFrame(this._proxiedStepCore)
        },
        _step: abstract,
        _isFinished: $.noop,
        _stop: $.noop,
        _complete: $.noop,
        _isStopped: function() {
            return this._stopped
        },
        inProgress: function() {
            return !(this._stopped || this._finished)
        }
    });
    module.exports = Animator
});
