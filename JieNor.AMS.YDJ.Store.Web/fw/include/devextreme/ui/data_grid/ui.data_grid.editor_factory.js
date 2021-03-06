/** 
 * DevExtreme (ui/data_grid/ui.data_grid.editor_factory.js)
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
        commonUtils = require("../../core/utils/common"),
        isWrapped = require("../../core/utils/variable_wrapper").isWrapped,
        compileGetter = require("../../core/utils/data").compileGetter,
        gridCore = require("./ui.data_grid.core"),
        browser = require("../../core/utils/browser"),
        devices = require("../../core/devices"),
        positionUtils = require("../../animation/position"),
        eventUtils = require("../../events/utils"),
        dateLocalization = require("../../localization/date"),
        clickEvent = require("../../events/click"),
        pointerEvents = require("../../events/pointer"),
        normalizeDataSourceOptions = require("../../data/data_source/data_source").normalizeDataSourceOptions,
        addNamespace = eventUtils.addNamespace;
    require("../text_box");
    require("../number_box");
    require("../check_box");
    require("../select_box");
    require("../date_box");
    var DATAGRID_CHECKBOX_SIZE_CLASS = "dx-datagrid-checkbox-size",
        DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
        DATAGRID_EDITOR_INLINE_BLOCK = "dx-editor-inline-block",
        DATAGRID_MODULE_NAMESPACE = "dxDataGridEditorFactory",
        DATAGRID_UPDATE_FOCUS_EVENTS = addNamespace([pointerEvents.down, "focusin", clickEvent.name].join(" "), DATAGRID_MODULE_NAMESPACE),
        DATAGRID_FOCUS_OVERLAY_CLASS = "dx-datagrid-focus-overlay",
        DATAGRID_FOCUSED_ELEMENT_CLASS = "dx-focused",
        DATAGRID_CONTENT_CLASS = "dx-datagrid-content",
        DATAGRID_POINTER_EVENTS_TARGET_CLASS = "dx-pointer-events-target",
        DATAGRID_POINTER_EVENTS_NONE_CLASS = "dx-pointer-events-none",
        DX_HIDDEN = "dx-hidden",
        TAB_KEY = 9;
    exports.EditorFactoryController = gridCore.ViewController.inherit(function() {
        var getResultConfig = function(config, options) {
            return $.extend(config, {
                readOnly: options.readOnly,
                placeholder: options.placeholder,
                attr: {
                    id: options.id
                }
            }, options.editorOptions)
        };
        var checkEnterBug = function() {
            return browser.msie && parseInt(browser.version) <= 11 || devices.real().ios
        };
        var getTextEditorConfig = function(options) {
            var isValueChanged = false,
                data = {},
                isEnterBug = checkEnterBug(),
                sharedData = options.sharedData || data;
            return getResultConfig({
                placeholder: options.placeholder,
                width: options.width,
                value: options.value,
                onValueChanged: function(e) {
                    var updateValue = function(e, notFireEvent) {
                        isValueChanged = false;
                        options && options.setValue(e.value, notFireEvent)
                    };
                    window.clearTimeout(data.valueChangeTimeout);
                    if (e.jQueryEvent && "keyup" === e.jQueryEvent.type) {
                        if ("filterRow" === options.parentType || "searchPanel" === options.parentType) {
                            sharedData.valueChangeTimeout = data.valueChangeTimeout = window.setTimeout(function() {
                                updateValue(e, data.valueChangeTimeout !== sharedData.valueChangeTimeout)
                            }, commonUtils.isDefined(options.updateValueTimeout) ? options.updateValueTimeout : 0)
                        } else {
                            isValueChanged = true
                        }
                    } else {
                        updateValue(e)
                    }
                },
                onFocusOut: function(e) {
                    if (isEnterBug && isValueChanged) {
                        isValueChanged = false;
                        options.setValue(e.component.option("value"))
                    }
                },
                onKeyDown: function(e) {
                    if (isEnterBug && isValueChanged && 13 === e.jQueryEvent.keyCode) {
                        isValueChanged = false;
                        options.setValue(e.component.option("value"))
                    }
                },
                valueChangeEvent: "change" + ("filterRow" === options.parentType || isEnterBug ? " keyup" : "")
            }, options)
        };
        var prepareDateBox = function(options) {
            options.editorName = "dxDateBox";
            options.editorOptions = getResultConfig({
                value: options.value,
                onValueChanged: function(args) {
                    options.setValue(args.value)
                },
                onKeyDown: function(e) {
                    if (checkEnterBug() && 13 === e.jQueryEvent.keyCode) {
                        e.component.blur();
                        e.component.focus()
                    }
                },
                displayFormat: commonUtils.isString(options.format) && dateLocalization.getPatternByFormat(options.format) || options.format,
                formatWidthCalculator: null,
                width: "auto"
            }, options)
        };
        var prepareTextBox = function(options) {
            var config = getTextEditorConfig(options),
                isSearching = "searchPanel" === options.parentType,
                toString = function(value) {
                    return commonUtils.isDefined(value) ? value.toString() : ""
                };
            config.value = toString(options.value);
            config.valueChangeEvent += isSearching ? " keyup search" : "";
            config.mode = isSearching ? "search" : "text";
            options.editorName = "dxTextBox";
            options.editorOptions = config
        };
        var prepareNumberBox = function(options) {
            var config = getTextEditorConfig(options);
            config.value = commonUtils.isDefined(options.value) ? options.value : null;
            options.editorName = "dxNumberBox";
            options.editorOptions = config
        };
        var prepareBooleanEditor = function(options) {
            if ("filterRow" === options.parentType) {
                prepareSelectBox($.extend(options, {
                    lookup: {
                        displayExpr: function(data) {
                            if (true === data) {
                                return options.trueText || "true"
                            } else {
                                if (false === data) {
                                    return options.falseText || "false"
                                }
                            }
                        },
                        dataSource: [true, false]
                    }
                }))
            } else {
                prepareCheckBox(options)
            }
        };
        var prepareSelectBox = function(options) {
            var displayGetter, dataSource, postProcess, lookup = options.lookup,
                isFilterRow = "filterRow" === options.parentType;
            if (lookup) {
                displayGetter = compileGetter(lookup.displayExpr);
                dataSource = lookup.dataSource;
                if (commonUtils.isFunction(dataSource) && !isWrapped(dataSource)) {
                    dataSource = dataSource(options.row || {})
                }
                if (commonUtils.isObject(dataSource) || commonUtils.isArray(dataSource)) {
                    dataSource = normalizeDataSourceOptions(dataSource);
                    if (isFilterRow) {
                        postProcess = dataSource.postProcess;
                        dataSource.postProcess = function(items) {
                            if (0 === this.pageIndex()) {
                                items = items.slice(0);
                                items.unshift(null)
                            }
                            if (postProcess) {
                                return postProcess.call(this, items)
                            }
                            return items
                        }
                    }
                }
                var allowClearing = Boolean(lookup.allowClearing && !isFilterRow);
                options.editorName = "dxSelectBox";
                options.editorOptions = getResultConfig({
                    searchEnabled: true,
                    value: options.value,
                    valueExpr: options.lookup.valueExpr,
                    searchExpr: options.lookup.searchExpr || options.lookup.displayExpr,
                    allowClearing: allowClearing,
                    showClearButton: allowClearing,
                    displayExpr: function(data) {
                        if (null === data) {
                            return options.showAllText
                        }
                        return displayGetter(data)
                    },
                    dataSource: dataSource,
                    onValueChanged: function(e) {
                        var params = [e.value];
                        !isFilterRow && params.push(e.component.option("text"));
                        options.setValue.apply(this, params)
                    }
                }, options)
            }
        };
        var prepareCheckBox = function(options) {
            options.editorName = "dxCheckBox";
            options.editorOptions = getResultConfig({
                value: options.value,
                hoverStateEnabled: !options.readOnly,
                focusStateEnabled: !options.readOnly,
                activeStateEnabled: false,
                onValueChanged: function(e) {
                    options.setValue && options.setValue(e.value, e)
                },
                tabIndex: options.tabIndex ? options.tabIndex : 0
            }, options)
        };
        var createEditorCore = function(that, options) {
            if (options.editorName && options.editorOptions && options.editorElement[options.editorName]) {
                if ("dxCheckBox" === options.editorName) {
                    options.editorElement.addClass(DATAGRID_CHECKBOX_SIZE_CLASS);
                    options.editorElement.parent().addClass(DATAGRID_EDITOR_INLINE_BLOCK);
                    if (options.command || options.editorOptions.readOnly) {
                        options.editorElement.parent().addClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS)
                    }
                }
                that._createComponent(options.editorElement, options.editorName, options.editorOptions);
                if ("dxTextBox" === options.editorName) {
                    options.editorElement.dxTextBox("instance").registerKeyHandler("enter", $.noop)
                }
            }
        };
        return {
            _getFocusedElement: function($dataGridElement) {
                return $dataGridElement.find("td[tabindex]:focus, input:focus")
            },
            _getFocusCellSelector: function() {
                return ".dx-row > td"
            },
            _updateFocusCore: function() {
                var $focusCell, hideBorders, $focus = this._$focusedElement,
                    $dataGridElement = this.component && this.component.element();
                if ($dataGridElement) {
                    $focus = this._getFocusedElement($dataGridElement);
                    if ($focus.length) {
                        if (!$focus.hasClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS)) {
                            $focusCell = $focus.closest(this._getFocusCellSelector() + ", ." + DATAGRID_CELL_FOCUS_DISABLED_CLASS);
                            hideBorders = $focusCell.get(0) !== $focus.get(0) && $focusCell.hasClass(DATAGRID_EDITOR_INLINE_BLOCK);
                            $focus = $focusCell
                        }
                        if ($focus.length && !$focus.hasClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS)) {
                            this.focus($focus, hideBorders);
                            return
                        }
                    }
                }
                this.loseFocus()
            },
            _updateFocus: function(e) {
                var that = this,
                    isFocusOverlay = e && e.jQueryEvent && $(e.jQueryEvent.target).hasClass(DATAGRID_FOCUS_OVERLAY_CLASS);
                that._isFocusOverlay = that._isFocusOverlay || isFocusOverlay;
                clearTimeout(that._updateFocusTimeoutID);
                that._updateFocusTimeoutID = setTimeout(function() {
                    delete that._updateFocusTimeoutID;
                    if (!that._isFocusOverlay) {
                        that._updateFocusCore()
                    }
                    that._isFocusOverlay = false
                })
            },
            _updateFocusOverlaySize: function($element, position) {
                var location = positionUtils.calculate($element, $.extend({
                    collision: "fit"
                }, position));
                if (location.h.oversize > 0) {
                    $element.outerWidth($element.outerWidth() - location.h.oversize)
                }
                if (location.v.oversize > 0) {
                    $element.outerHeight($element.outerHeight() - location.v.oversize)
                }
            },
            callbackNames: function() {
                return ["focused"]
            },
            focus: function($element, hideBorder) {
                var that = this;
                if (void 0 === $element) {
                    return that._$focusedElement
                } else {
                    if ($element) {
                        setTimeout(function() {
                            var focusOverlayPosition, $focusOverlay = that._$focusOverlay = that._$focusOverlay || $("<div>").addClass(DATAGRID_FOCUS_OVERLAY_CLASS + " " + DATAGRID_POINTER_EVENTS_TARGET_CLASS);
                            if (hideBorder) {
                                that._$focusOverlay && that._$focusOverlay.addClass(DX_HIDDEN)
                            } else {
                                var align = browser.msie ? "left bottom" : browser.mozilla ? "right bottom" : "left top",
                                    $content = $element.closest("." + DATAGRID_CONTENT_CLASS);
                                $focusOverlay.removeClass(DX_HIDDEN).appendTo($content).outerWidth($element.outerWidth() + 1).outerHeight($element.outerHeight() + 1);
                                focusOverlayPosition = {
                                    my: align,
                                    at: align,
                                    of: $element,
                                    boundary: $content.length && $content
                                };
                                that._updateFocusOverlaySize($focusOverlay, focusOverlayPosition);
                                positionUtils.setup($focusOverlay, focusOverlayPosition);
                                $focusOverlay.css("visibility", "visible")
                            }
                            that._$focusedElement && that._$focusedElement.removeClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                            $element.addClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                            that._$focusedElement = $element;
                            that.focused.fire($element)
                        })
                    }
                }
            },
            resize: function() {
                var $focusedElement = this._$focusedElement;
                if ($focusedElement) {
                    this.focus($focusedElement)
                }
            },
            loseFocus: function() {
                this._$focusedElement && this._$focusedElement.removeClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                this._$focusedElement = null;
                this._$focusOverlay && this._$focusOverlay.addClass(DX_HIDDEN)
            },
            init: function() {
                this.createAction("onEditorPreparing", {
                    excludeValidators: ["designMode", "disabled", "readOnly"],
                    category: "rendering"
                });
                this.createAction("onEditorPrepared", {
                    excludeValidators: ["designMode", "disabled", "readOnly"],
                    category: "rendering"
                });
                this._updateFocusHandler = this._updateFocusHandler || this.createAction($.proxy(this._updateFocus, this));
                $(document).on(DATAGRID_UPDATE_FOCUS_EVENTS, this._updateFocusHandler);
                this._attachContainerEventHandlers()
            },
            _attachContainerEventHandlers: function() {
                var that = this,
                    $container = that.component && that.component.element(),
                    isIE10OrLower = browser.msie && parseInt(browser.version) < 11;
                if ($container) {
                    $container.on(addNamespace("keydown", DATAGRID_MODULE_NAMESPACE), function(e) {
                        if (e.which === TAB_KEY) {
                            that._updateFocusHandler(e)
                        }
                    });
                    isIE10OrLower && $container.on([pointerEvents.down, pointerEvents.up, clickEvent.name].join(" "), "." + DATAGRID_POINTER_EVENTS_TARGET_CLASS, $.proxy(that._focusOverlayEventProxy, that))
                }
            },
            _focusOverlayEventProxy: function(e) {
                var element, $target = $(e.target),
                    $currentTarget = $(e.currentTarget),
                    needProxy = $target.hasClass(DATAGRID_POINTER_EVENTS_TARGET_CLASS) || $target.hasClass(DATAGRID_POINTER_EVENTS_NONE_CLASS),
                    $focusedElement = this._$focusedElement;
                if (!needProxy || $currentTarget.hasClass(DX_HIDDEN)) {
                    return
                }
                $currentTarget.addClass(DX_HIDDEN);
                element = $target.get(0).ownerDocument.elementFromPoint(e.clientX, e.clientY);
                eventUtils.fireEvent({
                    originalEvent: e,
                    target: element
                });
                e.stopPropagation();
                $currentTarget.removeClass(DX_HIDDEN);
                $focusedElement && $focusedElement.find("input").focus()
            },
            dispose: function() {
                clearTimeout(this._updateFocusTimeoutID);
                $(document).off(DATAGRID_UPDATE_FOCUS_EVENTS, this._updateFocusHandler)
            },
            createEditor: function($container, options) {
                options.cancel = false;
                options.editorElement = $container;
                if (options.lookup) {
                    prepareSelectBox(options)
                } else {
                    switch (options.dataType) {
                        case "date":
                            prepareDateBox(options);
                            break;
                        case "boolean":
                            prepareBooleanEditor(options);
                            break;
                        case "number":
                            prepareNumberBox(options);
                            break;
                        default:
                            prepareTextBox(options)
                    }
                }
                this.executeAction("onEditorPreparing", options);
                if (options.cancel) {
                    return
                }
                createEditorCore(this, options);
                this.executeAction("onEditorPrepared", options)
            }
        }
    }());
    gridCore.registerModule("editorFactory", {
        defaultOptions: function() {
            return {}
        },
        controllers: {
            editorFactory: exports.EditorFactoryController
        },
        extenders: {
            controllers: {
                columnsResizer: {
                    _startResizing: function(args) {
                        this.callBase(args);
                        if (this.isResizing()) {
                            this.getController("editorFactory").loseFocus()
                        }
                    }
                }
            }
        }
    })
});
