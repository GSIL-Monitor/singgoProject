/** 
 * DevExtreme (ui/data_grid/ui.data_grid.grid_view.js)
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
        commonUtils = require("../../core/utils/common"),
        messageLocalization = require("../../localization/message");
    var DATAGRID_CLASS = "dx-datagrid",
        DATAGRID_HIDDEN_CLASS = "dx-hidden",
        DATAGRID_TABLE_CLASS = "dx-datagrid-table",
        DATAGRID_BORDERS_CLASS = "dx-datagrid-borders",
        DATAGRID_TABLE_FIXED_CLASS = "dx-datagrid-table-fixed",
        DATAGRID_IMPORTANT_MARGIN_CLASS = "dx-datagrid-important-margin",
        DATAGRID_HIDDEN_COLUMNS_WIDTH = "adaptiveHidden",
        EMPTY_GRID_ROWS_HEIGHT = 100,
        LOADPANEL_MARGIN = 50,
        VIEW_NAMES = ["columnsSeparatorView", "blockSeparatorView", "trackerView", "headerPanel", "columnHeadersView", "rowsView", "footerView", "columnChooserView", "pagerView", "draggingHeaderView", "contextMenuView", "errorView", "headerFilterView"];
    var isPercentWidth = function(width) {
        return commonUtils.isString(width) && "%" === width.slice(-1)
    };
    var mergeArraysByMaxValue = function(values1, values2) {
        var i, result = [];
        if (values1 && values2 && values1.length && values1.length === values2.length) {
            for (i = 0; i < values1.length; i++) {
                result.push(values1[i] > values2[i] ? values1[i] : values2[i])
            }
        } else {
            if (values1 && values1.length) {
                result = values1
            } else {
                if (values2) {
                    result = values2
                }
            }
        }
        return result
    };
    exports.ResizingController = gridCore.ViewController.inherit({
        _initPostRenderHandlers: function() {
            var that = this;
            if (!that._refreshSizesHandler) {
                that._refreshSizesHandler = function(e) {
                    that._dataController.changed.remove(that._refreshSizesHandler);
                    var resizeDeferred, changeType = e && e.changeType,
                        isDelayed = e && e.isDelayed;
                    if (!e || "refresh" === changeType || "prepend" === changeType || "append" === changeType) {
                        if (!isDelayed) {
                            resizeDeferred = that.resize()
                        }
                    } else {
                        if ("update" === changeType) {
                            if (that._dataController.items().length > 1 || "insert" !== e.changeTypes[0]) {
                                that._rowsView.resize()
                            } else {
                                resizeDeferred = that.resize()
                            }
                        }
                    }
                    if (changeType && "updateSelection" !== changeType && !isDelayed) {
                        $.when(resizeDeferred).done(function() {
                            that.component._fireContentReadyAction()
                        })
                    }
                };
                that._dataController.changed.add(function() {
                    that._dataController.changed.add(that._refreshSizesHandler)
                })
            }
        },
        _getBestFitWidths: function() {
            var rowsColumnWidths, headerColumnWidths, footerColumnWidths, resultWidths, that = this;
            rowsColumnWidths = that._rowsView.getColumnWidths();
            headerColumnWidths = that._columnHeadersView && that._columnHeadersView.getColumnWidths();
            footerColumnWidths = that._footerView && that._footerView.getColumnWidths();
            resultWidths = mergeArraysByMaxValue(rowsColumnWidths, headerColumnWidths);
            resultWidths = mergeArraysByMaxValue(resultWidths, footerColumnWidths);
            return resultWidths
        },
        _setVisibleWidths: function(visibleColumns, widths) {
            var columnsController = this._columnsController;
            columnsController.beginUpdate();
            $.each(visibleColumns, function(index, column) {
                var columnId = column.command ? "command:" + column.command : column.index;
                columnsController.columnOption(columnId, "visibleWidth", widths[index])
            });
            columnsController.endUpdate()
        },
        _toggleBestFitMode: function(isBestFit) {
            var $element = this.component.element();
            $element.find("." + DATAGRID_TABLE_CLASS).toggleClass(DATAGRID_TABLE_FIXED_CLASS, !isBestFit);
            $element.find("input").toggleClass(DATAGRID_HIDDEN_CLASS, isBestFit);
            $element.find(".dx-group-cell").toggleClass(DATAGRID_HIDDEN_CLASS, isBestFit);
            $element.find(".dx-header-row .dx-datagrid-text-content").css("max-width", "")
        },
        _synchronizeColumns: function() {
            var resetBestFitMode, that = this,
                columnsController = that._columnsController,
                visibleColumns = columnsController.getVisibleColumns(),
                columnAutoWidth = that.option("columnAutoWidth"),
                needBestFit = columnAutoWidth,
                isLastWidthReset = false,
                resultWidths = [],
                normalizeWidthsByExpandColumns = function() {
                    var expandColumnWidth;
                    $.each(visibleColumns, function(index, column) {
                        if ("expand" === column.command) {
                            expandColumnWidth = resultWidths[index]
                        }
                    });
                    $.each(visibleColumns, function(index, column) {
                        if ("expand" === column.command && expandColumnWidth) {
                            resultWidths[index] = expandColumnWidth
                        }
                    })
                };
            !needBestFit && $.each(visibleColumns, function(index, column) {
                if ("auto" === column.width || column.fixed) {
                    needBestFit = true;
                    return false
                }
            });
            that._setVisibleWidths(visibleColumns, []);
            if (that._isNeedToCalcBestFitWidths(needBestFit)) {
                that._toggleBestFitMode(true);
                resetBestFitMode = true
            }
            commonUtils.deferUpdate(function() {
                if (that._isNeedToCalcBestFitWidths(needBestFit)) {
                    resultWidths = that._getBestFitWidths();
                    $.each(visibleColumns, function(index, column) {
                        var columnId = column.command ? "command:" + column.command : column.index;
                        columnsController.columnOption(columnId, "bestFitWidth", resultWidths[index], true)
                    })
                }
                $.each(visibleColumns, function(index) {
                    if ("auto" !== this.width) {
                        if (this.width) {
                            resultWidths[index] = this.width
                        } else {
                            if (!columnAutoWidth) {
                                resultWidths[index] = void 0
                            }
                        }
                    }
                });
                isLastWidthReset = that._correctColumnWidths(resultWidths, visibleColumns);
                if (columnAutoWidth) {
                    normalizeWidthsByExpandColumns();
                    that._processStretch(resultWidths, visibleColumns)
                }
                commonUtils.deferRender(function() {
                    if (resetBestFitMode) {
                        that._toggleBestFitMode(false);
                        resetBestFitMode = false
                    }
                    if (needBestFit || isLastWidthReset) {
                        that._setVisibleWidths(visibleColumns, resultWidths)
                    }
                })
            })
        },
        _isNeedToCalcBestFitWidths: function(needBestFit) {
            return needBestFit
        },
        _correctColumnWidths: function(resultWidths, visibleColumns) {
            var lastColumnIndex, that = this,
                hasPercentWidth = false,
                hasAutoWidth = false,
                isLastWidthReset = false,
                $element = that.component.element(),
                hasWidth = that._hasWidth;
            $.each(visibleColumns, function(index) {
                if ("auto" !== this.width) {
                    if (this.width) {
                        if (resultWidths[index] !== DATAGRID_HIDDEN_COLUMNS_WIDTH) {
                            resultWidths[index] = this.width
                        }
                    } else {
                        hasAutoWidth = true
                    }
                }
                if (isPercentWidth(this.width)) {
                    hasPercentWidth = true
                }
            });
            if ($element && that._maxWidth) {
                delete that._maxWidth;
                $element.css("max-width", "")
            }
            if (!hasAutoWidth && resultWidths.length) {
                var contentWidth = that._rowsView.contentWidth(),
                    totalWidth = that._getTotalWidth(resultWidths, contentWidth);
                if (totalWidth <= contentWidth) {
                    lastColumnIndex = resultWidths.length - 1;
                    while (lastColumnIndex >= 0 && visibleColumns[lastColumnIndex] && (visibleColumns[lastColumnIndex].command || resultWidths[lastColumnIndex] === DATAGRID_HIDDEN_COLUMNS_WIDTH)) {
                        lastColumnIndex--
                    }
                    if (lastColumnIndex >= 0) {
                        resultWidths[lastColumnIndex] = "auto";
                        isLastWidthReset = true;
                        if (!hasWidth && !hasPercentWidth) {
                            that._maxWidth = that.option("showBorders") ? totalWidth + 2 : totalWidth;
                            $element.css("max-width", that._maxWidth)
                        }
                    }
                }
            }
            return isLastWidthReset
        },
        _processStretch: function(resultSizes, visibleColumns) {
            var diff, diffElement, onePixelElementsCount, i, groupSize = this._rowsView.contentWidth(),
                tableSize = this._getTotalWidth(resultSizes, groupSize),
                unusedIndexes = {
                    length: 0
                };
            if (!resultSizes.length) {
                return
            }
            $.each(visibleColumns, function(index) {
                if (this.width || resultSizes[index] === DATAGRID_HIDDEN_COLUMNS_WIDTH) {
                    unusedIndexes[index] = true;
                    unusedIndexes.length++
                }
            });
            diff = groupSize - tableSize;
            diffElement = Math.floor(diff / (resultSizes.length - unusedIndexes.length));
            onePixelElementsCount = diff - diffElement * (resultSizes.length - unusedIndexes.length);
            if (diff >= 0) {
                for (i = 0; i < resultSizes.length; i++) {
                    if (unusedIndexes[i]) {
                        continue
                    }
                    resultSizes[i] += diffElement;
                    if (onePixelElementsCount) {
                        resultSizes[i]++;
                        onePixelElementsCount--
                    }
                }
            }
        },
        _getTotalWidth: function(widths, groupWidth) {
            var width, i, result = 0;
            for (i = 0; i < widths.length; i++) {
                width = widths[i];
                if (width && width !== DATAGRID_HIDDEN_COLUMNS_WIDTH) {
                    result += isPercentWidth(width) ? parseInt(width) * groupWidth / 100 : parseInt(width)
                }
            }
            return Math.round(result)
        },
        updateSize: function($rootElement) {
            var $groupElement, width, that = this;
            if (void 0 === that._hasHeight && $rootElement && $rootElement.is(":visible")) {
                $groupElement = $rootElement.children("." + DATAGRID_CLASS);
                if ($groupElement.length) {
                    $groupElement.detach()
                }
                that._hasHeight = !!$rootElement.height();
                width = $rootElement.width();
                $rootElement.addClass(DATAGRID_IMPORTANT_MARGIN_CLASS);
                that._hasWidth = $rootElement.width() === width;
                $rootElement.removeClass(DATAGRID_IMPORTANT_MARGIN_CLASS);
                if ($groupElement.length) {
                    $groupElement.appendTo($rootElement)
                }
            }
        },
        publicMethods: function() {
            return ["resize", "updateDimensions"]
        },
        resize: function() {
            return !this.component._requireResize && this.updateDimensions()
        },
        updateDimensions: function(checkSize) {
            var that = this;
            that._initPostRenderHandlers();
            if (!that._checkSize(checkSize)) {
                return
            }
            return commonUtils.deferRender(function() {
                var scrollTop, scrollable = that._rowsView.getScrollable();
                if (that._dataController.isLoaded()) {
                    that._synchronizeColumns();
                    scrollTop = scrollable && scrollable._container().get(0).scrollTop;
                    that._rowsView.height("auto")
                }
                commonUtils.deferUpdate(function() {
                    that._updateDimensionsCore(scrollTop)
                })
            })
        },
        _checkSize: function(checkSize) {
            var $rootElement = this.component.element();
            if (checkSize && (this._lastWidth === $rootElement.width() && this._lastHeight === $rootElement.height() || !$rootElement.is(":visible"))) {
                return false
            }
            return true
        },
        _updateDimensionsCore: function(scrollTop) {
            var rowsViewHeight, $testDiv, that = this,
                scrollable = that._rowsView.getScrollable(),
                dataController = that._dataController,
                rowsView = that._rowsView,
                columnHeadersView = that._columnHeadersView,
                footerView = that._footerView,
                $rootElement = that.component.element(),
                rootElementHeight = $rootElement && ($rootElement.get(0).clientHeight || $rootElement.height()),
                maxHeight = parseFloat($rootElement.css("maxHeight")),
                maxHeightHappened = maxHeight && rootElementHeight >= maxHeight,
                loadPanelOptions = that.option("loadPanel"),
                height = that.option("height") || $rootElement.get(0).style.height,
                editorFactory = that.getController("editorFactory");
            that.updateSize($rootElement);
            if (height && that._hasHeight ^ "auto" !== height) {
                $testDiv = $("<div>").height(height).appendTo($rootElement);
                that._hasHeight = !!$testDiv.height();
                $testDiv.remove()
            }
            if (that.option("scrolling") && (that._hasHeight && rootElementHeight > 0 || maxHeightHappened)) {
                rowsViewHeight = rootElementHeight;
                $.each(that.getViews(), function() {
                    if (this.isVisible() && this.getHeight) {
                        rowsViewHeight -= this.getHeight()
                    }
                })
            } else {
                if (!that._hasHeight && 0 === dataController.items().length) {
                    rowsViewHeight = loadPanelOptions && loadPanelOptions.enabled ? loadPanelOptions.height + LOADPANEL_MARGIN : EMPTY_GRID_ROWS_HEIGHT
                } else {
                    rowsViewHeight = "auto"
                }
            }
            commonUtils.deferRender(function() {
                rowsView.height(rowsViewHeight, that._hasHeight);
                if (scrollTop && scrollable) {
                    scrollable._container().get(0).scrollTop = scrollTop
                }
                if (!dataController.isLoaded()) {
                    rowsView.setLoading(true);
                    return
                }
                commonUtils.deferUpdate(function() {
                    that._updateLastSizes($rootElement);
                    var vScrollbarWidth = rowsView.getScrollbarWidth();
                    var hScrollbarWidth = rowsView.getScrollbarWidth(true);
                    commonUtils.deferRender(function() {
                        columnHeadersView && columnHeadersView.setScrollerSpacing(vScrollbarWidth);
                        footerView && footerView.setScrollerSpacing(vScrollbarWidth);
                        rowsView.setScrollerSpacing(vScrollbarWidth, hScrollbarWidth)
                    });
                    $.each(VIEW_NAMES, function(index, viewName) {
                        var view = that.getView(viewName);
                        if (view) {
                            view.resize()
                        }
                    });
                    editorFactory && editorFactory.resize()
                })
            })
        },
        _updateLastSizes: function($rootElement) {
            this._lastWidth = $rootElement.width();
            this._lastHeight = $rootElement.height()
        },
        optionChanged: function(args) {
            switch (args.name) {
                case "width":
                case "height":
                    this.component._renderDimensions();
                    this.resize();
                default:
                    this.callBase(args)
            }
        },
        init: function() {
            var that = this;
            that._dataController = that.getController("data");
            that._columnsController = that.getController("columns");
            that._columnHeadersView = that.getView("columnHeadersView");
            that._footerView = that.getView("footerView");
            that._rowsView = that.getView("rowsView")
        }
    });
    exports.SynchronizeScrollingController = gridCore.ViewController.inherit({
        _scrollChangedHandler: function(views, pos, viewName) {
            for (var j = 0; j < views.length; j++) {
                if (views[j].name !== viewName) {
                    views[j].scrollTo({
                        left: pos.left,
                        top: pos.top
                    })
                }
            }
        },
        init: function() {
            var view, i, views = [this.getView("columnHeadersView"), this.getView("footerView"), this.getView("rowsView")];
            for (i = 0; i < views.length; i++) {
                view = views[i];
                if (view) {
                    view.scrollChanged.add($.proxy(this._scrollChangedHandler, this, views))
                }
            }
        }
    });
    exports.GridView = gridCore.View.inherit({
        _endUpdateCore: function() {
            if (this.component._requireResize) {
                this.component._requireResize = false;
                this._resizingController.resize()
            }
        },
        init: function() {
            var that = this;
            that._resizingController = this.getController("resizing");
            that._dataController = that.getController("data")
        },
        getView: function(name) {
            return this.component._views[name]
        },
        element: function() {
            return this._groupElement
        },
        optionChanged: function(args) {
            var that = this;
            if (commonUtils.isDefined(that._groupElement) && "showBorders" === args.name) {
                that._groupElement.toggleClass(DATAGRID_BORDERS_CLASS, !!args.value);
                args.handled = true
            } else {
                that.callBase(args)
            }
        },
        render: function($rootElement) {
            var that = this,
                groupElement = that._groupElement || $("<div />").addClass(DATAGRID_CLASS).toggleClass(DATAGRID_BORDERS_CLASS, !!that.option("showBorders"));
            that.component.setAria({
                role: "application",
                label: messageLocalization.format("dxDataGrid-ariaDataGrid")
            }, $rootElement);
            that._rootElement = $rootElement || that._rootElement;
            that._groupElement = groupElement;
            $.each(VIEW_NAMES, function(index, viewName) {
                var view = that.getView(viewName);
                if (view) {
                    view.render(groupElement)
                }
            });
            that.update()
        },
        update: function() {
            var that = this,
                $rootElement = that._rootElement,
                $groupElement = that._groupElement,
                columnHeadersView = that.getView("columnHeadersView"),
                resizingController = that.getController("resizing");
            if ($rootElement && $groupElement) {
                if (!$groupElement.parent().length) {
                    resizingController.updateSize($rootElement);
                    $groupElement.appendTo($rootElement);
                    columnHeadersView && columnHeadersView.renderDelayedTemplates();
                    that.getView("rowsView").renderDelayedTemplates()
                }
                resizingController.resize();
                if (that._dataController.isLoaded()) {
                    that.component._fireContentReadyAction()
                }
            }
        }
    });
    gridCore.registerModule("gridView", {
        defaultOptions: function() {
            return {
                showBorders: false
            }
        },
        controllers: {
            resizing: exports.ResizingController,
            synchronizeScrolling: exports.SynchronizeScrollingController
        },
        views: {
            gridView: exports.GridView
        }
    })
});
