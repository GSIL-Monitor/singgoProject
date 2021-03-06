/** 
 * DevExtreme (core/utils/icon.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery");
    var getImageSourceType = function(source) {
        if (!source || "string" !== typeof source) {
            return false
        }
        if (/data:.*base64|\.|\//.test(source)) {
            return "image"
        }
        if (/^[\w-_]+$/.test(source)) {
            return "dxIcon"
        }
        return "fontIcon"
    };
    var getImageContainer = function(source) {
        var imageType = getImageSourceType(source),
            ICON_CLASS = "dx-icon";
        switch (imageType) {
            case "image":
                return $("<img>", {
                    src: source
                }).addClass(ICON_CLASS);
            case "fontIcon":
                return $("<i>", {
                    "class": ICON_CLASS + " " + source
                });
            case "dxIcon":
                return $("<i>", {
                    "class": ICON_CLASS + " " + ICON_CLASS + "-" + source
                });
            default:
                return null
        }
    };
    exports.getImageSourceType = getImageSourceType;
    exports.getImageContainer = getImageContainer
});
