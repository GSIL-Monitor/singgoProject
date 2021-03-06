/** 
 * DevExtreme (data/abstract_store.js)
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
        Class = require("../core/class"),
        abstract = Class.abstract,
        EventsMixin = require("../core/events_mixin"),
        errorsModule = require("./errors"),
        dataUtils = require("./utils"),
        normalizeSortingInfo = dataUtils.normalizeSortingInfo,
        compileGetter = require("../core/utils/data").compileGetter,
        Query = require("./query"),
        storeImpl = {};

    function multiLevelGroup(query, groupInfo) {
        query = query.groupBy(groupInfo[0].selector);
        if (groupInfo.length > 1) {
            query = query.select(function(g) {
                return $.extend({}, g, {
                    items: multiLevelGroup(Query(g.items), groupInfo.slice(1)).toArray()
                })
            })
        }
        return query
    }

    function arrangeSortingInfo(groupInfo, sortInfo) {
        var filteredGroup = [];
        $.each(groupInfo, function(_, group) {
            var collision = $.grep(sortInfo, function(sort) {
                return group.selector === sort.selector
            });
            if (collision.length < 1) {
                filteredGroup.push(group)
            }
        });
        return filteredGroup.concat(sortInfo)
    }
    var Store = Class.inherit({
        ctor: function(options) {
            var that = this;
            options = options || {};
            $.each(["onLoaded", "onLoading", "onInserted", "onInserting", "onUpdated", "onUpdating", "onRemoved", "onRemoving", "onModified", "onModifying"], function(_, optionName) {
                if (optionName in options) {
                    that.on(optionName.slice(2).toLowerCase(), options[optionName])
                }
            });
            this._key = options.key;
            this._errorHandler = options.errorHandler;
            this._useDefaultSearch = true
        },
        _customLoadOptions: function() {
            return null
        },
        key: function() {
            return this._key
        },
        keyOf: function(obj) {
            if (!this._keyGetter) {
                this._keyGetter = compileGetter(this.key())
            }
            return this._keyGetter(obj)
        },
        _requireKey: function() {
            if (!this.key()) {
                throw errorsModule.errors.Error("E4005")
            }
        },
        load: function(options) {
            var that = this;
            options = options || {};
            this.fireEvent("loading", [options]);
            return this._withLock(this._loadImpl(options)).done(function(result, extra) {
                that.fireEvent("loaded", [result, options])
            })
        },
        _loadImpl: function(options) {
            var filter = options.filter,
                sort = options.sort,
                select = options.select,
                group = options.group,
                skip = options.skip,
                take = options.take,
                q = this.createQuery(options);
            if (filter) {
                q = q.filter(filter)
            }
            if (group) {
                group = normalizeSortingInfo(group)
            }
            if (sort || group) {
                sort = normalizeSortingInfo(sort || []);
                if (group) {
                    sort = arrangeSortingInfo(group, sort)
                }
                $.each(sort, function(index) {
                    q = q[index ? "thenBy" : "sortBy"](this.selector, this.desc)
                })
            }
            if (select) {
                q = q.select(select)
            }
            if (group) {
                q = multiLevelGroup(q, group)
            }
            if (take || skip) {
                q = q.slice(skip || 0, take)
            }
            return q.enumerate()
        },
        _withLock: function(task) {
            var result = $.Deferred();
            task.done(function() {
                var that = this,
                    args = arguments;
                dataUtils.processRequestResultLock.promise().done(function() {
                    result.resolveWith(that, args)
                })
            }).fail(function() {
                result.rejectWith(this, arguments)
            });
            return result
        },
        createQuery: abstract,
        totalCount: function(options) {
            return this._totalCountImpl(options)
        },
        _totalCountImpl: function(options) {
            options = options || {};
            var q = this.createQuery(options),
                group = options.group,
                filter = options.filter;
            if (filter) {
                q = q.filter(filter)
            }
            if (group) {
                group = normalizeSortingInfo(group);
                q = multiLevelGroup(q, group)
            }
            return q.count()
        },
        byKey: function(key, extraOptions) {
            return this._addFailHandlers(this._withLock(this._byKeyImpl(key, extraOptions)))
        },
        _byKeyImpl: abstract,
        insert: function(values) {
            var that = this;
            that.fireEvent("modifying");
            that.fireEvent("inserting", [values]);
            return that._addFailHandlers(that._insertImpl(values).done(function(callbackValues, callbackKey) {
                that.fireEvent("inserted", [callbackValues, callbackKey]);
                that.fireEvent("modified")
            }))
        },
        _insertImpl: abstract,
        update: function(key, values) {
            var that = this;
            that.fireEvent("modifying");
            that.fireEvent("updating", [key, values]);
            return that._addFailHandlers(that._updateImpl(key, values).done(function(callbackKey, callbackValues) {
                that.fireEvent("updated", [callbackKey, callbackValues]);
                that.fireEvent("modified")
            }))
        },
        _updateImpl: abstract,
        remove: function(key) {
            var that = this;
            that.fireEvent("modifying");
            that.fireEvent("removing", [key]);
            return that._addFailHandlers(that._removeImpl(key).done(function(callbackKey) {
                that.fireEvent("removed", [callbackKey]);
                that.fireEvent("modified")
            }))
        },
        _removeImpl: abstract,
        _addFailHandlers: function(deferred) {
            return deferred.fail(this._errorHandler, errorsModule._errorHandler)
        }
    }).include(EventsMixin);
    Store.create = function(alias, options) {
        if (!(alias in storeImpl)) {
            throw errorsModule.errors.Error("E4020", alias)
        }
        return new storeImpl[alias](options)
    };
    Store.inherit = function(inheritor) {
        return function(members, alias) {
            var type = inheritor.apply(this, [members]);
            if (alias) {
                storeImpl[alias] = type
            }
            return type
        }
    }(Store.inherit);
    module.exports = Store;
    module.exports.multiLevelGroup = multiLevelGroup;
    module.exports.arrangeSortingInfo = arrangeSortingInfo
});
