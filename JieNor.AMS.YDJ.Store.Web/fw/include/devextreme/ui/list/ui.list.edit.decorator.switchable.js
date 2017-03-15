/** 
 * DevExtreme (ui/list/ui.list.edit.decorator.switchable.js)
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
        EditDecorator = require("./ui.list.edit.decorator"),
        abstract = EditDecorator.abstract,
        eventUtils = require("../../events/utils"),
        pointerEvents = require("../../events/pointer"),
        feedbackEvents = require("../../events/core/emitter.feedback");
    var LIST_EDIT_DECORATOR = "dxListEditDecorator",
        POINTER_DOWN_EVENT_NAME = eventUtils.addNamespace(pointerEvents.down, LIST_EDIT_DECORATOR),
        ACTIVE_EVENT_NAME = eventUtils.addNamespace(feedbackEvents.active, LIST_EDIT_DECORATOR),
        LIST_ITEM_CONTENT_CLASS = "dx-list-item-content",
        SWITCHABLE_DELETE_READY_CLASS = "dx-list-switchable-delete-ready",
        SWITCHABLE_MENU_SHIELD_POSITIONING_CLASS = "dx-list-switchable-menu-shield-positioning",
        SWITCHABLE_DELETE_TOP_SHIELD_CLASS = "dx-list-switchable-delete-top-shield",
        SWITCHABLE_DELETE_BOTTOM_SHIELD_CLASS = "dx-list-switchable-delete-bottom-shield",
        SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS = "dx-list-switchable-menu-item-shield-positioning",
        SWITCHABLE_DELETE_ITEM_CONTENT_SHIELD_CLASS = "dx-list-switchable-delete-item-content-shield";
    var SwitchableEditDecorator = EditDecorator.inherit({
        _init: function() {
            this._$topShield = $("<div />").addClass(SWITCHABLE_DELETE_TOP_SHIELD_CLASS);
            this._$bottomShield = $("<div />").addClass(SWITCHABLE_DELETE_BOTTOM_SHIELD_CLASS);
            this._$itemContentShield = $("<div />").addClass(SWITCHABLE_DELETE_ITEM_CONTENT_SHIELD_CLASS);
            this._$topShield.on(POINTER_DOWN_EVENT_NAME, $.proxy(this._cancelDeleteReadyItem, this));
            this._$bottomShield.on(POINTER_DOWN_EVENT_NAME, $.proxy(this._cancelDeleteReadyItem, this));
            this._list.element().append(this._$topShield.toggle(false)).append(this._$bottomShield.toggle(false))
        },
        handleClick: function($itemElement) {
            return this._cancelDeleteReadyItem()
        },
        _cancelDeleteReadyItem: function() {
            if (!this._$readyToDeleteItem) {
                return false
            }
            this._cancelDelete(this._$readyToDeleteItem);
            return true
        },
        _cancelDelete: function($itemElement) {
            this._toggleDeleteReady($itemElement, false)
        },
        _toggleDeleteReady: function($itemElement, readyToDelete) {
            if (void 0 === readyToDelete) {
                readyToDelete = !this._isReadyToDelete($itemElement)
            }
            this._toggleShields($itemElement, readyToDelete);
            this._toggleScrolling(readyToDelete);
            this._cacheReadyToDeleteItem($itemElement, readyToDelete);
            this._animateToggleDelete($itemElement, readyToDelete)
        },
        _isReadyToDelete: function($itemElement) {
            return $itemElement.hasClass(SWITCHABLE_DELETE_READY_CLASS)
        },
        _toggleShields: function($itemElement, enabled) {
            this._list.element().toggleClass(SWITCHABLE_MENU_SHIELD_POSITIONING_CLASS, enabled);
            this._$topShield.toggle(enabled);
            this._$bottomShield.toggle(enabled);
            if (enabled) {
                this._updateShieldsHeight($itemElement)
            }
            this._toggleContentShield($itemElement, enabled)
        },
        _updateShieldsHeight: function($itemElement) {
            var $list = this._list.element(),
                listTopOffset = $list.offset().top,
                listHeight = $list.outerHeight(),
                itemTopOffset = $itemElement.offset().top,
                itemHeight = $itemElement.outerHeight(),
                dirtyTopShieldHeight = itemTopOffset - listTopOffset,
                dirtyBottomShieldHeight = listHeight - itemHeight - dirtyTopShieldHeight;
            this._$topShield.height(Math.max(dirtyTopShieldHeight, 0));
            this._$bottomShield.height(Math.max(dirtyBottomShieldHeight, 0))
        },
        _toggleContentShield: function($itemElement, enabled) {
            if (enabled) {
                $itemElement.find("." + LIST_ITEM_CONTENT_CLASS).first().append(this._$itemContentShield)
            } else {
                this._$itemContentShield.detach()
            }
        },
        _toggleScrolling: function(readyToDelete) {
            var scrollView = this._list.element().dxScrollView("instance");
            if (readyToDelete) {
                scrollView.on("start", this._cancelScrolling)
            } else {
                scrollView.off("start", this._cancelScrolling)
            }
        },
        _cancelScrolling: function(args) {
            args.jQueryEvent.cancel = true
        },
        _cacheReadyToDeleteItem: function($itemElement, cache) {
            if (cache) {
                this._$readyToDeleteItem = $itemElement
            } else {
                delete this._$readyToDeleteItem
            }
        },
        _animateToggleDelete: function($itemElement, readyToDelete) {
            if (readyToDelete) {
                this._enablePositioning($itemElement);
                this._prepareDeleteReady($itemElement);
                this._animatePrepareDeleteReady($itemElement)
            } else {
                this._forgetDeleteReady($itemElement);
                this._animateForgetDeleteReady($itemElement).done($.proxy(this._disablePositioning, this, $itemElement))
            }
        },
        _enablePositioning: function($itemElement) {
            $itemElement.addClass(SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS);
            $itemElement.on(ACTIVE_EVENT_NAME, $.noop)
        },
        _disablePositioning: function($itemElement) {
            $itemElement.removeClass(SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS);
            $itemElement.off(ACTIVE_EVENT_NAME)
        },
        _prepareDeleteReady: function($itemElement) {
            $itemElement.addClass(SWITCHABLE_DELETE_READY_CLASS)
        },
        _forgetDeleteReady: function($itemElement) {
            $itemElement.removeClass(SWITCHABLE_DELETE_READY_CLASS)
        },
        _animatePrepareDeleteReady: abstract,
        _animateForgetDeleteReady: abstract,
        _deleteItem: function($itemElement) {
            $itemElement = $itemElement || this._$readyToDeleteItem;
            if ($itemElement.is(".dx-state-disabled, .dx-state-disabled *")) {
                return
            }
            this._list.deleteItem($itemElement).always($.proxy(this._cancelDelete, this, $itemElement))
        },
        _isRtlEnabled: function() {
            return this._list.option("rtlEnabled")
        },
        dispose: function() {
            if (this._$topShield) {
                this._$topShield.remove()
            }
            if (this._$bottomShield) {
                this._$bottomShield.remove()
            }
            this.callBase.apply(this, arguments)
        }
    });
    module.exports = SwitchableEditDecorator
});
