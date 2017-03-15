/** 
 * DevExtreme (viz/vector_map/tooltip_viewer.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var TOOLTIP_OFFSET = 12;

    function TooltipViewer(params) {
        this._subscribeToTracker(params.tracker, params.tooltip, params.layerCollection)
    }
    TooltipViewer.prototype = {
        constructor: TooltipViewer,
        dispose: function() {
            this._offTracker();
            this._offTracker = null
        },
        _subscribeToTracker: function(tracker, tooltip, layerCollection) {
            this._offTracker = tracker.on({
                "focus-on": function(arg) {
                    var layer, proxy, result = false;
                    if (tooltip.isEnabled()) {
                        layer = layerCollection.byName(arg.data.name);
                        proxy = layer && layer.getProxy(arg.data.index);
                        if (proxy && tooltip.show(proxy, {
                                x: 0,
                                y: 0,
                                offset: 0
                            }, {
                                target: proxy
                            })) {
                            tooltip.move(arg.x, arg.y, TOOLTIP_OFFSET);
                            result = true
                        }
                    }
                    arg.done(result)
                },
                "focus-move": function(arg) {
                    tooltip.move(arg.x, arg.y, TOOLTIP_OFFSET)
                },
                "focus-off": function() {
                    tooltip.hide()
                }
            })
        }
    };
    exports.TooltipViewer = TooltipViewer
});
