/** 
 * DevExtreme (viz/tree_map/common.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var _patchFontOptions = require("../core/utils").patchFontOptions;

    function empty() {}
    exports.empty = empty;

    function createChainExecutor() {
        var chain = [];
        executeChain.add = function(item) {
            chain.push(item)
        };
        return executeChain;

        function executeChain() {
            var i, ii = chain.length;
            for (i = 0; i < ii; ++i) {
                chain[i].apply(this, arguments)
            }
        }
    }
    exports.expand = function(target, name, expander) {
        var current = target[name];
        if (current.add) {
            current.add(expander)
        } else {
            if (current === empty) {
                current = expander
            } else {
                current = createChainExecutor();
                current.add(target[name]);
                current.add(expander)
            }
        }
        target[name] = current
    };
    exports.buildRectAppearance = function(option) {
        var border = option.border || {};
        return {
            fill: option.color,
            opacity: option.opacity,
            stroke: border.color,
            "stroke-width": border.width,
            "stroke-opacity": border.opacity,
            hatching: option.hatching
        }
    };
    exports.buildTextAppearance = function(options, filter) {
        return {
            attr: options["stroke-width"] ? {
                stroke: options.stroke,
                "stroke-width": options["stroke-width"],
                "stroke-opacity": options["stroke-opacity"],
                filter: filter
            } : {},
            css: _patchFontOptions(options.font)
        }
    }
});
