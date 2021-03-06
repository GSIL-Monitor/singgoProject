/** 
 * DevExtreme (framework/action_executors.js)
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
        dataCoreUtils = require("../core/utils/data"),
        Route = require("./router").Route;

    function prepareNavigateOptions(options, actionArguments) {
        if (actionArguments.args) {
            var sourceEventArguments = actionArguments.args[0];
            options.jQueryEvent = sourceEventArguments.jQueryEvent
        }
        if ("dxCommand" === (actionArguments.component || {}).NAME) {
            $.extend(options, actionArguments.component.option())
        }
    }

    function preventDefaultLinkBehaviour(e) {
        if (!e) {
            return
        }
        var $targetElement = $(e.target);
        if ($targetElement.attr("href")) {
            e.preventDefault()
        }
    }
    var createActionExecutors = function(app) {
        return {
            routing: {
                execute: function(e) {
                    var routeValues, uri, action = e.action,
                        options = {};
                    if ($.isPlainObject(action)) {
                        routeValues = action.routeValues;
                        if (routeValues && $.isPlainObject(routeValues)) {
                            options = action.options
                        } else {
                            routeValues = action
                        }
                        uri = app.router.format(routeValues);
                        prepareNavigateOptions(options, e);
                        preventDefaultLinkBehaviour(options.jQueryEvent);
                        app.navigate(uri, options);
                        e.handled = true
                    }
                }
            },
            hash: {
                execute: function(e) {
                    if ("string" !== typeof e.action || "#" !== e.action.charAt(0)) {
                        return
                    }
                    var uriTemplate = e.action.substr(1),
                        args = e.args[0],
                        uri = uriTemplate;
                    var defaultEvaluate = function(expr) {
                        var getter = dataCoreUtils.compileGetter(expr),
                            model = e.args[0].model;
                        return getter(model)
                    };
                    var evaluate = args.evaluate || defaultEvaluate;
                    uri = uriTemplate.replace(/\{([^}]+)\}/g, function(entry, expr) {
                        expr = $.trim(expr);
                        if (expr.indexOf(",") > -1) {
                            expr = $.map(expr.split(","), $.trim)
                        }
                        var value = evaluate(expr);
                        if (void 0 === value) {
                            value = ""
                        }
                        value = Route.prototype.formatSegment(value);
                        return value
                    });
                    var options = {};
                    prepareNavigateOptions(options, e);
                    preventDefaultLinkBehaviour(options.jQueryEvent);
                    app.navigate(uri, options);
                    e.handled = true
                }
            },
            url: {
                execute: function(e) {
                    if ("string" === typeof e.action && "#" !== e.action.charAt(0)) {
                        document.location = e.action
                    }
                }
            }
        }
    };
    exports.createActionExecutors = createActionExecutors
});
