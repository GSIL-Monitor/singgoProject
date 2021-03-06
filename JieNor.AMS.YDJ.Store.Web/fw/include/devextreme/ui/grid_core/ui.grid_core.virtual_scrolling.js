/** 
 * DevExtreme (ui/grid_core/ui.grid_core.virtual_scrolling.js)
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
        browser = require("../../core/utils/browser"),
        Class = require("../../core/class");
    var SCROLLING_MODE_INFINITE = "infinite",
        SCROLLING_MODE_VIRTUAL = "virtual",
        CONTENT_HEIHGT_LIMIT = browser.msie ? 4e6 : 15e6;
    var isVirtualMode = function(that) {
        return that.option("scrolling.mode") === SCROLLING_MODE_VIRTUAL
    };
    var isAppendMode = function(that) {
        return that.option("scrolling.mode") === SCROLLING_MODE_INFINITE
    };
    exports.subscribeToExternalScrollers = function($element, scrollChangedHandler, $targetElement) {
        var $scrollElement, scrollableArray = [],
            scrollToArray = [],
            disposeArray = [];
        $targetElement = $targetElement || $element;

        function getElementOffset(scrollable) {
            var $scrollableElement = scrollable.element ? scrollable.element() : scrollable,
                scrollableOffset = $scrollableElement.offset();
            if (!scrollableOffset) {
                return $element.offset().top
            }
            return scrollable.scrollTop() - (scrollableOffset.top - $element.offset().top)
        }

        function createWindowScrollHandler(scrollable) {
            return function(e) {
                var scrollTop = scrollable.scrollTop() - getElementOffset(scrollable);
                scrollTop = scrollTop > 0 ? scrollTop : 0;
                scrollChangedHandler(scrollTop)
            }
        }

        function subscribeToScrollEvents($scrollElement) {
            var handler, isDocument = "#document" === $scrollElement.get(0).nodeName,
                scrollable = $scrollElement.data("dxScrollable") || isDocument && $(window) || "auto" === $scrollElement.css("overflow-y") && $scrollElement;
            if (scrollable) {
                handler = createWindowScrollHandler(scrollable);
                scrollable.on("scroll", handler);
                scrollToArray.push(function(pos) {
                    var topOffset = getElementOffset(scrollable),
                        scrollMethod = scrollable.scrollTo ? "scrollTo" : "scrollTop";
                    if (pos - topOffset >= 0) {
                        scrollable[scrollMethod](pos + topOffset)
                    }
                });
                scrollableArray.push(scrollable);
                disposeArray.push(function() {
                    scrollable.off("scroll", handler)
                })
            }
        }
        for ($scrollElement = $targetElement.parent(); $scrollElement.length; $scrollElement = $scrollElement.parent()) {
            subscribeToScrollEvents($scrollElement)
        }
        return {
            scrollTo: function(pos) {
                $.each(scrollToArray, function(_, scrollTo) {
                    scrollTo(pos)
                })
            },
            dispose: function() {
                $.each(disposeArray, function(_, dispose) {
                    dispose()
                })
            }
        }
    };
    exports.VirtualScrollController = Class.inherit(function() {
        var getViewportPageCount = function(that) {
            var pageSize = that._dataSource.pageSize(),
                preventPreload = that.option("scrolling.preventPreload");
            if (preventPreload) {
                return 0
            }
            return pageSize && that._viewportSize > 0 ? Math.ceil(that._viewportSize / pageSize) : 1
        };
        var getPreloadPageCount = function(that) {
            var preloadEnabled = that.option("scrolling.preloadEnabled"),
                pageCount = getViewportPageCount(that);
            if (pageCount) {
                if (preloadEnabled) {
                    pageCount++
                }
                if (isAppendMode(that)) {
                    pageCount--
                }
            }
            return pageCount
        };
        var getBeginPageIndex = function(that) {
            return that._cache.length ? that._cache[0].pageIndex : -1
        };
        var getEndPageIndex = function(that) {
            return that._cache.length ? that._cache[that._cache.length - 1].pageIndex : -1
        };
        var fireChanged = function(that, changed, args) {
            that._isChangedFiring = true;
            changed(args);
            that._isChangedFiring = false
        };
        var processDelayChanged = function(that, changed, args) {
            if (that._isDelayChanged) {
                that._isDelayChanged = false;
                fireChanged(that, changed, args);
                return true
            }
        };
        var processChanged = function(that, changed, changeType, isDelayChanged) {
            var change, dataSource = that._dataSource,
                items = dataSource.items();
            if (changeType && !that._isDelayChanged) {
                change = {
                    changeType: changeType,
                    items: items
                }
            }
            var viewportItems = that._dataSource.viewportItems();
            if ("append" === changeType) {
                viewportItems.push.apply(viewportItems, items)
            } else {
                if ("prepend" === changeType) {
                    viewportItems.unshift.apply(viewportItems, items)
                } else {
                    that._dataSource.viewportItems(items)
                }
            }
            dataSource.updateLoading();
            that._lastPageIndex = that.pageIndex();
            that._isDelayChanged = isDelayChanged;
            if (!isDelayChanged) {
                fireChanged(that, changed, change)
            }
        };
        return {
            ctor: function(component, dataSource) {
                var that = this;
                that._dataSource = dataSource;
                that.component = component;
                that._pageIndex = that._lastPageIndex = dataSource.pageIndex();
                that._viewportSize = 0;
                that._viewportItemSize = 20;
                that._viewportItemIndex = -1;
                that._sizeRatio = 1;
                that._items = [];
                that._cache = []
            },
            option: function(name) {
                return this.component.option.apply(this.component, arguments)
            },
            virtualItemsCount: function() {
                var pageIndex, beginItemsCount, endItemsCount, that = this,
                    itemsCount = 0;
                if (isVirtualMode(that)) {
                    pageIndex = getBeginPageIndex(that);
                    if (pageIndex < 0) {
                        pageIndex = 0
                    }
                    beginItemsCount = pageIndex * that._dataSource.pageSize();
                    itemsCount = that._cache.length * that._dataSource.pageSize();
                    endItemsCount = Math.max(0, that._dataSource.totalItemsCount() - itemsCount - beginItemsCount);
                    return {
                        begin: beginItemsCount,
                        end: endItemsCount
                    }
                }
            },
            _setViewportPositionCore: function(position, isNear) {
                var that = this,
                    scrollingTimeout = Math.min(that.option("scrolling.timeout") || 0, that._dataSource.changingDuration());
                if (isNear && scrollingTimeout < that.option("scrolling.renderingThreshold")) {
                    scrollingTimeout = 10
                }
                clearTimeout(that._scrollTimeoutID);
                if (scrollingTimeout > 0) {
                    that._scrollTimeoutID = setTimeout(function() {
                        that.setViewportItemIndex(position)
                    }, scrollingTimeout)
                } else {
                    that.setViewportItemIndex(position)
                }
            },
            getViewportPosition: function() {
                return this._position || 0
            },
            setViewportPosition: function(position) {
                var that = this,
                    virtualItemsCount = that.virtualItemsCount(),
                    sizeRatio = that._sizeRatio || 1,
                    itemSize = that._viewportItemSize,
                    offset = virtualItemsCount ? Math.floor(virtualItemsCount.begin * itemSize * sizeRatio) : 0;
                that._position = position;
                if (virtualItemsCount && position >= offset && position <= offset + that._contentSize) {
                    that._setViewportPositionCore(virtualItemsCount.begin + (position - offset) / itemSize, true)
                } else {
                    that._setViewportPositionCore(position / (itemSize * sizeRatio))
                }
            },
            setContentSize: function(size) {
                var that = this,
                    virtualItemsCount = that.virtualItemsCount();
                that._contentSize = size;
                if (virtualItemsCount) {
                    var virtualContentSize = (virtualItemsCount.begin + virtualItemsCount.end + that.itemsCount()) * that._viewportItemSize;
                    if (virtualContentSize > CONTENT_HEIHGT_LIMIT) {
                        that._sizeRatio = CONTENT_HEIHGT_LIMIT / virtualContentSize
                    } else {
                        that._sizeRatio = 1
                    }
                }
            },
            getContentOffset: function() {
                var that = this,
                    virtualItemsCount = that.virtualItemsCount();
                return virtualItemsCount ? Math.floor(virtualItemsCount.begin * that._viewportItemSize * that._sizeRatio) : 0
            },
            getVirtualContentSize: function() {
                var that = this,
                    virtualItemsCount = that.virtualItemsCount();
                return virtualItemsCount ? (virtualItemsCount.begin + virtualItemsCount.end) * that._viewportItemSize * that._sizeRatio + that._contentSize : 0
            },
            getViewportItemIndex: function() {
                return this._viewportItemIndex
            },
            setViewportItemIndex: function(itemIndex) {
                var lastPageSize, maxPageIndex, newPageIndex, that = this,
                    pageSize = that._dataSource.pageSize(),
                    pageCount = that._dataSource.pageCount(),
                    virtualMode = isVirtualMode(that),
                    appendMode = isAppendMode(that),
                    totalItemsCount = that._dataSource.totalItemsCount(),
                    needLoad = that._viewportItemIndex < 0;
                that._viewportItemIndex = itemIndex;
                if (pageSize && (virtualMode || appendMode) && totalItemsCount >= 0) {
                    if (that._viewportSize && itemIndex + that._viewportSize >= totalItemsCount) {
                        if (that._dataSource.hasKnownLastPage()) {
                            newPageIndex = pageCount - 1;
                            lastPageSize = totalItemsCount % pageSize;
                            if (newPageIndex > 0 && lastPageSize > 0 && lastPageSize < pageSize / 2) {
                                newPageIndex--
                            }
                        } else {
                            newPageIndex = pageCount
                        }
                    } else {
                        newPageIndex = Math.floor(itemIndex / pageSize);
                        maxPageIndex = pageCount - 1;
                        newPageIndex = Math.max(newPageIndex, 0);
                        newPageIndex = Math.min(newPageIndex, maxPageIndex)
                    }
                    if (that.pageIndex() !== newPageIndex || needLoad) {
                        that.pageIndex(newPageIndex);
                        that.load()
                    }
                }
            },
            viewportItemSize: function(size) {
                if (void 0 !== size) {
                    this._viewportItemSize = size
                }
                return this._viewportItemSize
            },
            viewportSize: function(size) {
                if (void 0 !== size) {
                    this._viewportSize = size
                }
                return this._viewportSize
            },
            pageIndex: function(pageIndex) {
                if (isVirtualMode(this) || isAppendMode(this)) {
                    if (void 0 !== pageIndex) {
                        this._pageIndex = pageIndex
                    }
                    return this._pageIndex
                } else {
                    return this._dataSource.pageIndex(pageIndex)
                }
            },
            beginPageIndex: function(defaultPageIndex) {
                var beginPageIndex = getBeginPageIndex(this);
                if (beginPageIndex < 0) {
                    beginPageIndex = void 0 !== defaultPageIndex ? defaultPageIndex : this.pageIndex()
                }
                return beginPageIndex
            },
            endPageIndex: function() {
                var endPageIndex = getEndPageIndex(this);
                return endPageIndex > 0 ? endPageIndex : this._lastPageIndex
            },
            load: function() {
                var result, beginPageIndex = getBeginPageIndex(this),
                    pageIndexForLoad = -1,
                    dataSource = this._dataSource;
                var loadCore = function(that, pageIndex) {
                    var dataSource = that._dataSource;
                    if (pageIndex === that.pageIndex() || !dataSource.isLoading() && pageIndex < dataSource.pageCount() || !dataSource.hasKnownLastPage() && pageIndex === dataSource.pageCount()) {
                        dataSource.pageIndex(pageIndex);
                        return dataSource.load()
                    }
                };
                if (isVirtualMode(this) || isAppendMode(this)) {
                    if (beginPageIndex < 0 || !this._cache[this._pageIndex - beginPageIndex]) {
                        pageIndexForLoad = this._pageIndex
                    }
                    if (beginPageIndex >= 0 && pageIndexForLoad < 0 && this._viewportSize >= 0) {
                        if (beginPageIndex > 0 && getEndPageIndex(this) + 1 === dataSource.pageCount() && this._cache.length < getPreloadPageCount(this) + 1) {
                            pageIndexForLoad = beginPageIndex - 1
                        } else {
                            if (beginPageIndex + this._cache.length <= this._pageIndex + getPreloadPageCount(this)) {
                                pageIndexForLoad = beginPageIndex + this._cache.length
                            }
                        }
                    }
                    if (pageIndexForLoad >= 0) {
                        result = loadCore(this, pageIndexForLoad)
                    }
                    dataSource.updateLoading()
                } else {
                    result = dataSource.load()
                }
                if (!result && this._lastPageIndex !== this.pageIndex()) {
                    this._dataSource.onChanged({
                        changeType: "pageIndex"
                    })
                }
                return result || $.Deferred().resolve()
            },
            loadIfNeed: function() {
                var that = this;
                if ((isVirtualMode(that) || isAppendMode(that)) && !that._dataSource.isLoading() && !that._isChangedFiring) {
                    that.load()
                }
            },
            handleDataChanged: function(callBase) {
                var beginPageIndex, changeType, removeInvisiblePages, cacheItem, that = this,
                    dataSource = that._dataSource,
                    lastCacheLength = that._cache.length;
                if (isVirtualMode(that) || isAppendMode(that)) {
                    beginPageIndex = getBeginPageIndex(that);
                    if (beginPageIndex >= 0) {
                        if (isVirtualMode(that) && beginPageIndex + that._cache.length !== dataSource.pageIndex() && beginPageIndex - 1 !== dataSource.pageIndex()) {
                            that._cache = []
                        }
                        if (isAppendMode(that)) {
                            if (0 === dataSource.pageIndex()) {
                                that._cache = []
                            } else {
                                if (dataSource.pageIndex() < getEndPageIndex(that)) {
                                    fireChanged(that, callBase, {
                                        changeType: "append",
                                        items: []
                                    });
                                    return
                                }
                            }
                        }
                    }
                    cacheItem = {
                        pageIndex: dataSource.pageIndex(),
                        itemsCount: that.itemsCount(true)
                    };
                    if (that.option("scrolling.removeInvisiblePages")) {
                        removeInvisiblePages = that._cache.length > Math.max(getPreloadPageCount(this), 2)
                    } else {
                        processDelayChanged(that, callBase, {
                            isDelayed: true
                        })
                    }
                    if (beginPageIndex === dataSource.pageIndex() + 1) {
                        if (removeInvisiblePages) {
                            that._cache.pop()
                        } else {
                            changeType = "prepend"
                        }
                        that._cache.unshift(cacheItem)
                    } else {
                        if (removeInvisiblePages) {
                            that._cache.shift()
                        } else {
                            changeType = "append"
                        }
                        that._cache.push(cacheItem)
                    }
                    processChanged(that, callBase, that._cache.length > 1 ? changeType : void 0, 0 === lastCacheLength);
                    that.load().done(function() {
                        if (processDelayChanged(that, callBase)) {
                            that.load()
                        }
                    })
                } else {
                    processChanged(that, callBase)
                }
            },
            itemsCount: function(isBase) {
                var itemsCount = 0;
                if (!isBase && isVirtualMode(this)) {
                    $.each(this._cache, function() {
                        itemsCount += this.itemsCount
                    })
                } else {
                    itemsCount = this._dataSource.itemsCount()
                }
                return itemsCount
            },
            reset: function() {
                this._cache = []
            },
            subscribeToWindowScrollEvents: function($element) {
                var that = this;
                that._windowScroll = that._windowScroll || exports.subscribeToExternalScrollers($element, function(scrollTop) {
                    if (that.viewportItemSize()) {
                        that.setViewportPosition(scrollTop)
                    }
                })
            },
            dispose: function() {
                clearTimeout(this._scrollTimeoutID);
                this._windowScroll && this._windowScroll.dispose();
                this._windowScroll = null
            },
            scrollTo: function(pos) {
                this._windowScroll && this._windowScroll.scrollTo(pos)
            }
        }
    }())
});
