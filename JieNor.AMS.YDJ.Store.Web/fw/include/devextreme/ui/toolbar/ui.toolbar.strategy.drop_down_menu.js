/** 
 * DevExtreme (ui/toolbar/ui.toolbar.strategy.drop_down_menu.js)
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
        ToolbarStrategy = require("./ui.toolbar.strategy"),
        ToolbarMenu = require("./ui.toolbar.menu"),
        DropDownMenu = require("../drop_down_menu");
    var DropDownMenuStrategy = ToolbarStrategy.inherit({
        NAME: "dropDownMenu",
        render: function() {
            if (!this._hasVisibleMenuItems()) {
                return
            }
            this._renderMenuButtonContainer();
            this._renderWidget()
        },
        renderMenuItems: function() {
            if (!this._menu) {
                this.render()
            }
            this.callBase();
            if (this._menu && !this._menu.option("items").length) {
                this._menu.close()
            }
        },
        _menuWidgetClass: function() {
            return DropDownMenu
        },
        _widgetOptions: function() {
            return $.extend(this.callBase(), {
                deferRendering: true,
                menuWidget: ToolbarMenu,
                popupPosition: {
                    at: "bottom right",
                    my: "top right"
                }
            })
        },
        _getMenuItems: function() {
            var menuItems = this.callBase();
            this._toggleMenuVisibility(menuItems.length);
            return menuItems
        },
        _toggleMenuVisibility: function(value) {
            if (!this._menuContainer()) {
                return
            }
            this._menuContainer().toggleClass("dx-state-invisible", !value)
        },
        _menuContainer: function() {
            return this._$menuButtonContainer
        }
    });
    module.exports = DropDownMenuStrategy
});
