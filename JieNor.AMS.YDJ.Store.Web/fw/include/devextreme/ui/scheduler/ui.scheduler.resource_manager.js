/** 
 * DevExtreme (ui/scheduler/ui.scheduler.resource_manager.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var $ = require("jquery"),
        Class = require("../../core/class"),
        arrayUtils = require("../../core/utils/array"),
        commonUtils = require("../../core/utils/common"),
        query = require("../../data/query"),
        dataCoreUtils = require("../../core/utils/data"),
        DataSourceModule = require("../../data/data_source/data_source");
    var getValueExpr = function(resource) {
            return resource.valueExpr || "id"
        },
        getDisplayExpr = function(resource) {
            return resource.displayExpr || "text"
        };
    var ResourceManager = Class.inherit({
        _wrapDataSource: function(dataSource) {
            if (dataSource instanceof DataSourceModule.DataSource) {
                return dataSource
            } else {
                return new DataSourceModule.DataSource({
                    store: DataSourceModule.normalizeDataSourceOptions(dataSource).store,
                    pageSize: 0
                })
            }
        },
        _mapResourceData: function(resource, data) {
            var valueGetter = dataCoreUtils.compileGetter(getValueExpr(resource)),
                displayGetter = dataCoreUtils.compileGetter(getDisplayExpr(resource));
            return $.map(data, function(item) {
                var result = {
                    id: valueGetter(item),
                    text: displayGetter(item)
                };
                if (item.color) {
                    result.color = item.color
                }
                return result
            })
        },
        _isMultipleResource: function(resourceField) {
            var result = false;
            $.each(this.getResources(), $.proxy(function(_, resource) {
                var field = this.getField(resource);
                if (field === resourceField) {
                    result = resource.allowMultiple;
                    return false
                }
            }, this));
            return result
        },
        ctor: function(resources) {
            this.setResources(resources)
        },
        getDataAccessors: function(field, type) {
            var result = null;
            $.each(this._dataAccessors[type], function(accessorName, accessors) {
                if (field === accessorName) {
                    result = accessors;
                    return false
                }
            });
            return result
        },
        getField: function(resource) {
            return resource.fieldExpr || resource.field
        },
        setResources: function(resources) {
            this._resources = resources;
            this._dataAccessors = {
                getter: {},
                setter: {}
            };
            this._resourceFields = $.map(resources || [], $.proxy(function(resource, index) {
                var field = this.getField(resource);
                this._dataAccessors.getter[field] = dataCoreUtils.compileGetter(field);
                this._dataAccessors.setter[field] = dataCoreUtils.compileSetter(field);
                return field
            }, this))
        },
        getResources: function() {
            return this._resources || []
        },
        getResourcesData: function() {
            return this._resourcesData || []
        },
        getEditors: function() {
            var result = [],
                that = this;
            $.each(this.getResources(), function(i, resource) {
                var field = that.getField(resource),
                    currentResourceItems = that._getResourceDataByField(field);
                result.push({
                    editorOptions: {
                        dataSource: currentResourceItems.length ? currentResourceItems : that._wrapDataSource(resource.dataSource),
                        displayExpr: getDisplayExpr(resource),
                        valueExpr: getValueExpr(resource)
                    },
                    dataField: field,
                    editorType: resource.allowMultiple ? "dxTagBox" : "dxSelectBox",
                    label: {
                        text: resource.label || field
                    }
                })
            });
            return result
        },
        _resourceLoader: {},
        getResourceDataByValue: function(field, value) {
            var that = this,
                result = $.Deferred();
            $.each(this.getResources(), function(_, resource) {
                var resourceField = that.getField(resource);
                if (resourceField === field) {
                    var dataSource = that._wrapDataSource(resource.dataSource),
                        valueExpr = getValueExpr(resource);
                    if (!that._resourceLoader[field]) {
                        that._resourceLoader[field] = dataSource.load()
                    }
                    that._resourceLoader[field].done(function(data) {
                        var filteredData = query(data).filter(valueExpr, value).toArray();
                        delete that._resourceLoader[field];
                        result.resolve(filteredData[0])
                    }).fail(function() {
                        delete that._resourceLoader[field];
                        result.reject()
                    });
                    return false
                }
            });
            return result.promise()
        },
        getResourcesFromItem: function(itemData, wrapOnlyMultipleResources) {
            var that = this,
                result = null;
            if (!commonUtils.isDefined(wrapOnlyMultipleResources)) {
                wrapOnlyMultipleResources = false
            }
            $.each(that._resourceFields, function(index, field) {
                $.each(itemData, function(fieldName, fieldValue) {
                    var tmp = {};
                    tmp[fieldName] = fieldValue;
                    var resourceData = that.getDataAccessors(field, "getter")(tmp);
                    if (resourceData) {
                        if (!result) {
                            result = {}
                        }
                        if (!wrapOnlyMultipleResources || wrapOnlyMultipleResources && that._isMultipleResource(field)) {
                            that.getDataAccessors(field, "setter")(tmp, arrayUtils.wrapToArray(resourceData))
                        } else {
                            that.getDataAccessors(field, "setter")(tmp, resourceData)
                        }
                        $.extend(result, tmp);
                        return true
                    }
                })
            });
            return result
        },
        loadResources: function(groups) {
            var result = $.Deferred(),
                that = this,
                deferreds = [];
            $.each(this.getResourcesByFields(groups), function(i, resource) {
                var deferred = $.Deferred(),
                    field = that.getField(resource);
                deferreds.push(deferred);
                that._wrapDataSource(resource.dataSource).load().done(function(data) {
                    deferred.resolve({
                        name: field,
                        items: that._mapResourceData(resource, data),
                        data: data
                    })
                }).fail(function() {
                    deferred.reject()
                })
            });
            $.when.apply(null, deferreds).done(function() {
                var data = Array.prototype.slice.call(arguments),
                    mapFunction = function(obj) {
                        return {
                            name: obj.name,
                            items: obj.items
                        }
                    };
                that._resourcesData = data;
                result.resolve(data.map(mapFunction))
            }).fail(function() {
                result.reject()
            });
            return result.promise()
        },
        getResourcesByFields: function(fields) {
            return $.grep(this.getResources(), $.proxy(function(resource) {
                var field = this.getField(resource);
                return $.inArray(field, fields) > -1
            }, this))
        },
        getResourceColor: function(field, value) {
            var color, result = $.Deferred(),
                resourceData = this._getResourceDataByField(field),
                resourceDataLength = resourceData.length;
            if (resourceDataLength) {
                for (var i = 0; i < resourceDataLength; i++) {
                    if (resourceData[i].id === value) {
                        color = resourceData[i].color;
                        break
                    }
                }
                result.resolve(color)
            } else {
                this.getResourceDataByValue(field, value).done(function(resourceData) {
                    if (resourceData) {
                        color = resourceData.color
                    }
                    result.resolve(color)
                }).fail(function() {
                    result.reject()
                })
            }
            return result.promise()
        },
        getResourceForPainting: function(groups) {
            var result, resources = this.getResources();
            $.each(resources, function(index, resource) {
                if (resource.useColorAsDefault || resource.mainColor) {
                    result = resource;
                    return false
                }
            });
            if (!result) {
                if ($.isArray(groups) && groups.length) {
                    resources = this.getResourcesByFields(groups)
                }
                result = resources[resources.length - 1]
            }
            return result
        },
        createResourcesTree: function(groups) {
            var leafIndex = 0,
                groupIndex = groupIndex || 0;

            function make(group, groupIndex, result, parent) {
                result = result || [];
                for (var i = 0; i < group.items.length; i++) {
                    var currentGroupItem = group.items[i];
                    var resultItem = {
                        name: group.name,
                        value: currentGroupItem.id,
                        title: currentGroupItem.text,
                        children: [],
                        parent: parent ? parent : null
                    };
                    result.push(resultItem);
                    var nextGroupIndex = groupIndex + 1;
                    if (groups[nextGroupIndex]) {
                        make.call(this, groups[nextGroupIndex], nextGroupIndex, resultItem.children, resultItem)
                    }
                    if (!resultItem.children.length) {
                        resultItem.leafIndex = leafIndex;
                        leafIndex++
                    }
                }
                return result
            }
            return make.call(this, groups[0], 0)
        },
        _hasGroupItem: function(appointmentResources, groupName, itemValue) {
            var group = this.getDataAccessors(groupName, "getter")(appointmentResources);
            if (group) {
                if ($.inArray(itemValue, group) > -1) {
                    return true
                }
            }
            return false
        },
        _getResourceDataByField: function(fieldName) {
            var loadedResources = this.getResourcesData(),
                currentResourceData = [];
            for (var i = 0, resourceCount = loadedResources.length; i < resourceCount; i++) {
                if (loadedResources[i].name === fieldName) {
                    currentResourceData = loadedResources[i].data;
                    break
                }
            }
            return currentResourceData
        },
        getResourceTreeLeaves: function(tree, appointmentResources, result) {
            result = result || [];
            for (var i = 0; i < tree.length; i++) {
                if (!this._hasGroupItem(appointmentResources, tree[i].name, tree[i].value)) {
                    continue
                }
                if (commonUtils.isDefined(tree[i].leafIndex)) {
                    result.push(tree[i].leafIndex)
                }
                if (tree[i].children) {
                    this.getResourceTreeLeaves(tree[i].children, appointmentResources, result)
                }
            }
            return result
        },
        groupAppointmentsByResources: function(appointments, resources) {
            var tree = this.createResourcesTree(resources),
                result = {};
            $.each(appointments, $.proxy(function(_, appointment) {
                var appointmentResources = this.getResourcesFromItem(appointment),
                    treeLeaves = this.getResourceTreeLeaves(tree, appointmentResources);
                for (var i = 0; i < treeLeaves.length; i++) {
                    if (!result[treeLeaves[i]]) {
                        result[treeLeaves[i]] = []
                    }
                    result[treeLeaves[i]].push(appointment)
                }
            }, this));
            return result
        },
        reduceResourcesTree: function(tree, existingAppointments, _result) {
            _result = _result ? _result.children : [];
            var that = this;
            tree.forEach(function(node, index) {
                var ok = false,
                    resourceName = node.name,
                    resourceValue = node.value,
                    resourceTitle = node.title,
                    resourceGetter = that.getDataAccessors(resourceName, "getter");
                existingAppointments.forEach(function(appointment) {
                    if (!ok) {
                        var resourceFromAppointment = resourceGetter(appointment);
                        if (commonUtils.isArray(resourceFromAppointment)) {
                            if (resourceFromAppointment.indexOf(resourceValue) > -1) {
                                _result.push({
                                    name: resourceName,
                                    value: resourceValue,
                                    title: resourceTitle,
                                    children: []
                                });
                                ok = true
                            }
                        } else {
                            if (resourceFromAppointment === resourceValue) {
                                _result.push({
                                    name: resourceName,
                                    value: resourceValue,
                                    title: resourceTitle,
                                    children: []
                                });
                                ok = true
                            }
                        }
                    }
                });
                if (ok && node.children && node.children.length) {
                    that.reduceResourcesTree(node.children, existingAppointments, _result[index])
                }
            });
            return _result
        }
    });
    module.exports = ResourceManager
});
