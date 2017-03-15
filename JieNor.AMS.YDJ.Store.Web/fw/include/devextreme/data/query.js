/** 
 * DevExtreme (data/query.js)
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
        arrayQueryImpl = require("./array_query"),
        remoteQueryImpl = require("./remote_query");
    var queryImpl = {
        array: arrayQueryImpl,
        remote: remoteQueryImpl
    };
    var query = function() {
        var impl = $.isArray(arguments[0]) ? "array" : "remote";
        return queryImpl[impl].apply(this, arguments)
    };
    module.exports = query;
    module.exports.queryImpl = queryImpl
});
