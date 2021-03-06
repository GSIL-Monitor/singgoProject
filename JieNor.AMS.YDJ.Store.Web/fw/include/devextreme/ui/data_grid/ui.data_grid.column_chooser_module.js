/** 
 * DevExtreme (ui/data_grid/ui.data_grid.column_chooser_module.js)
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
        gridCore = require("./ui.data_grid.core"),
        columnsView = require("./ui.data_grid.columns_view"),
        commonUtils = require("../../core/utils/common"),
        messageLocalization = require("../../localization/message"),
        themes = require("../themes"),
        Button = require("../button"),
        TreeView = require("../tree_view"),
        devices = require("../../core/devices"),
        Popup = require("../popup");
    var DATAGRID_COLUMN_CHOOSER_CLASS = "dx-datagrid-column-chooser",
        DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS = "dx-datagrid-column-chooser-button",
        DATAGRID_COLUMN_CHOOSER_ICON_NAME = "column-chooser",
        DATAGRID_COLUMN_CHOOSER_ITEM_CLASS = "dx-column-chooser-item",
        DATAGRID_NOTOUCH_ACTION_CLASS = "dx-datagrid-notouch-action",
        DATAGRID_COLUMN_CHOOSER_LIST_CLASS = "dx-datagrid-column-chooser-list",
        DATAGRID_COLUMN_CHOOSER_DRAG_CLASS = "dx-datagrid-column-chooser-mode-drag",
        DATAGRID_COLUMN_CHOOSER_SELECT_CLASS = "dx-datagrid-column-chooser-mode-select",
        DATAGRID_CLICK_TIMEOUT = 300,
        processItems = function(that, chooserColumns) {
            var item, items = [],
                isSelectMode = "select" === that.option("columnChooser.mode");
            if (chooserColumns.length) {
                $.each(chooserColumns, function(index, column) {
                    item = {
                        text: column.caption,
                        cssClass: column.cssClass,
                        allowHiding: column.allowHiding,
                        expanded: true,
                        id: column.index,
                        parentId: commonUtils.isDefined(column.ownerBand) ? column.ownerBand : null
                    };
                    if (isSelectMode) {
                        item.selected = column.visible
                    }
                    items.push(item)
                })
            }
            return items
        };
    exports.ColumnChooserController = gridCore.ViewController.inherit({
        renderShowColumnChooserButton: function($element) {
            var $columnChooserButton, that = this,
                columnChooserEnabled = that.option("columnChooser.enabled"),
                $showColumnChooserButton = $element.find("." + DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS);
            if (columnChooserEnabled) {
                if (!$showColumnChooserButton.length) {
                    $columnChooserButton = $("<div />").addClass(DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS).appendTo($element);
                    that._createComponent($columnChooserButton, Button, {
                        icon: DATAGRID_COLUMN_CHOOSER_ICON_NAME,
                        onClick: function() {
                            that.getView("columnChooserView").showColumnChooser()
                        },
                        hint: that.option("columnChooser.title"),
                        _templates: {}
                    })
                } else {
                    $showColumnChooserButton.show()
                }
            } else {
                $showColumnChooserButton.hide()
            }
        },
        getPosition: function() {
            var rowsView = this.getView("rowsView");
            return {
                my: "right bottom",
                at: "right bottom",
                of: rowsView && rowsView.element(),
                collision: "fit",
                offset: "-2 -2",
                boundaryOffset: "2 2"
            }
        }
    });
    exports.ColumnChooserView = columnsView.ColumnsView.inherit({
        _resizeCore: $.noop,
        _isWinDevice: function() {
            return !!devices.real().win
        },
        _updateList: function(allowUpdate) {
            var items, $popupContent = this._popupContainer.content(),
                isSelectMode = "select" === this.option("columnChooser.mode"),
                chooserColumns = this._columnsController.getChooserColumns(isSelectMode);
            if (!isSelectMode || !this._columnChooserList || allowUpdate) {
                this._popupContainer._wrapper().toggleClass(DATAGRID_COLUMN_CHOOSER_DRAG_CLASS, !isSelectMode).toggleClass(DATAGRID_COLUMN_CHOOSER_SELECT_CLASS, isSelectMode);
                items = processItems(this, chooserColumns);
                this._renderColumnChooserList($popupContent, items)
            }
        },
        _initializePopupContainer: function() {
            var that = this,
                $element = that.element().addClass(DATAGRID_COLUMN_CHOOSER_CLASS),
                columnChooserOptions = that.option("columnChooser"),
                theme = themes.current(),
                isGenericTheme = theme && theme.indexOf("generic") > -1,
                isAndroid5Theme = theme && theme.indexOf("android5") > -1,
                dxPopupOptions = {
                    visible: false,
                    shading: false,
                    showCloseButton: false,
                    dragEnabled: true,
                    resizeEnabled: true,
                    toolbarItems: [{
                        text: columnChooserOptions.title,
                        toolbar: "top",
                        location: isGenericTheme || isAndroid5Theme ? "before" : "center"
                    }],
                    position: that.getController("columnChooser").getPosition(),
                    width: columnChooserOptions.width,
                    height: columnChooserOptions.height,
                    rtlEnabled: that.option("rtlEnabled"),
                    onHidden: function() {
                        if (that._isWinDevice()) {
                            $(document.body).removeClass(DATAGRID_NOTOUCH_ACTION_CLASS)
                        }
                    },
                    container: columnChooserOptions.container
                };
            if (isGenericTheme) {
                $.extend(dxPopupOptions, {
                    showCloseButton: true
                })
            } else {
                dxPopupOptions.toolbarItems[dxPopupOptions.toolbarItems.length] = {
                    shortcut: "cancel"
                }
            }
            if (!commonUtils.isDefined(this._popupContainer)) {
                that._popupContainer = that._createComponent($element, Popup, dxPopupOptions);
                that._popupContainer.on("optionChanged", function(args) {
                    if ("visible" === args.name) {
                        that.renderCompleted.fire()
                    }
                })
            } else {
                this._popupContainer.option(dxPopupOptions)
            }
        },
        _renderCore: function(allowUpdate) {
            if (this._popupContainer) {
                this._updateList(allowUpdate)
            }
        },
        _renderColumnChooserList: function($container, items) {
            var isSelectMode = "select" === this.option("columnChooser.mode"),
                listConfig = {
                    items: items,
                    dataStructure: "plain",
                    activeStateEnabled: true,
                    focusStateEnabled: true,
                    hoverStateEnabled: true,
                    itemTemplate: "item",
                    showCheckBoxesMode: "none",
                    rootValue: null
                };
            if (this._isWinDevice()) {
                listConfig.useNativeScrolling = false
            }
            $.extend(listConfig, isSelectMode ? this._prepareSelectModeConfig() : this._prepareDragModeConfig());
            if (this._columnChooserList) {
                this._columnChooserList.option(listConfig)
            } else {
                this._columnChooserList = this._createComponent($container, TreeView, listConfig);
                $container.addClass(DATAGRID_COLUMN_CHOOSER_LIST_CLASS)
            }
        },
        _prepareDragModeConfig: function() {
            var columnChooserOptions = this.option("columnChooser");
            return {
                noDataText: columnChooserOptions.emptyPanelText,
                activeStateEnabled: false,
                focusStateEnabled: false,
                hoverStateEnabled: false,
                itemTemplate: function(data, index, $item) {
                    $item.text(data.text).parent().addClass(data.cssClass).addClass(DATAGRID_COLUMN_CHOOSER_ITEM_CLASS)
                }
            }
        },
        _prepareSelectModeConfig: function() {
            var that = this,
                selectionChangedHandler = function(e) {
                    var visibleColumns = that._columnsController.getVisibleColumns().filter(function(item) {
                            return !item.command
                        }),
                        isLastColumnUnselected = 1 === visibleColumns.length && !e.itemData.selected;
                    if (isLastColumnUnselected) {
                        e.component.selectItem(e.itemElement)
                    } else {
                        setTimeout(function() {
                            that._columnsController.columnOption(e.itemData.id, "visible", e.itemData.selected)
                        }, DATAGRID_CLICK_TIMEOUT)
                    }
                };
            return {
                selectNodesRecursive: false,
                showCheckBoxesMode: "normal",
                onItemSelectionChanged: selectionChangedHandler
            }
        },
        _columnOptionChanged: function(e) {
            var optionNames = e.optionNames,
                isSelectMode = "select" === this.option("columnChooser.mode");
            this.callBase(e);
            if (isSelectMode && optionNames.showInColumnChooser) {
                this.render(null, true)
            }
        },
        optionChanged: function(args) {
            switch (args.name) {
                case "columnChooser":
                    this.render(null, true);
                    break;
                default:
                    this.callBase(args)
            }
        },
        getColumnElements: function() {
            var $content = this._popupContainer && this._popupContainer.content();
            return $content && $content.find("." + DATAGRID_COLUMN_CHOOSER_ITEM_CLASS)
        },
        getName: function() {
            return "columnChooser"
        },
        getColumns: function() {
            return this._columnsController.getChooserColumns()
        },
        allowDragging: function(column, sourceLocation) {
            var columnVisible = column && column.allowHiding && ("columnChooser" !== sourceLocation || !column.visible && this._columnsController.isParentColumnVisible(column.index));
            return this.isColumnChooserVisible() && columnVisible
        },
        getBoundingRect: function() {
            var offset, that = this,
                container = that._popupContainer && that._popupContainer._container();
            if (container && container.is(":visible")) {
                offset = container.offset();
                return {
                    left: offset.left,
                    top: offset.top,
                    right: offset.left + container.outerWidth(),
                    bottom: offset.top + container.outerHeight()
                }
            }
            return null
        },
        showColumnChooser: function() {
            if (!this._popupContainer) {
                this._initializePopupContainer();
                this.render()
            }
            this._popupContainer.show();
            if (this._isWinDevice()) {
                $(document.body).addClass(DATAGRID_NOTOUCH_ACTION_CLASS)
            }
        },
        hideColumnChooser: function() {
            if (this._popupContainer) {
                this._popupContainer.hide()
            }
        },
        isColumnChooserVisible: function() {
            var popupContainer = this._popupContainer;
            return popupContainer && popupContainer.option("visible")
        },
        publicMethods: function() {
            return ["showColumnChooser", "hideColumnChooser"]
        }
    });
    gridCore.registerModule("columnChooser", {
        defaultOptions: function() {
            return {
                columnChooser: {
                    enabled: false,
                    mode: "dragAndDrop",
                    width: 250,
                    height: 260,
                    title: messageLocalization.format("dxDataGrid-columnChooserTitle"),
                    emptyPanelText: messageLocalization.format("dxDataGrid-columnChooserEmptyText"),
                    container: void 0
                }
            }
        },
        controllers: {
            columnChooser: exports.ColumnChooserController
        },
        views: {
            columnChooserView: exports.ColumnChooserView
        },
        extenders: {
            views: {
                headerPanel: {
                    _getToolbarItems: function() {
                        var items = this.callBase();
                        return this._appendColumnChooserItem(items)
                    },
                    _appendColumnChooserItem: function(items) {
                        var that = this,
                            columnChooserEnabled = that.option("columnChooser.enabled");
                        if (columnChooserEnabled) {
                            var onClickHandler = function() {
                                    that.component.getView("columnChooserView").showColumnChooser()
                                },
                                onInitialized = function(e) {
                                    e.element.addClass(that._getToolbarButtonClass(DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS))
                                },
                                hintText = that.option("columnChooser.title"),
                                toolbarItem = {
                                    widget: "dxButton",
                                    options: {
                                        icon: DATAGRID_COLUMN_CHOOSER_ICON_NAME,
                                        onClick: onClickHandler,
                                        hint: hintText,
                                        text: hintText,
                                        onInitialized: onInitialized
                                    },
                                    showText: "inMenu",
                                    location: "after",
                                    name: "columnChooser",
                                    locateInMenu: "auto"
                                };
                            items.push(toolbarItem)
                        }
                        return items
                    },
                    optionChanged: function(args) {
                        switch (args.name) {
                            case "columnChooser":
                                this._invalidateToolbarItems();
                                args.handled = true;
                                break;
                            default:
                                this.callBase(args)
                        }
                    },
                    isVisible: function() {
                        var that = this,
                            columnChooserEnabled = that.option("columnChooser.enabled");
                        return that.callBase() || columnChooserEnabled
                    }
                }
            },
            controllers: {
                columns: {
                    allowMoveColumn: function(fromVisibleIndex, toVisibleIndex, sourceLocation, targetLocation) {
                        var columnChooserMode = this.option("columnChooser.mode"),
                            isMoveColumnDisallowed = "select" === columnChooserMode && "columnChooser" === targetLocation;
                        return isMoveColumnDisallowed ? false : this.callBase(fromVisibleIndex, toVisibleIndex, sourceLocation, targetLocation)
                    }
                }
            }
        }
    })
});
