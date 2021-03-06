/** 
 * DevExtreme (ui/color_box/color_view.js)
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
        translator = require("../../animation/translator"),
        browser = require("../../core/utils/browser"),
        Color = require("../../color"),
        messageLocalization = require("../../localization/message"),
        devices = require("../../core/devices"),
        registerComponent = require("../../core/component_registrator"),
        Editor = require("../editor/editor"),
        NumberBox = require("../number_box"),
        TextBox = require("../text_box"),
        Draggable = require("../draggable"),
        clickEvent = require("../../events/click");
    var COLOR_VIEW_CLASS = "dx-colorview",
        COLOR_VIEW_CONTAINER_CLASS = "dx-colorview-container",
        COLOR_VIEW_ROW_CLASS = "dx-colorview-container-row",
        COLOR_VIEW_CELL_CLASS = "dx-colorview-container-cell",
        COLOR_VIEW_PALETTE_CLASS = "dx-colorview-palette",
        COLOR_VIEW_PALETTE_CELL_CLASS = "dx-colorview-palette-cell",
        COLOR_VIEW_PALETTE_HANDLE_CLASS = "dx-colorview-palette-handle",
        COLOR_VIEW_PALETTE_GRADIENT_CLASS = "dx-colorview-palette-gradient",
        COLOR_VIEW_PALETTE_GRADIENT_WHITE_CLASS = "dx-colorview-palette-gradient-white",
        COLOR_VIEW_PALETTE_GRADIENT_BLACK_CLASS = "dx-colorview-palette-gradient-black",
        COLOR_VIEW_HUE_SCALE_CLASS = "dx-colorview-hue-scale",
        COLOR_VIEW_HUE_SCALE_CELL_CLASS = "dx-colorview-hue-scale-cell",
        COLOR_VIEW_HUE_SCALE_HANDLE_CLASS = "dx-colorview-hue-scale-handle",
        COLOR_VIEW_HUE_SCALE_WRAPPER_CLASS = "dx-colorview-hue-scale-wrapper",
        COLOR_VIEW_CONTROLS_CONTAINER_CLASS = "dx-colorview-controls-container",
        COLOR_VIEW_RED_LABEL_CLASS = "dx-colorview-label-red",
        COLOR_VIEW_GREEN_LABEL_CLASS = "dx-colorview-label-green",
        COLOR_VIEW_BLUE_LABEL_CLASS = "dx-colorview-label-blue",
        COLOR_VIEW_HEX_LABEL_CLASS = "dx-colorview-label-hex",
        COLOR_VIEW_ALPHA_CHANNEL_SCALE_CLASS = "dx-colorview-alpha-channel-scale",
        COLOR_VIEW_APLHA_CHANNEL_ROW_CLASS = "dx-colorview-alpha-channel-row",
        COLOR_VIEW_ALPHA_CHANNEL_SCALE_WRAPPER_CLASS = "dx-colorview-alpha-channel-wrapper",
        COLOR_VIEW_ALPHA_CHANNEL_LABEL_CLASS = "dx-colorview-alpha-channel-label",
        COLOR_VIEW_ALPHA_CHANNEL_HANDLE_CLASS = "dx-colorview-alpha-channel-handle",
        COLOR_VIEW_ALPHA_CHANNEL_CELL_CLASS = "dx-colorview-alpha-channel-cell",
        COLOR_VIEW_ALPHA_CHANNEL_BORDER_CLASS = "dx-colorview-alpha-channel-border",
        COLOR_VIEW_COLOR_PREVIEW = "dx-colorview-color-preview",
        COLOR_VIEW_COLOR_PREVIEW_CONTAINER_CLASS = "dx-colorview-color-preview-container",
        COLOR_VIEW_COLOR_PREVIEW_CONTAINER_INNER_CLASS = "dx-colorview-color-preview-container-inner",
        COLOR_VIEW_COLOR_PREVIEW_COLOR_CURRENT = "dx-colorview-color-preview-color-current",
        COLOR_VIEW_COLOR_PREVIEW_COLOR_NEW = "dx-colorview-color-preview-color-new";
    var ColorView = Editor.inherit({
        _supportedKeys: function() {
            var isRTL = this.option("rtlEnabled");
            var that = this,
                getHorizontalPaletteStep = function(e) {
                    var step = 100 / that._paletteWidth;
                    if (e.shiftKey) {
                        step *= that.option("keyStep")
                    }
                    step = step > 1 ? step : 1;
                    return Math.round(step)
                },
                updateHorizontalPaletteValue = function(step) {
                    var value = that._currentColor.hsv.s + step;
                    if (value > 100) {
                        value = 100
                    } else {
                        if (value < 0) {
                            value = 0
                        }
                    }
                    that._currentColor.hsv.s = value;
                    updatePaletteValue()
                },
                getVerticalPaletteStep = function(e) {
                    var step = 100 / that._paletteHeight;
                    if (e.shiftKey) {
                        step *= that.option("keyStep")
                    }
                    step = step > 1 ? step : 1;
                    return Math.round(step)
                },
                updateVerticalPaletteValue = function(step) {
                    var value = that._currentColor.hsv.v + step;
                    if (value > 100) {
                        value = 100
                    } else {
                        if (value < 0) {
                            value = 0
                        }
                    }
                    that._currentColor.hsv.v = value;
                    updatePaletteValue()
                },
                updatePaletteValue = function() {
                    that._placePaletteHandle();
                    that._updateColorFromHsv(that._currentColor.hsv.h, that._currentColor.hsv.s, that._currentColor.hsv.v)
                },
                getHueScaleStep = function(e) {
                    var step = 360 / (that._hueScaleWrapperHeight - that._hueScaleHandleHeight);
                    if (e.shiftKey) {
                        step *= that.option("keyStep")
                    }
                    step = step > 1 ? step : 1;
                    return step
                },
                updateHueScaleValue = function(step) {
                    that._currentColor.hsv.h += step;
                    that._placeHueScaleHandle();
                    var handleLocation = translator.locate(that._$hueScaleHandle);
                    that._updateColorHue(handleLocation.top + that._hueScaleHandleHeight / 2)
                },
                getAlphaScaleStep = function(e) {
                    var step = 1 / that._alphaChannelScaleWorkWidth;
                    if (e.shiftKey) {
                        step *= that.option("keyStep")
                    }
                    step = step > .01 ? step : .01;
                    step = isRTL ? -step : step;
                    return step
                },
                updateAlphaScaleValue = function(step) {
                    that._currentColor.a += step;
                    that._placeAlphaChannelHandle();
                    var handleLocation = translator.locate(that._$alphaChannelHandle);
                    that._calculateColorTransparencyByScaleWidth(handleLocation.left + that._alphaChannelHandleWidth / 2)
                };
            return $.extend(this.callBase(), {
                upArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.ctrlKey) {
                        if (this._currentColor.hsv.h <= 360 && !this._isTopColorHue) {
                            updateHueScaleValue(getHueScaleStep(e))
                        }
                    } else {
                        if (this._currentColor.hsv.v < 100) {
                            updateVerticalPaletteValue(getVerticalPaletteStep(e))
                        }
                    }
                },
                downArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.ctrlKey) {
                        if (this._currentColor.hsv.h >= 0) {
                            if (this._isTopColorHue) {
                                this._currentColor.hsv.h = 360
                            }
                            updateHueScaleValue(-getHueScaleStep(e))
                        }
                    } else {
                        if (this._currentColor.hsv.v > 0) {
                            updateVerticalPaletteValue(-getVerticalPaletteStep(e))
                        }
                    }
                },
                rightArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.ctrlKey) {
                        if (isRTL ? this._currentColor.a < 1 : this._currentColor.a > 0 && this.option("editAlphaChannel")) {
                            updateAlphaScaleValue(-getAlphaScaleStep(e))
                        }
                    } else {
                        if (this._currentColor.hsv.s < 100) {
                            updateHorizontalPaletteValue(getHorizontalPaletteStep(e))
                        }
                    }
                },
                leftArrow: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.ctrlKey) {
                        if (isRTL ? this._currentColor.a > 0 : this._currentColor.a < 1 && this.option("editAlphaChannel")) {
                            updateAlphaScaleValue(getAlphaScaleStep(e))
                        }
                    } else {
                        if (this._currentColor.hsv.s > 0) {
                            updateHorizontalPaletteValue(-getHorizontalPaletteStep(e))
                        }
                    }
                },
                enter: function(e) {
                    if ("useButtons" === this.option("applyValueMode")) {
                        this.applyColor()
                    }
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                value: null,
                editAlphaChannel: false,
                applyValueMode: "useButtons",
                keyStep: 1
            })
        },
        _defaultOptionsRules: function() {
            return this.callBase().concat([{
                device: function(device) {
                    return "desktop" === devices.real().deviceType && !devices.isSimulator()
                },
                options: {
                    focusStateEnabled: true
                }
            }])
        },
        _init: function() {
            this.callBase();
            this._initColorAndOpacity()
        },
        _initColorAndOpacity: function() {
            this._setCurrentColor(this.option("value"))
        },
        _setCurrentColor: function(value) {
            value = value || "#000000";
            var newColor = new Color(value);
            if (!newColor.colorIsInvalid) {
                if (!this._currentColor || this._makeRgba(this._currentColor) !== this._makeRgba(newColor)) {
                    this._currentColor = newColor;
                    if (this._$currentColor) {
                        this._makeTransparentBackground(this._$currentColor, newColor)
                    }
                }
            } else {
                this.option("value", this._currentColor.baseColor)
            }
        },
        _render: function() {
            this.callBase();
            this.element().addClass(COLOR_VIEW_CLASS);
            this._renderColorPickerContainer()
        },
        _enterKeyHandler: function() {
            if ("useButtons" === this.option("applyValueMode")) {
                this.applyColor()
            }
        },
        _makeTransparentBackground: function($el, color) {
            if (!(color instanceof Color)) {
                color = new Color(color)
            }
            if (browser.msie && "8.0" === browser.version) {
                $el.css({
                    background: color.toHex(),
                    filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + 100 * color.a + ")"
                })
            } else {
                $el.css("backgroundColor", this._makeRgba(color))
            }
        },
        _makeRgba: function(color) {
            if (!(color instanceof Color)) {
                color = new Color(color)
            }
            return "rgba(" + [color.r, color.g, color.b, color.a].join(", ") + ")"
        },
        _renderValue: function() {
            this.callBase(this.option("editAlphaChannel") ? this._makeRgba(this._currentColor) : this.option("value"))
        },
        _renderColorPickerContainer: function() {
            var $parent = this.element();
            this._$colorPickerContainer = $("<div>", {
                "class": COLOR_VIEW_CONTAINER_CLASS,
                appendTo: $parent
            });
            this._renderHtmlRows();
            this._renderPalette();
            this._renderHueScale();
            this._renderControlsContainer();
            this._renderControls();
            this._renderAlphaChannelElements()
        },
        _renderHtmlRows: function(updatedOption) {
            var $renderedRows = this._$colorPickerContainer.find("." + COLOR_VIEW_ROW_CLASS),
                renderedRowsCount = $renderedRows.length,
                rowCount = this._calculateRowsCount(),
                delta = renderedRowsCount - rowCount;
            if (delta > 0) {
                var index = this._calculateRemovedHtmlRowIndex(renderedRowsCount, updatedOption);
                $renderedRows.eq(index).remove()
            }
            if (delta < 0) {
                delta = Math.abs(delta);
                var rows = [];
                for (var i = 0; i < delta; i++) {
                    rows.push($("<div>", {
                        "class": COLOR_VIEW_ROW_CLASS
                    }))
                }
                if (renderedRowsCount) {
                    var previousRowIndex = this._calculateHtmlRowIndex(renderedRowsCount, updatedOption);
                    $renderedRows.eq(previousRowIndex).after(rows)
                } else {
                    this._$colorPickerContainer.append(rows)
                }
            }
        },
        _renderHtmlCellInsideRow: function(rowSelector, $rowParent, additionalClass) {
            return $("<div>", {
                "class": COLOR_VIEW_CELL_CLASS,
                addClass: additionalClass,
                appendTo: $rowParent.find("." + COLOR_VIEW_ROW_CLASS + rowSelector)
            })
        },
        _calculateRowsCount: function() {
            if (this.option("editAlphaChannel")) {
                return "instantly" === this.option("applyValueMode") ? 2 : 3
            }
            return "instantly" === this.option("applyValueMode") ? 1 : 2
        },
        _calculateRemovedHtmlRowIndex: function(renderedRowsCount, updatedOption) {
            var index = -1;
            if (3 === renderedRowsCount) {
                if ("editAlphaChannel" === updatedOption) {
                    index = -2
                }
                if ("applyValueMode" === updatedOption) {
                    index = -1
                }
            }
            return index
        },
        _calculateHtmlRowIndex: function(renderedRowsCount, updatedOption) {
            var index = 0;
            if (2 === renderedRowsCount) {
                if ("applyValueMode" === updatedOption) {
                    index = 1
                }
            }
            return index
        },
        _renderPalette: function() {
            var $paletteCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer, COLOR_VIEW_PALETTE_CELL_CLASS),
                $paletteGradientWhite = $("<div>", {
                    "class": [COLOR_VIEW_PALETTE_GRADIENT_CLASS, COLOR_VIEW_PALETTE_GRADIENT_WHITE_CLASS].join(" ")
                }),
                $paletteGradientBlack = $("<div>", {
                    "class": [COLOR_VIEW_PALETTE_GRADIENT_CLASS, COLOR_VIEW_PALETTE_GRADIENT_BLACK_CLASS].join(" ")
                });
            this._$palette = $("<div>", {
                "class": COLOR_VIEW_PALETTE_CLASS,
                css: {
                    backgroundColor: this._currentColor.getPureColor().toHex()
                },
                appendTo: $paletteCell
            });
            this._paletteHeight = this._$palette.height();
            this._paletteWidth = this._$palette.width();
            this._renderPaletteHandle();
            this._$palette.append([$paletteGradientWhite, $paletteGradientBlack])
        },
        _renderPaletteHandle: function() {
            this._createComponent(this._$paletteHandle = $("<div>", {
                "class": COLOR_VIEW_PALETTE_HANDLE_CLASS,
                appendTo: this._$palette
            }), Draggable, {
                area: this._$palette,
                allowMoveByClick: true,
                boundOffset: $.proxy(function() {
                    return -this._paletteHandleHeight / 2
                }, this),
                onDrag: $.proxy(function(e) {
                    var paletteHandlePosition = translator.locate(this._$paletteHandle);
                    this._updateByDrag = true;
                    this._updateColorFromHsv(this._currentColor.hsv.h, this._calculateColorSaturation(paletteHandlePosition), this._calculateColorValue(paletteHandlePosition))
                }, this)
            });
            this._paletteHandleWidth = this._$paletteHandle.width();
            this._paletteHandleHeight = this._$paletteHandle.height();
            this._placePaletteHandle()
        },
        _placePaletteHandle: function() {
            translator.move(this._$paletteHandle, {
                left: Math.round(this._paletteWidth * this._currentColor.hsv.s / 100 - this._paletteHandleWidth / 2),
                top: Math.round(this._paletteHeight - this._paletteHeight * this._currentColor.hsv.v / 100 - this._paletteHandleHeight / 2)
            })
        },
        _calculateColorValue: function(paletteHandlePosition) {
            var value = Math.floor(paletteHandlePosition.top + this._paletteHandleHeight / 2);
            return 100 - Math.round(100 * value / this._paletteHeight)
        },
        _calculateColorSaturation: function(paletteHandlePosition) {
            var saturation = Math.floor(paletteHandlePosition.left + this._paletteHandleWidth / 2);
            return Math.round(100 * saturation / this._paletteWidth)
        },
        _updateColorFromHsv: function(hue, saturation, value) {
            var a = this._currentColor.a;
            this._currentColor = new Color("hsv(" + [hue, saturation, value].join(",") + ")");
            this._currentColor.a = a;
            this._updateColorParamsAndColorPreview();
            if ("instantly" === this.option("applyValueMode")) {
                this.applyColor()
            }
        },
        _renderHueScale: function() {
            var $hueScaleCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer, COLOR_VIEW_HUE_SCALE_CELL_CLASS);
            this._$hueScaleWrapper = $("<div>", {
                "class": COLOR_VIEW_HUE_SCALE_WRAPPER_CLASS,
                appendTo: $hueScaleCell
            });
            this._$hueScale = $("<div>", {
                "class": COLOR_VIEW_HUE_SCALE_CLASS,
                appendTo: this._$hueScaleWrapper
            });
            this._hueScaleHeight = this._$hueScale.height();
            this._hueScaleWrapperHeight = this._$hueScaleWrapper.outerHeight();
            this._renderHueScaleHandle()
        },
        _renderHueScaleHandle: function() {
            this._createComponent(this._$hueScaleHandle = $("<div>", {
                "class": COLOR_VIEW_HUE_SCALE_HANDLE_CLASS,
                appendTo: this._$hueScaleWrapper
            }), Draggable, {
                area: this._$hueScaleWrapper,
                allowMoveByClick: true,
                direction: "vertical",
                onDrag: $.proxy(function(e) {
                    this._updateByDrag = true;
                    this._updateColorHue(translator.locate(this._$hueScaleHandle).top + this._hueScaleHandleHeight / 2)
                }, this)
            });
            this._hueScaleHandleHeight = this._$hueScaleHandle.height();
            this._placeHueScaleHandle()
        },
        _placeHueScaleHandle: function() {
            var hueScaleHeight = this._hueScaleWrapperHeight,
                handleHeight = this._hueScaleHandleHeight,
                top = (hueScaleHeight - handleHeight) * (360 - this._currentColor.hsv.h) / 360;
            if (hueScaleHeight < top + handleHeight) {
                top = hueScaleHeight - handleHeight
            }
            if (top < 0) {
                top = 0
            }
            translator.move(this._$hueScaleHandle, {
                top: Math.round(top)
            })
        },
        _updateColorHue: function(handlePosition) {
            var hue = 360 - Math.round(360 * (handlePosition - this._hueScaleHandleHeight / 2) / (this._hueScaleWrapperHeight - this._hueScaleHandleHeight)),
                saturation = this._currentColor.hsv.s,
                value = this._currentColor.hsv.v;
            this._isTopColorHue = false;
            hue = hue < 0 ? 0 : hue;
            if (hue >= 360) {
                this._isTopColorHue = true;
                hue = 0
            }
            this._updateColorFromHsv(hue, saturation, value);
            this._$palette.css("backgroundColor", this._currentColor.getPureColor().toHex())
        },
        _renderControlsContainer: function() {
            var $controlsContainerCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer);
            this._$controlsContainer = $("<div>", {
                "class": COLOR_VIEW_CONTROLS_CONTAINER_CLASS,
                appendTo: $controlsContainerCell
            })
        },
        _renderControls: function() {
            this._renderColorsPreview();
            this._renderRgbInputs();
            this._renderHexInput()
        },
        _renderColorsPreview: function() {
            var $colorsPreviewContainer = $("<div>", {
                    "class": COLOR_VIEW_COLOR_PREVIEW_CONTAINER_CLASS,
                    appendTo: this._$controlsContainer
                }),
                $colorsPreviewContainerInner = $("<div>", {
                    "class": COLOR_VIEW_COLOR_PREVIEW_CONTAINER_INNER_CLASS,
                    appendTo: $colorsPreviewContainer
                });
            this._$currentColor = $("<div>", {
                "class": [COLOR_VIEW_COLOR_PREVIEW, COLOR_VIEW_COLOR_PREVIEW_COLOR_CURRENT].join(" ")
            });
            this._$newColor = $("<div>", {
                "class": [COLOR_VIEW_COLOR_PREVIEW, COLOR_VIEW_COLOR_PREVIEW_COLOR_NEW].join(" ")
            });
            this._makeTransparentBackground(this._$currentColor, this._currentColor);
            this._makeTransparentBackground(this._$newColor, this._currentColor);
            $colorsPreviewContainerInner.append([this._$currentColor, this._$newColor])
        },
        _renderAlphaChannelElements: function() {
            if (this.option("editAlphaChannel")) {
                this._$colorPickerContainer.find("." + COLOR_VIEW_ROW_CLASS).eq(1).addClass(COLOR_VIEW_APLHA_CHANNEL_ROW_CLASS);
                this._renderAlphaChannelScale();
                this._renderAlphaChannelInput()
            }
        },
        _renderRgbInputs: function() {
            this._rgbInputsWithLabels = [this._renderEditorWithLabel({
                editorType: NumberBox.publicName(),
                value: this._currentColor.r,
                onValueChanged: $.proxy(this._updateColor, this, false),
                labelText: "R",
                labelAriaText: messageLocalization.format("dxColorView-ariaRed"),
                labelClass: COLOR_VIEW_RED_LABEL_CLASS
            }), this._renderEditorWithLabel({
                editorType: NumberBox.publicName(),
                value: this._currentColor.g,
                onValueChanged: $.proxy(this._updateColor, this, false),
                labelText: "G",
                labelAriaText: messageLocalization.format("dxColorView-ariaGreen"),
                labelClass: COLOR_VIEW_GREEN_LABEL_CLASS
            }), this._renderEditorWithLabel({
                editorType: NumberBox.publicName(),
                value: this._currentColor.b,
                onValueChanged: $.proxy(this._updateColor, this, false),
                labelText: "B",
                labelAriaText: messageLocalization.format("dxColorView-ariaBlue"),
                labelClass: COLOR_VIEW_BLUE_LABEL_CLASS
            })];
            this._$controlsContainer.append(this._rgbInputsWithLabels);
            this._rgbInputs = [this._rgbInputsWithLabels[0].find(".dx-numberbox").dxNumberBox("instance"), this._rgbInputsWithLabels[1].find(".dx-numberbox").dxNumberBox("instance"), this._rgbInputsWithLabels[2].find(".dx-numberbox").dxNumberBox("instance")];
            $.each(this._rgbInputs, $.proxy(function(_, instance) {
                this._attachEnterKeyHandler(instance)
            }, this))
        },
        _renderEditorWithLabel: function(options) {
            var $editor = $("<div>"),
                $label = $("<label>", {
                    "class": options.labelClass,
                    text: options.labelText + ":",
                    append: $editor
                }).off(clickEvent.name).on(clickEvent.name, function(e) {
                    e.preventDefault()
                }),
                editorType = options.editorType,
                editorOptions = {
                    value: options.value,
                    onValueChanged: options.onValueChanged
                };
            if (editorType === NumberBox.publicName()) {
                editorOptions.min = options.min || 0;
                editorOptions.max = options.max || 255;
                editorOptions.step = options.step || 1
            }
            $editor[editorType](editorOptions);
            this.setAria("label", options.labelAriaText, $editor);
            return $label
        },
        hexInputOptions: function() {
            return {
                editorType: TextBox.publicName(),
                value: this._currentColor.toHex().replace("#", ""),
                onValueChanged: $.proxy(this._updateColor, this, true),
                labelClass: COLOR_VIEW_HEX_LABEL_CLASS,
                labelText: "#",
                labelAriaText: messageLocalization.format("dxColorView-ariaHex")
            }
        },
        _renderHexInput: function() {
            this._hexInput = TextBox.getInstance(this._renderEditorWithLabel(this.hexInputOptions()).appendTo(this._$controlsContainer).find(".dx-textbox"));
            this._attachEnterKeyHandler(this._hexInput)
        },
        _attachEnterKeyHandler: function(instance) {
            instance.registerKeyHandler("enter", $.proxy(function(e) {
                this._enterKeyHandler(e)
            }, this))
        },
        _renderAlphaChannelScale: function() {
            var $alphaChannelScaleCell = this._renderHtmlCellInsideRow(":eq(1)", this._$colorPickerContainer, COLOR_VIEW_ALPHA_CHANNEL_CELL_CLASS),
                $alphaChannelBorder = $("<div>", {
                    "class": COLOR_VIEW_ALPHA_CHANNEL_BORDER_CLASS,
                    appendTo: $alphaChannelScaleCell
                }),
                $alphaChannelScaleWrapper = $("<div>", {
                    "class": COLOR_VIEW_ALPHA_CHANNEL_SCALE_WRAPPER_CLASS,
                    appendTo: $alphaChannelBorder
                });
            this._$alphaChannelScale = $("<div>", {
                "class": COLOR_VIEW_ALPHA_CHANNEL_SCALE_CLASS,
                appendTo: $alphaChannelScaleWrapper
            });
            this._makeCSSLinearGradient(this._$alphaChannelScale);
            this._renderAlphaChannelHandle($alphaChannelScaleCell)
        },
        _makeCSSLinearGradient: function($el) {
            var color = this._currentColor,
                colorAsRgb = [color.r, color.g, color.b].join(","),
                colorAsHex = color.toHex().replace("#", "");
            var combineGradientString = function(colorAsRgb, colorAsHex) {
                var rtlEnabled = this.option("rtlEnabled"),
                    startColor = "rgba(" + colorAsRgb + ", " + (rtlEnabled ? "1" : "0") + ")",
                    finishColor = "rgba(" + colorAsRgb + ", " + (rtlEnabled ? "0" : "1") + ")",
                    startColorIE = "'#" + (rtlEnabled ? "00" : "") + colorAsHex + "'",
                    finishColorIE = "'#" + (rtlEnabled ? "" : "00") + colorAsHex + "'";
                return ["background-image: -webkit-linear-gradient(180deg, " + startColor + ", " + finishColor + ")", "background-image: -moz-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: -ms-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: -o-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "filter: progid:DXImageTransform.Microsoft.gradient(GradientType=1,startColorstr=" + startColorIE + ", endColorstr=" + finishColorIE + ")"].join(";")
            };
            $el.attr("style", combineGradientString.call(this, colorAsRgb, colorAsHex))
        },
        _renderAlphaChannelInput: function() {
            var that = this,
                $alphaChannelInputCell = this._renderHtmlCellInsideRow(":eq(1)", this._$colorPickerContainer);
            that._alphaChannelInput = this._renderEditorWithLabel({
                editorType: NumberBox.publicName(),
                value: this._currentColor.a,
                max: 1,
                step: .1,
                onValueChanged: function(e) {
                    var value = e.value;
                    value = that._currentColor.isValidAlpha(value) ? value : that._currentColor.a;
                    that._updateColorTransparency(value);
                    that._placeAlphaChannelHandle()
                },
                labelClass: COLOR_VIEW_ALPHA_CHANNEL_LABEL_CLASS,
                labelText: "Alpha",
                labelAriaText: messageLocalization.format("dxColorView-ariaAlpha")
            }).appendTo($alphaChannelInputCell).find(".dx-numberbox").dxNumberBox("instance");
            this._attachEnterKeyHandler(that._alphaChannelInput)
        },
        _updateColorTransparency: function(transparency) {
            this._currentColor.a = transparency;
            this._makeTransparentBackground(this._$newColor, this._currentColor);
            if ("instantly" === this.option("applyValueMode")) {
                this.applyColor()
            }
        },
        _renderAlphaChannelHandle: function($parent) {
            this._createComponent(this._$alphaChannelHandle = $("<div>", {
                "class": COLOR_VIEW_ALPHA_CHANNEL_HANDLE_CLASS,
                appendTo: $parent
            }), Draggable, {
                area: $parent,
                allowMoveByClick: true,
                direction: "horizontal",
                onDrag: $.proxy(function(e) {
                    this._updateByDrag = true;
                    var $alphaChannelHandle = this._$alphaChannelHandle,
                        alphaChannelHandlePosition = translator.locate($alphaChannelHandle).left + this._alphaChannelHandleWidth / 2;
                    this._calculateColorTransparencyByScaleWidth(alphaChannelHandlePosition)
                }, this)
            });
            this._alphaChannelHandleWidth = this._$alphaChannelHandle.width();
            this._alphaChannelScaleWorkWidth = $parent.width() - this._alphaChannelHandleWidth;
            this._placeAlphaChannelHandle()
        },
        _calculateColorTransparencyByScaleWidth: function(handlePosition) {
            var transparency = (handlePosition - this._alphaChannelHandleWidth / 2) / this._alphaChannelScaleWorkWidth,
                rtlEnabled = this.option("rtlEnabled");
            transparency = rtlEnabled ? transparency : 1 - transparency;
            if (handlePosition >= this._alphaChannelScaleWorkWidth + this._alphaChannelHandleWidth / 2) {
                transparency = rtlEnabled ? 1 : 0
            } else {
                if (transparency < 1) {
                    transparency = transparency.toFixed(2)
                }
            }
            transparency = Math.max(transparency, 0);
            transparency = Math.min(transparency, 1);
            this._alphaChannelInput.option("value", transparency)
        },
        _placeAlphaChannelHandle: function() {
            var left = this._alphaChannelScaleWorkWidth * (1 - this._currentColor.a);
            if (left < 0) {
                left = 0
            }
            if (this._alphaChannelScaleWorkWidth < left) {
                left = this._alphaChannelScaleWorkWidth
            }
            translator.move(this._$alphaChannelHandle, {
                left: this.option("rtlEnabled") ? this._alphaChannelScaleWorkWidth - left : left
            })
        },
        applyColor: function() {
            var colorValue = this.option("editAlphaChannel") ? this._makeRgba(this._currentColor) : this._currentColor.toHex();
            this._makeTransparentBackground(this._$currentColor, this._currentColor);
            this.option("value", colorValue)
        },
        cancelColor: function() {
            this._initColorAndOpacity();
            this._refreshMarkup()
        },
        _updateColor: function(isHex) {
            var rgba, newColor;
            if (isHex) {
                newColor = this._validateHex("#" + this._hexInput.option("value"))
            } else {
                rgba = this._validateRgb();
                if (this._alphaChannelInput) {
                    rgba.push(this._alphaChannelInput.option("value"));
                    newColor = "rgba(" + rgba.join(", ") + ")"
                } else {
                    newColor = "rgb(" + rgba.join(", ") + ")"
                }
            }
            if (!this._suppressEditorsValueUpdating) {
                this._currentColor = new Color(newColor);
                this._refreshMarkup();
                if ("instantly" === this.option("applyValueMode")) {
                    this.applyColor()
                }
            }
        },
        _validateHex: function(hex) {
            return this._currentColor.isValidHex(hex) ? hex : this._currentColor.toHex()
        },
        _validateRgb: function() {
            var r = this._rgbInputs[0].option("value"),
                g = this._rgbInputs[1].option("value"),
                b = this._rgbInputs[2].option("value");
            if (!this._currentColor.isValidRGB(r, g, b)) {
                r = this._currentColor.r;
                g = this._currentColor.g;
                b = this._currentColor.b
            }
            return [r, g, b]
        },
        _refreshMarkup: function() {
            this._placeHueScaleHandle();
            this._placePaletteHandle();
            this._updateColorParamsAndColorPreview();
            this._$palette.css("backgroundColor", this._currentColor.getPureColor().toHex());
            if (this._$alphaChannelHandle) {
                this._updateColorTransparency(this._currentColor.a);
                this._placeAlphaChannelHandle()
            }
        },
        _updateColorParamsAndColorPreview: function() {
            this._suppressEditorsValueUpdating = true;
            this._hexInput.option("value", this._currentColor.toHex().replace("#", ""));
            this._rgbInputs[0].option("value", this._currentColor.r);
            this._rgbInputs[1].option("value", this._currentColor.g);
            this._rgbInputs[2].option("value", this._currentColor.b);
            this._suppressEditorsValueUpdating = false;
            this._makeTransparentBackground(this._$newColor, this._currentColor);
            if (this.option("editAlphaChannel")) {
                this._makeCSSLinearGradient.call(this, this._$alphaChannelScale);
                this._alphaChannelInput.option("value", this._currentColor.a)
            }
        },
        _optionChanged: function(args) {
            var value = args.value;
            switch (args.name) {
                case "value":
                    this._setCurrentColor(value);
                    if (!this._updateByDrag) {
                        this._refreshMarkup()
                    }
                    this._updateByDrag = false;
                    this.callBase(args);
                    break;
                case "editAlphaChannel":
                    if (this._$colorPickerContainer) {
                        this._renderHtmlRows("editAlphaChannel");
                        this._renderAlphaChannelElements()
                    }
                    break;
                case "applyValueMode":
                    if (this._$colorPickerContainer) {
                        this._renderHtmlRows("applyValueMode")
                    }
                    break;
                case "keyStep":
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxColorView", ColorView);
    module.exports = ColorView
});
