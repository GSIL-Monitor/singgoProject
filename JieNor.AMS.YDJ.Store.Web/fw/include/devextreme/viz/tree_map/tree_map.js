/** 
 * DevExtreme (viz/tree_map/tree_map.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var dxTreeMap = module.exports = require("./tree_map.base");
    require("./tiling.squarified");
    require("./tiling.strip");
    require("./tiling.slice_and_dice");
    require("./colorizing.discrete");
    require("./colorizing.gradient");
    require("./colorizing.range");
    require("./api");
    require("./hover");
    require("./selection");
    require("./tooltip");
    require("./tracker");
    require("./drilldown");
    require("./plain_data_source");
    dxTreeMap.addPlugin(require("../core/export").plugin);
    dxTreeMap.addPlugin(require("../core/title").plugin);
    dxTreeMap.addPlugin(require("../core/loading_indicator").plugin)
});
