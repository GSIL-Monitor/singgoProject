/** 
 * DevExtreme (ui/autocomplete.js)
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
        registerComponent = require("../core/component_registrator"),
        DropDownList = require("./drop_down_editor/ui.drop_down_list"),
        themes = require("./themes");
    var AUTOCOMPLETE_CLASS = "dx-autocomplete",
        AUTOCOMPLETE_POPUP_WRAPPER_CLASS = "dx-autocomplete-popup-wrapper";
    var Autocomplete = DropDownList.inherit({
        _supportedKeys: function() {
            var item = this._list ? this._list.option("focusedElement") : null;
            return $.extend(this.callBase(), {
                upArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item && !item.prev().length) {
                        this._clearFocusedItem();
                        return false
                    }
                    return true
                },
                downArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item && !item.next().length) {
                        this._clearFocusedItem();
                        return false
                    }
                    return true
                },
                enter: function(e) {
                    if (!item) {
                        this.close()
                    }
                    return true
                }
            })
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                displayExpr: {
                    since: "15.2",
                    alias: "valueExpr"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                minSearchLength: 1,
                maxItemCount: 10,
                noDataText: "",
                showDropButton: false,
                searchEnabled: true
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function() {
                    return /android5/.test(themes.current())
                },
                options: {
                    popupPosition: {
                        offset: {
                            h: -16,
                            v: -8
                        }
                    }
                }
            }])
        },
        _render: function() {
            this.callBase();
            this.element().addClass(AUTOCOMPLETE_CLASS);
            this.setAria("autocomplete", "inline")
        },
        _loadValue: function() {
            return $.Deferred().resolve(this.option("value"))
        },
        _displayGetterExpr: function() {
            return this.option("valueExpr")
        },
        _setSelectedItem: function(item) {
            this.callBase(item);
            this.option("displayValue", this.option("value"))
        },
        _popupConfig: function() {
            return $.extend(this.callBase(), {
                closeOnOutsideClick: $.proxy(function(e) {
                    return !$(e.target).closest(this.element()).length
                }, this)
            })
        },
        _renderDimensions: function() {
            this.callBase();
            this._setPopupOption("width")
        },
        _popupWrapperClass: function() {
            return this.callBase() + " " + AUTOCOMPLETE_POPUP_WRAPPER_CLASS
        },
        _listConfig: function() {
            return $.extend(this.callBase(), {
                pageLoadMode: "none",
                indicateLoading: false
            })
        },
        _listItemClickHandler: function(e) {
            var value = this._displayGetter(e.itemData);
            this.option("value", value);
            this.close()
        },
        _setListDataSource: function() {
            if (!this._list) {
                return
            }
            this._list.option("selectedItems", []);
            this.callBase()
        },
        _refreshSelected: $.noop,
        _searchCanceled: function() {
            this.callBase();
            this.close()
        },
        _dataSourceOptions: function() {
            return {
                paginate: true
            }
        },
        _searchDataSource: function() {
            this._dataSource.pageSize(this.option("maxItemCount"));
            this.callBase();
            this._clearFocusedItem()
        },
        _clearFocusedItem: function() {
            if (this._list) {
                this._list.option("focusedElement", null);
                this._list.option("selectedIndex", -1)
            }
        },
        _renderValueEventName: function() {
            return "input keyup"
        },
        _searchHandler: function(e) {
            if (this._isControlKey(e.which || e.keyCode)) {
                return
            }
            this.callBase(e)
        },
        _optionChanged: function(args) {
            if ("maxItemCount" === args.name) {
                this._searchDataSource()
            } else {
                this.callBase(args)
            }
        }
    });
    registerComponent("dxAutocomplete", Autocomplete);
    module.exports = Autocomplete
});
