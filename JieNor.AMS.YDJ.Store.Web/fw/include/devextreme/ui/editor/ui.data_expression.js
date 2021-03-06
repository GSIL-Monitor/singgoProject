/** 
 * DevExtreme (ui/editor/ui.data_expression.js)
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
        variableWrapper = require("../../core/utils/variable_wrapper"),
        dataCoreUtils = require("../../core/utils/data"),
        commonUtils = require("../../core/utils/common"),
        FunctionTemplate = require("../widget/ui.template.function"),
        DataHelperMixin = require("../collection/ui.data_helper"),
        DataSourceModule = require("../../data/data_source/data_source"),
        ArrayStore = require("../../data/array_store");
    var DataExpressionMixin = $.extend(DataHelperMixin, {
        _dataExpressionDefaultOptions: function() {
            return {
                items: [],
                dataSource: null,
                itemTemplate: "item",
                value: null,
                valueExpr: "this",
                displayExpr: void 0
            }
        },
        _initDataExpressions: function() {
            this._compileValueGetter();
            this._compileDisplayGetter();
            this._initDynamicTemplates();
            this._initDataSource();
            this._itemsToDataSource()
        },
        _itemsToDataSource: function() {
            if (!this.option("dataSource")) {
                this._dataSource = new DataSourceModule.DataSource({
                    store: new ArrayStore(this.option("items")),
                    pageSize: 0
                })
            }
        },
        _compileDisplayGetter: function() {
            this._displayGetter = dataCoreUtils.compileGetter(this._displayGetterExpr())
        },
        _displayGetterExpr: function() {
            return this.option("displayExpr")
        },
        _compileValueGetter: function() {
            this._valueGetter = dataCoreUtils.compileGetter(this._valueGetterExpr())
        },
        _valueGetterExpr: function() {
            return this.option("valueExpr") || "this"
        },
        _loadValue: function(value) {
            var deferred = $.Deferred();
            value = this._unwrappedValue(value);
            if (!commonUtils.isDefined(value)) {
                return deferred.reject().promise()
            }
            this._loadSingle(this._valueGetterExpr(), value).done($.proxy(function(item) {
                this._isValueEquals(this._valueGetter(item), value) ? deferred.resolve(item) : deferred.reject()
            }, this)).fail(function() {
                deferred.reject()
            });
            return deferred.promise()
        },
        _getCurrentValue: function() {
            return this.option("value")
        },
        _unwrappedValue: function(value) {
            value = commonUtils.isDefined(value) ? value : this._getCurrentValue();
            if (value && this._dataSource && "this" === this._valueGetterExpr()) {
                value = this._getItemKey(value)
            }
            return variableWrapper.unwrap(value)
        },
        _getItemKey: function(value) {
            var key = this._dataSource.key();
            if (commonUtils.isArray(key)) {
                var result = {};
                for (var i = 0, n = key.length; i < n; i++) {
                    result[key[i]] = value[key[i]]
                }
                return result
            }
            if (key && "object" === typeof value) {
                value = value[key]
            }
            return value
        },
        _isValueEquals: function(value1, value2) {
            var dataSourceKey = this._dataSource && this._dataSource.key();
            if (commonUtils.isArray(dataSourceKey)) {
                return this._compareByCompositeKey(value1, value2, dataSourceKey)
            }
            var isDefined = commonUtils.isDefined;
            var result = this._compareValues(value1, value2);
            if (!result && isDefined(value1) && isDefined(value2) && dataSourceKey) {
                result = this._compareByKey(value1, value2, dataSourceKey)
            }
            return result
        },
        _compareByCompositeKey: function(value1, value2, key) {
            for (var i = 0, n = key.length; i < n; i++) {
                if (value1[key[i]] !== value2[key[i]]) {
                    return false
                }
            }
            return true
        },
        _compareByKey: function(value1, value2, key) {
            var ensureDefined = commonUtils.ensureDefined;
            var unwrapObservable = variableWrapper.unwrap;
            var valueKey1 = ensureDefined(unwrapObservable(value1[key]), value1);
            var valueKey2 = ensureDefined(unwrapObservable(value2[key]), value2);
            return this._compareValues(valueKey1, valueKey2)
        },
        _compareValues: function(value1, value2) {
            return dataCoreUtils.toComparable(value1) === dataCoreUtils.toComparable(value2)
        },
        _initDynamicTemplates: function() {
            if (this._displayGetterExpr()) {
                this._dynamicTemplates.item = new FunctionTemplate($.proxy(function(data) {
                    return $("<div/>").text(this._displayGetter(data)).html()
                }, this))
            } else {
                delete this._dynamicTemplates.item
            }
        },
        _setCollectionWidgetItemTemplate: function() {
            this._initDynamicTemplates();
            this._setCollectionWidgetOption("itemTemplate", this._getTemplateByOption("itemTemplate"))
        },
        _dataExpressionOptionChanged: function(args) {
            switch (args.name) {
                case "items":
                    this._itemsToDataSource();
                    this._setCollectionWidgetOption("items");
                    break;
                case "dataSource":
                    this._initDataSource();
                    break;
                case "itemTemplate":
                    this._setCollectionWidgetItemTemplate();
                    break;
                case "valueExpr":
                    this._compileValueGetter();
                    break;
                case "displayExpr":
                    this._compileDisplayGetter();
                    this._setCollectionWidgetItemTemplate()
            }
        }
    });
    module.exports = DataExpressionMixin
});
