/** 
 * DevExtreme (viz/core/helpers.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var _extend = require("jquery").extend;

    function Flags() {
        this.reset()
    }
    Flags.prototype = {
        constructor: Flags,
        add: function(codes) {
            var i, ii = codes.length,
                flags = this._flags;
            for (i = 0; i < ii; ++i) {
                flags[codes[i]] = 1
            }
            this._k += ii
        },
        has: function(code) {
            return this._flags[code] > 0
        },
        count: function() {
            return this._k
        },
        reset: function() {
            this._flags = {};
            this._k = 0
        }
    };

    function combineMaps(baseMap, thisMap) {
        return baseMap !== thisMap ? _extend({}, baseMap, thisMap) : _extend({}, baseMap)
    }

    function combineLists(baseList, thisList) {
        return baseList !== thisList ? baseList.concat(thisList) : baseList.slice()
    }

    function buildTotalChanges(proto) {
        proto._totalChangesOrder = proto._optionChangesOrder.concat(proto._layoutChangesOrder, proto._customChangesOrder)
    }

    function addChange(settings) {
        var proto = this.prototype,
            code = settings.code;
        proto["_change_" + code] = settings.handler;
        if (settings.isThemeDependent) {
            proto._themeDependentChanges.push(code)
        }
        if (settings.option) {
            proto._optionChangesMap[settings.option] = code
        }(settings.isOptionChange ? proto._optionChangesOrder : proto._customChangesOrder).push(code);
        buildTotalChanges(proto)
    }

    function addPlugin(plugin) {
        this.prototype._plugins.push(plugin);
        if (plugin.members) {
            _extend(this.prototype, plugin.members)
        }
        if (plugin.customize) {
            plugin.customize(this)
        }
    }
    exports.replaceInherit = function(widget) {
        var _inherit = widget.inherit;
        widget.inherit = function(members) {
            var proto = this.prototype,
                plugins = proto._plugins,
                eventsMap = proto._eventsMap,
                initialChanges = proto._initialChanges,
                themeDependentChanges = proto._themeDependentChanges,
                optionChangesMap = proto._optionChangesMap,
                optionChangesOrder = proto._optionChangesOrder,
                layoutChangesOrder = proto._layoutChangesOrder,
                customChangesOrder = proto._customChangesOrder,
                ret = _inherit.apply(this, arguments);
            proto = ret.prototype;
            proto._plugins = combineLists(plugins, proto._plugins);
            proto._eventsMap = combineMaps(eventsMap, proto._eventsMap);
            proto._initialChanges = combineLists(initialChanges, proto._initialChanges);
            proto._themeDependentChanges = combineLists(themeDependentChanges, proto._themeDependentChanges);
            proto._optionChangesMap = combineMaps(optionChangesMap, proto._optionChangesMap);
            proto._optionChangesOrder = combineLists(optionChangesOrder, proto._optionChangesOrder);
            proto._layoutChangesOrder = combineLists(layoutChangesOrder, proto._layoutChangesOrder);
            proto._customChangesOrder = combineLists(customChangesOrder, proto._customChangesOrder);
            buildTotalChanges(proto);
            ret.addPlugin = addPlugin;
            return ret
        };
        widget.prototype._plugins = [];
        widget.addChange = addChange;
        widget.addPlugin = addPlugin
    };
    exports.changes = function() {
        return new Flags
    }
});
