/** 
 * DevExtreme (viz/vector_map/theme_manager.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var BaseThemeManager = require("../core/base_theme_manager").BaseThemeManager;
    exports.ThemeManager = BaseThemeManager.inherit({
        _themeSection: "map",
        _fontFields: ["layer:area.label.font", "layer:marker:dot.label.font", "layer:marker:bubble.label.font", "layer:marker:pie.label.font", "layer:marker:image.label.font", "tooltip.font", "legend.font", "title.font", "title.subtitle.font", "loadingIndicator.font", "export.font"]
    })
});
