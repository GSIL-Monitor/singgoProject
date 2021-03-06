/** 
 * DevExtreme (viz/tree_map/plain_data_source.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var proto = require("./tree_map.base").prototype;
    proto._optionChangesMap.idField = proto._optionChangesMap.parentField = "NODES_CREATE";
    proto._processDataSourceItems = function(items) {
        var i, currentItem, parentId, tmpItems, item, struct = {},
            idField = this._getOption("idField", true),
            parentField = this._getOption("parentField", true),
            rootNodes = [];
        if (!idField || !parentField || 0 === items.length) {
            return {
                items: items,
                isPlain: true
            }
        }
        for (i = 0; i < items.length; i++) {
            currentItem = items[i];
            parentId = currentItem[parentField];
            if (!!parentId) {
                struct[parentId] = struct[parentId] || {
                    items: []
                };
                tmpItems = struct[parentId].items
            } else {
                tmpItems = rootNodes
            }
            tmpItems.push(currentItem)
        }
        treeFiller({
            struct: struct,
            idField: idField
        }, rootNodes);
        for (item in struct) {
            struct[item] && rootNodes.push(struct[item])
        }
        return {
            items: rootNodes,
            isPlain: true
        }
    };

    function treeFiller(context, items) {
        var currentItem, i, id, struct = context.struct;
        for (i = 0; i < items.length; i++) {
            currentItem = items[i];
            id = currentItem[context.idField];
            if (struct[id]) {
                currentItem.items = struct[id].items;
                struct[id] = null;
                treeFiller(context, currentItem.items)
            }
        }
    }
});
