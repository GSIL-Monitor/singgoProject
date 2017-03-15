/** 
 * DevExtreme (data/odata/query_adapter.js)
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
        queryAdapters = require("../query_adapters"),
        odataUtils = require("./utils"),
        serializePropName = odataUtils.serializePropName,
        errors = require("../errors").errors,
        dataUtils = require("../utils");
    var DEFAULT_PROTOCOL_VERSION = 2;
    var compileCriteria = function() {
        var createBinaryOperationFormatter = function(op) {
            return function(prop, val) {
                return prop + " " + op + " " + val
            }
        };
        var createStringFuncFormatter = function(op, reverse) {
            return function(prop, val) {
                var bag = [op, "("];
                if (reverse) {
                    bag.push(val, ",", prop)
                } else {
                    bag.push(prop, ",", val)
                }
                bag.push(")");
                return bag.join("")
            }
        };
        var formatters = {
            "=": createBinaryOperationFormatter("eq"),
            "<>": createBinaryOperationFormatter("ne"),
            ">": createBinaryOperationFormatter("gt"),
            ">=": createBinaryOperationFormatter("ge"),
            "<": createBinaryOperationFormatter("lt"),
            "<=": createBinaryOperationFormatter("le"),
            startswith: createStringFuncFormatter("startswith"),
            endswith: createStringFuncFormatter("endswith")
        };
        var formattersV2 = $.extend({}, formatters, {
            contains: createStringFuncFormatter("substringof", true),
            notcontains: createStringFuncFormatter("not substringof", true)
        });
        var formattersV4 = $.extend({}, formatters, {
            contains: createStringFuncFormatter("contains"),
            notcontains: createStringFuncFormatter("not contains")
        });
        var compileBinary = function(criteria, protocolVersion) {
            criteria = dataUtils.normalizeBinaryCriterion(criteria);
            var op = criteria[1],
                formatters = 4 === protocolVersion ? formattersV4 : formattersV2,
                formatter = formatters[op.toLowerCase()];
            if (!formatter) {
                throw errors.Error("E4003", op)
            }
            return formatter(serializePropName(criteria[0]), odataUtils.serializeValue(criteria[2], protocolVersion))
        };
        var compileGroup = function(criteria, protocolVersion) {
            var groupOperator, nextGroupOperator, bag = [];
            $.each(criteria, function(index, criterion) {
                if ($.isArray(criterion)) {
                    if (bag.length > 1 && groupOperator !== nextGroupOperator) {
                        throw new errors.Error("E4019")
                    }
                    bag.push("(" + compileCore(criterion, protocolVersion) + ")");
                    groupOperator = nextGroupOperator;
                    nextGroupOperator = "and"
                } else {
                    nextGroupOperator = dataUtils.isConjunctiveOperator(this) ? "and" : "or"
                }
            });
            return bag.join(" " + groupOperator + " ")
        };
        var compileCore = function(criteria, protocolVersion) {
            if ($.isArray(criteria[0])) {
                return compileGroup(criteria, protocolVersion)
            }
            return compileBinary(criteria, protocolVersion)
        };
        return function(criteria, protocolVersion) {
            return compileCore(criteria, protocolVersion)
        }
    }();
    var createODataQueryAdapter = function(queryOptions) {
        var _select, _skip, _take, _countQuery, _sorting = [],
            _criteria = [],
            _expand = queryOptions.expand,
            _oDataVersion = queryOptions.version || DEFAULT_PROTOCOL_VERSION;
        var hasSlice = function() {
            return _skip || void 0 !== _take
        };
        var hasFunction = function(criterion) {
            for (var i = 0; i < criterion.length; i++) {
                if ($.isFunction(criterion[i])) {
                    return true
                }
                if ($.isArray(criterion[i]) && hasFunction(criterion[i])) {
                    return true
                }
            }
            return false
        };
        var generateSelectExpand = function() {
            var hasDot = function(x) {
                return /\./.test(x)
            };
            var generateSelect = function() {
                if (!_select) {
                    return
                }
                if (_oDataVersion < 4) {
                    return serializePropName(_select.join())
                }
                return $.grep(_select, hasDot, true).join()
            };
            var generateExpand = function() {
                var generatorV2 = function() {
                    var hash = {};
                    if (_expand) {
                        $.each($.makeArray(_expand), function() {
                            hash[serializePropName(this)] = 1
                        })
                    }
                    if (_select) {
                        $.each($.makeArray(_select), function() {
                            var path = this.split(".");
                            if (path.length < 2) {
                                return
                            }
                            path.pop();
                            hash[serializePropName(path.join("."))] = 1
                        })
                    }
                    return $.map(hash, function(k, v) {
                        return v
                    }).join()
                };
                var generatorV4 = function() {
                    var format = function(hash) {
                        var formatCore = function(hash) {
                            var ret = "",
                                select = [],
                                expand = [];
                            $.each(hash, function(key, value) {
                                if ($.isArray(value)) {
                                    [].push.apply(select, value)
                                }
                                if ($.isPlainObject(value)) {
                                    expand.push(key + formatCore(value))
                                }
                            });
                            if (select.length || expand.length) {
                                ret += "(";
                                if (select.length) {
                                    ret += "$select=" + $.map(select, serializePropName).join()
                                }
                                if (expand.length) {
                                    if (select.length) {
                                        ret += ";"
                                    }
                                    ret += "$expand=" + $.map(expand, serializePropName).join()
                                }
                                ret += ")"
                            }
                            return ret
                        };
                        var ret = [];
                        $.each(hash, function(key, value) {
                            ret.push(key + formatCore(value))
                        });
                        return ret.join()
                    };
                    var parseTree = function(exprs, root, stepper) {
                        var parseCore = function(exprParts, root, stepper) {
                            var result = stepper(root, exprParts.shift(), exprParts);
                            if (false === result) {
                                return
                            }
                            parseCore(exprParts, result, stepper)
                        };
                        $.each(exprs, function(_, x) {
                            parseCore(x.split("."), root, stepper)
                        })
                    };
                    var hash = {};
                    if (_expand || _select) {
                        if (_expand) {
                            parseTree($.makeArray(_expand), hash, function(node, key, path) {
                                node[key] = node[key] || {};
                                if (!path.length) {
                                    return false
                                }
                                return node[key]
                            })
                        }
                        if (_select) {
                            parseTree($.grep($.makeArray(_select), hasDot), hash, function(node, key, path) {
                                if (!path.length) {
                                    node[key] = node[key] || [];
                                    node[key].push(key);
                                    return false
                                }
                                return node[key] = node[key] || {}
                            })
                        }
                        return format(hash)
                    }
                };
                if (_oDataVersion < 4) {
                    return generatorV2()
                }
                return generatorV4()
            };
            var tuple = {
                $select: generateSelect() || void 0,
                $expand: generateExpand() || void 0
            };
            return tuple
        };
        var requestData = function() {
            var result = {};
            if (!_countQuery) {
                if (_sorting.length) {
                    result.$orderby = _sorting.join(",")
                }
                if (_skip) {
                    result.$skip = _skip
                }
                if (void 0 !== _take) {
                    result.$top = _take
                }
                var tuple = generateSelectExpand();
                result.$select = tuple.$select;
                result.$expand = tuple.$expand
            }
            if (_criteria.length) {
                result.$filter = compileCriteria(_criteria.length < 2 ? _criteria[0] : _criteria, _oDataVersion)
            }
            if (_countQuery) {
                result.$top = 0
            }
            if (queryOptions.requireTotalCount || _countQuery) {
                if (4 !== _oDataVersion) {
                    result.$inlinecount = "allpages"
                } else {
                    result.$count = "true"
                }
            }
            return result
        };
        return {
            exec: function(url) {
                return odataUtils.sendRequest(_oDataVersion, {
                    url: url,
                    params: $.extend(requestData(), queryOptions && queryOptions.params)
                }, {
                    beforeSend: queryOptions.beforeSend,
                    jsonp: queryOptions.jsonp,
                    withCredentials: queryOptions.withCredentials,
                    countOnly: _countQuery
                }, queryOptions.deserializeDates)
            },
            multiSort: function(args) {
                var rules;
                if (hasSlice()) {
                    return false
                }
                for (var i = 0; i < args.length; i++) {
                    var rule, getter = args[i][0],
                        desc = !!args[i][1];
                    if ("string" !== typeof getter) {
                        return false
                    }
                    rule = serializePropName(getter);
                    if (desc) {
                        rule += " desc"
                    }
                    rules = rules || [];
                    rules.push(rule)
                }
                _sorting = rules
            },
            slice: function(skipCount, takeCount) {
                if (hasSlice()) {
                    return false
                }
                _skip = skipCount;
                _take = takeCount
            },
            filter: function(criterion) {
                if (hasSlice()) {
                    return false
                }
                if (!$.isArray(criterion)) {
                    criterion = $.makeArray(arguments)
                }
                if (hasFunction(criterion)) {
                    return false
                }
                if (_criteria.length) {
                    _criteria.push("and")
                }
                _criteria.push(criterion)
            },
            select: function(expr) {
                if (_select || $.isFunction(expr)) {
                    return false
                }
                if (!$.isArray(expr)) {
                    expr = $.makeArray(arguments)
                }
                _select = expr
            },
            count: function() {
                _countQuery = true
            }
        }
    };
    queryAdapters.odata = createODataQueryAdapter;
    exports.odata = createODataQueryAdapter
});
