/** 
 * DevExtreme (viz/tree_map/hover.js)
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
        nodeProto = require("./node").prototype,
        common = require("./common"),
        _parseScalar = require("../core/utils").parseScalar,
        _buildRectAppearance = common.buildRectAppearance,
        STATE_CODE = 1;
    require("./api");
    require("./states");
    proto._eventsMap.onHoverChanged = {
        name: "hoverChanged"
    };
    common.expand(proto._handlers, "calculateAdditionalStates", function(states, options) {
        states[1] = options.hoverStyle ? _buildRectAppearance(options.hoverStyle) : {}
    });
    require("./tree_map.base").addChange({
        code: "HOVER_ENABLED",
        handler: function() {
            var hoverEnabled = _parseScalar(this._getOption("hoverEnabled", true), true);
            if (!hoverEnabled) {
                this.clearHover()
            }
            this._hoverEnabled = hoverEnabled
        },
        isThemeDependent: true,
        isOptionChange: true,
        option: "hoverEnabled"
    });
    nodeProto.statesMap[1] = 1;
    nodeProto.additionalStates.push(1);
    common.expand(proto, "_extendProxyType", function(proto) {
        var that = this;
        proto.setHover = function() {
            that._hoverNode(this._id)
        };
        proto.isHovered = function() {
            return that._hoverIndex === this._id
        }
    });
    common.expand(proto, "_onNodesCreated", function() {
        this._hoverIndex = -1
    });
    proto._applyHoverState = function(index, state) {
        setNodeStateRecursive(this._nodes[index], STATE_CODE, state);
        this._eventTrigger("hoverChanged", {
            node: this._nodes[index].proxy
        })
    };

    function setNodeStateRecursive(node, code, state) {
        var i, nodes = node.isNode() && node.nodes,
            ii = nodes && nodes.length;
        node.setState(code, state);
        for (i = 0; i < ii; ++i) {
            setNodeStateRecursive(nodes[i], code, state)
        }
    }
    proto._hoverNode = function(index) {
        var that = this,
            currentIndex = that._hoverIndex;
        if (that._hoverEnabled && currentIndex !== index) {
            that._context.suspend();
            that._hoverIndex = -1;
            if (currentIndex >= 0) {
                that._applyHoverState(currentIndex, false)
            }
            that._hoverIndex = index;
            if (index >= 0) {
                that._applyHoverState(index, true)
            }
            that._context.resume()
        }
    };
    proto.clearHover = function() {
        this._hoverNode(-1)
    }
});
