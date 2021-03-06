/** 
 * DevExtreme (ui/widget/ui.template.dynamic.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Mobile, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        TemplateBase = require("./ui.template_base");
    var DynamicTemplate = TemplateBase.inherit({
        ctor: function(compileFunction, owner) {
            this.callBase($(), owner);
            this._compileFunction = compileFunction
        },
        _renderCore: function(options) {
            var compiledTemplate = this._compileFunction(options);
            var renderResult = compiledTemplate.render(options);
            if (compiledTemplate.owner() === this) {
                compiledTemplate.dispose()
            }
            return renderResult
        }
    });
    module.exports = DynamicTemplate
});
