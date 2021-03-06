/** 
 * DevExtreme (viz/tree_map/tracker.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var proto = require("./tree_map.base").prototype,
        common = require("./common"),
        _eventData = require("../../events/utils").eventData,
        _parseScalar = require("../core/utils").parseScalar,
        clickEventName = require("../../events/click").name,
        downPointerEventName = require("../../events/pointer").down,
        movePointerEventName = require("../../events/pointer").move,
        $ = require("jquery"),
        $doc = $(document),
        DATA_KEY_BASE = "__treemap_data_",
        dataKeyModifier = 0;
    require("./api");
    require("./hover");
    require("./tooltip");
    proto._eventsMap.onClick = {
        name: "click"
    };
    common.expand(proto, "_initCore", function() {
        var that = this,
            dataKey = DATA_KEY_BASE + dataKeyModifier++;
        that._tracker = new Tracker({
            widget: that,
            root: that._renderer.root,
            eventTrigger: that._eventTrigger,
            getData: function(e) {
                var target = e.target;
                return ("tspan" === target.tagName ? target.parentNode : target)[dataKey]
            },
            getProxy: function(index) {
                return that._nodes[index].proxy
            },
            getCoords: function(e) {
                var data = _eventData(e),
                    offset = that._renderer.getRootOffset();
                return [data.x - offset.left, data.y - offset.top]
            }
        });
        that._handlers.setTrackerData = function(node, element) {
            element.data(dataKey, node._id)
        }
    });
    common.expand(proto, "_disposeCore", function() {
        this._tracker.dispose()
    });
    require("./tree_map.base").addChange({
        code: "INTERACT_WITH_GROUP",
        handler: function() {
            this._tracker.setOptions({
                interactWithGroup: _parseScalar(this._getOption("interactWithGroup", true), false)
            })
        },
        isThemeDependent: true,
        isOptionChange: true,
        option: "interactWithGroup"
    });

    function Tracker(parameters) {
        this._options = {};
        this._initHandlers(parameters, this._options)
    }
    Tracker.prototype = {
        constructor: Tracker,
        _initHandlers: function(parameters, options) {
            parameters.getNode = function(id) {
                var proxy = parameters.getProxy(id);
                return options.interactWithGroup && proxy.isLeaf() && proxy.getParent().isActive() ? proxy.getParent() : proxy
            };
            parameters.root.on(clickEventName, clickHandler);
            parameters.root.on(downPointerEventName, downHandler);
            $doc.on(downPointerEventName, downHandler);
            $doc.on(movePointerEventName, moveHandler);
            this._disposeHandlers = function() {
                parameters.root.off(clickEventName, clickHandler);
                parameters.root.off(downPointerEventName, downHandler);
                $doc.off(downPointerEventName, downHandler);
                $doc.off(movePointerEventName, moveHandler)
            };

            function clickHandler(e) {
                processClick(e, parameters)
            }
            var isRootDown = false;

            function downHandler(e) {
                if (isRootDown) {
                    isRootDown = false
                } else {
                    if (void 0 !== parameters.getData(e)) {
                        e.preventDefault();
                        isRootDown = true
                    }
                    moveHandler(e)
                }
            }

            function moveHandler(e) {
                processHover(e, parameters);
                processTooltip(e, parameters)
            }
        },
        dispose: function() {
            this._disposeHandlers()
        },
        setOptions: function(options) {
            $.extend(this._options, options)
        }
    };

    function processClick(e, params) {
        var id = params.getData(e);
        if (id >= 0) {
            params.eventTrigger("click", {
                node: params.getNode(id),
                coords: params.getCoords(e),
                jQueryEvent: e
            })
        }
    }

    function processHover(e, params) {
        var id = params.getData(e);
        if (id >= 0) {
            params.getNode(id).setHover()
        } else {
            params.widget.clearHover()
        }
    }

    function processTooltip(e, params) {
        var coords, id = params.getData(e);
        if (id >= 0) {
            coords = _eventData(e);
            params.getNode(id).showTooltip([coords.x, coords.y])
        } else {
            params.widget.hideTooltip()
        }
    }
});
