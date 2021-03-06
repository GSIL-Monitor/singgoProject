/** 
 * DevExtreme (viz/tree_map/tiling.slice_and_dice.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var tiling = require("./tiling");

    function sliceAndDice(data) {
        var items = data.items,
            sidesData = tiling.buildSidesData(data.rect, data.directions, data.isRotated ? 1 : 0);
        tiling.calculateRectangles(items, 0, data.rect, sidesData, {
            sum: data.sum,
            count: items.length,
            side: sidesData.variedSide
        })
    }
    tiling.addAlgorithm("sliceanddice", sliceAndDice);
    module.exports = sliceAndDice
});
