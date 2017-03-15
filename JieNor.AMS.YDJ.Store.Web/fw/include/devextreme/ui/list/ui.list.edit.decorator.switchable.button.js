/** 
 * DevExtreme (ui/list/ui.list.edit.decorator.switchable.button.js)
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
        fx = require("../../animation/fx"),
        Button = require("../button"),
        messageLocalization = require("../../localization/message"),
        registerDecorator = require("./ui.list.edit.decorator_registry").register,
        SwitchableEditDecorator = require("./ui.list.edit.decorator.switchable");
    var SWITCHABLE_DELETE_BUTTON_CONTAINER_CLASS = "dx-list-switchable-delete-button-container",
        SWITCHABLE_DELETE_BUTTON_WRAPPER_CLASS = "dx-list-switchable-delete-button-wrapper",
        SWITCHABLE_DELETE_BUTTON_INNER_WRAPPER_CLASS = "dx-list-switchable-delete-button-inner-wrapper",
        SWITCHABLE_DELETE_BUTTON_CLASS = "dx-list-switchable-delete-button",
        SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION = 200;
    var SwitchableButtonEditDecorator = SwitchableEditDecorator.inherit({
        _init: function() {
            this.callBase.apply(this, arguments);
            var $buttonContainer = $("<div >").addClass(SWITCHABLE_DELETE_BUTTON_CONTAINER_CLASS),
                $buttonWrapper = $("<div />").addClass(SWITCHABLE_DELETE_BUTTON_WRAPPER_CLASS),
                $buttonInnerWrapper = $("<div />").addClass(SWITCHABLE_DELETE_BUTTON_INNER_WRAPPER_CLASS),
                $button = $("<div />").addClass(SWITCHABLE_DELETE_BUTTON_CLASS);
            this._list._createComponent($button, Button, {
                text: messageLocalization.format("dxListEditDecorator-delete"),
                type: "danger",
                onClick: $.proxy(function(e) {
                    this._deleteItem();
                    e.jQueryEvent.stopPropagation()
                }, this),
                _templates: {}
            });
            $buttonContainer.append($buttonWrapper);
            $buttonWrapper.append($buttonInnerWrapper);
            $buttonInnerWrapper.append($button);
            this._$buttonContainer = $buttonContainer
        },
        _enablePositioning: function($itemElement) {
            this.callBase.apply(this, arguments);
            fx.stop(this._$buttonContainer, true);
            this._$buttonContainer.appendTo($itemElement)
        },
        _disablePositioning: function() {
            this.callBase.apply(this, arguments);
            this._$buttonContainer.detach()
        },
        _animatePrepareDeleteReady: function() {
            var rtl = this._isRtlEnabled(),
                listWidth = this._list.element().width(),
                buttonWidth = this._buttonWidth(),
                fromValue = rtl ? listWidth : -buttonWidth,
                toValue = rtl ? listWidth - buttonWidth : 0;
            return fx.animate(this._$buttonContainer, {
                type: "custom",
                duration: SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION,
                from: {
                    right: fromValue
                },
                to: {
                    right: toValue
                }
            })
        },
        _animateForgetDeleteReady: function() {
            var rtl = this._isRtlEnabled(),
                listWidth = this._list.element().width(),
                buttonWidth = this._buttonWidth(),
                fromValue = rtl ? listWidth - buttonWidth : 0,
                toValue = rtl ? listWidth : -buttonWidth;
            return fx.animate(this._$buttonContainer, {
                type: "custom",
                duration: SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION,
                from: {
                    right: fromValue
                },
                to: {
                    right: toValue
                }
            })
        },
        _buttonWidth: function() {
            if (!this._buttonContainerWidth) {
                this._buttonContainerWidth = this._$buttonContainer.outerWidth()
            }
            return this._buttonContainerWidth
        },
        dispose: function() {
            if (this._$buttonContainer) {
                this._$buttonContainer.remove()
            }
            this.callBase.apply(this, arguments)
        }
    });
    var TOGGLE_DELETE_SWITCH_CONTAINER_CLASS = "dx-list-toggle-delete-switch-container",
        TOGGLE_DELETE_SWITCH_CLASS = "dx-list-toggle-delete-switch";
    registerDecorator("delete", "toggle", SwitchableButtonEditDecorator.inherit({
        beforeBag: function(config) {
            var $itemElement = config.$itemElement,
                $container = config.$container;
            var $toggle = $("<div />").addClass(TOGGLE_DELETE_SWITCH_CLASS);
            this._list._createComponent($toggle, Button, {
                icon: "toggle-delete",
                onClick: $.proxy(function(e) {
                    this._toggleDeleteReady($itemElement);
                    e.jQueryEvent.stopPropagation()
                }, this),
                _templates: {}
            });
            $container.addClass(TOGGLE_DELETE_SWITCH_CONTAINER_CLASS);
            $container.append($toggle)
        }
    }));
    registerDecorator("delete", "slideButton", SwitchableButtonEditDecorator.inherit({
        _shouldHandleSwipe: true,
        _swipeEndHandler: function($itemElement, args) {
            if (0 !== args.targetOffset) {
                this._toggleDeleteReady($itemElement)
            }
            return true
        }
    }));
    module.exports = SwitchableButtonEditDecorator
});
