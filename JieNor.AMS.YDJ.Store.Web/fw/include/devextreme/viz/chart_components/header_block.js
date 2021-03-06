/** 
 * DevExtreme (viz/chart_components/header_block.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        LayoutElementModule = require("../core/layout_element"),
        _extend = $.extend,
        _each = $.each;

    function HeaderBlock(elements) {}
    _extend(HeaderBlock.prototype, LayoutElementModule.LayoutElement.prototype, {
        update: function(elements, canvas) {
            this._elements = $.map(elements, function(element) {
                return element.getLayoutOptions() ? element : null
            });
            this._canvas = canvas
        },
        dispose: function() {
            this._elements = null
        },
        measure: function(size) {
            var result, that = this,
                layoutOptions = that.getLayoutOptions();
            if (layoutOptions) {
                result = {
                    size: [layoutOptions.width, layoutOptions.height],
                    alignment: [layoutOptions.horizontalAlignment, layoutOptions.verticalAlignment],
                    side: 1
                };
                _each(that._elements, function(_, elem) {
                    elem.draw(layoutOptions.width, layoutOptions.height, that._canvas)
                })
            }
            return result || null
        },
        getLayoutOptions: function() {
            var firstElement, layout, elementLayout, that = this,
                elements = that._elements,
                length = elements.length,
                i = 1;
            if (!length) {
                return null
            }
            firstElement = elements[0];
            layout = _extend(true, {}, firstElement.getLayoutOptions());
            layout.position = layout.position || {};
            for (i; i < length; i++) {
                elementLayout = elements[i].getLayoutOptions();
                if (elementLayout.height > layout.height) {
                    layout.height = elementLayout.height
                }
                layout.width += elementLayout.width;
                if (elementLayout.position) {
                    layout.position = elementLayout.position;
                    layout.verticalAlignment = elementLayout.position.vertical;
                    layout.horizontalAlignment = elementLayout.position.horizontal
                }
            }
            return layout
        },
        probeDraw: function(width, height) {
            this._elements.forEach(function(e) {
                e.probeDraw(width, height);
                width -= e.getLayoutOptions().width
            })
        },
        draw: function(width, height) {
            var canvas = this._canvas;
            this._elements.forEach(function(e) {
                e.draw(width, height, canvas);
                width -= e.getLayoutOptions().width
            })
        },
        shift: function(x, y) {
            _each(this._elements, function(_, elem) {
                elem.shift(x, y)
            })
        }
    });
    exports.HeaderBlock = HeaderBlock
});
