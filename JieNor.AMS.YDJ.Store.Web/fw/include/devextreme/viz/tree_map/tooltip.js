/** 
 * DevExtreme (viz/tree_map/tooltip.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var proto = require("./tree_map.base").prototype,
        common = require("./common");
    require("./api");
    common.expand(proto, "_extendProxyType", function(proto) {
        var that = this;
        proto.showTooltip = function(coords) {
            that._showTooltip(this._id, coords)
        }
    });
    common.expand(proto, "_onNodesCreated", function() {
        if (this._tooltipIndex >= 0) {
            this._tooltip.hide()
        }
        this._tooltipIndex = -1
    });
    common.expand(proto, "_onTilingPerformed", function() {
        if (this._tooltipIndex >= 0) {
            this._moveTooltip(this._nodes[this._tooltipIndex])
        }
    });

    function getCoords(rect, renderer) {
        var offset = renderer.getRootOffset();
        return [(rect[0] + rect[2]) / 2 + offset.left, (rect[1] + rect[3]) / 2 + offset.top]
    }
    proto._showTooltip = function(index, coords) {
        var node, state, that = this,
            tooltip = that._tooltip;
        if (tooltip.isEnabled()) {
            node = that._nodes[index];
            state = that._tooltipIndex === index || tooltip.show({
                value: node.value,
                valueText: tooltip.formatValue(node.value),
                node: node.proxy
            }, {
                x: 0,
                y: 0,
                offset: 0
            }, {
                node: node.proxy
            });
            if (state) {
                that._moveTooltip(node, coords)
            } else {
                tooltip.hide()
            }
            that._tooltipIndex = state ? index : -1
        }
    };
    proto._moveTooltip = function(node, coords) {
        var xy = coords || node.rect && getCoords(node.rect, this._renderer) || [-1e3, -1e3];
        this._tooltip.move(xy[0], xy[1], 0)
    };
    proto.hideTooltip = function() {
        if (this._tooltipIndex >= 0) {
            this._tooltipIndex = -1;
            this._tooltip.hide()
        }
    };
    require("./tree_map.base").addPlugin(require("../core/tooltip").plugin)
});
