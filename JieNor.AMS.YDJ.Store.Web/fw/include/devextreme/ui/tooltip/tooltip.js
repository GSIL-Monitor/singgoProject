/** 
 * DevExtreme (ui/tooltip/tooltip.js)
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
        Guid = require("../../core/guid"),
        registerComponent = require("../../core/component_registrator"),
        Popover = require("../popover"),
        TOOLTIP_CLASS = "dx-tooltip",
        TOOLTIP_WRAPPER_CLASS = "dx-tooltip-wrapper";
    var Tooltip = Popover.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                toolbarItems: [],
                showCloseButton: false,
                showTitle: false,
                title: null,
                titleTemplate: null,
                onTitleRendered: null,
                bottomTemplate: null,
                propagateOutsideClick: true
            })
        },
        _render: function() {
            this.element().addClass(TOOLTIP_CLASS);
            this._wrapper().addClass(TOOLTIP_WRAPPER_CLASS);
            this.callBase()
        },
        _renderContent: function() {
            this.callBase();
            this._contentId = new Guid;
            this._$content.attr({
                id: this._contentId,
                role: "tooltip"
            });
            this._toggleAriaDescription(true)
        },
        _toggleAriaDescription: function(showing) {
            var $target = $(this.option("target")),
                label = showing ? this._contentId : void 0;
            this.setAria("describedby", label, $target)
        }
    });
    registerComponent("dxTooltip", Tooltip);
    module.exports = Tooltip
});
