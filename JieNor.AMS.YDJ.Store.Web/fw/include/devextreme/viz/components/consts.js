/** 
 * DevExtreme (viz/components/consts.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    module.exports = {
        events: {
            mouseover: "mouseover",
            mouseout: "mouseout",
            mousemove: "mousemove",
            touchstart: "touchstart",
            touchmove: "touchmove",
            touchend: "touchend",
            mousedown: "mousedown",
            mouseup: "mouseup",
            click: "click",
            selectSeries: "selectseries",
            deselectSeries: "deselectseries",
            selectPoint: "selectpoint",
            deselectPoint: "deselectpoint",
            showPointTooltip: "showpointtooltip",
            hidePointTooltip: "hidepointtooltip"
        },
        states: {
            hover: "hover",
            normal: "normal",
            selection: "selection",
            normalMark: 0,
            hoverMark: 1,
            selectedMark: 2,
            applyHover: "applyHover",
            applySelected: "applySelected",
            resetItem: "resetItem"
        },
        pieLabelIndent: 30,
        pieLabelSpacing: 10,
        pieSeriesSpacing: 4
    }
});
