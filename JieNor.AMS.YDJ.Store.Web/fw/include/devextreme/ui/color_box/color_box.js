/** 
 * DevExtreme (ui/color_box/color_box.js)
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
        Color = require("../../color"),
        ColorView = require("./color_view"),
        registerComponent = require("../../core/component_registrator"),
        DropDownEditor = require("../drop_down_editor/ui.drop_down_editor");
    var COLOR_BOX_CLASS = "dx-colorbox",
        COLOR_BOX_INPUT_CLASS = COLOR_BOX_CLASS + "-input",
        COLOR_BOX_INPUT_CONTAINER_CLASS = COLOR_BOX_INPUT_CLASS + "-container",
        COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS = COLOR_BOX_CLASS + "-color-result-preview",
        COLOR_BOX_COLOR_IS_NOT_DEFINED = COLOR_BOX_CLASS + "-color-is-not-defined",
        COLOR_BOX_OVERLAY_CLASS = COLOR_BOX_CLASS + "-overlay",
        COLOR_BOX_CONTAINER_CELL_CLASS = "dx-colorview-container-cell",
        COLOR_BOX_BUTTON_CELL_CLASS = "dx-colorview-button-cell",
        COLOR_BOX_BUTTONS_CONTAINER_CLASS = "dx-colorview-buttons-container",
        COLOR_BOX_APPLY_BUTTON_CLASS = "dx-colorview-apply-button",
        COLOR_BOX_CANCEL_BUTTON_CLASS = "dx-colorview-cancel-button";
    var colorEditorPrototype = ColorView.prototype,
        colorUtils = {
            makeTransparentBackground: $.proxy(colorEditorPrototype._makeTransparentBackground, colorEditorPrototype),
            makeRgba: $.proxy(colorEditorPrototype._makeRgba, colorEditorPrototype)
        };
    var ColorBox = DropDownEditor.inherit({
        _supportedKeys: function() {
            var arrowHandler = function(e) {
                e.stopPropagation();
                if (this.option("opened")) {
                    e.preventDefault();
                    return true
                }
            };
            var upArrowHandler = function(e) {
                if (!this.option("opened")) {
                    e.preventDefault();
                    return false
                }
                if (e.altKey) {
                    this.close();
                    return false
                }
                return true
            };
            var downArrowHandler = function(e) {
                if (!this.option("opened") && !e.altKey) {
                    e.preventDefault();
                    return false
                }
                if (!this.option("opened") && e.altKey) {
                    this._validatedOpening();
                    return false
                }
                return true
            };
            return $.extend(this.callBase(), {
                tab: function(e) {
                    if (this.option("opened")) {
                        e.preventDefault();
                        this._colorView._rgbInputs[0].focus()
                    }
                },
                enter: this._enterKeyHandler,
                leftArrow: arrowHandler,
                rightArrow: arrowHandler,
                upArrow: upArrowHandler,
                downArrow: downArrowHandler
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                editAlphaChannel: false,
                applyValueMode: "useButtons",
                keyStep: 1,
                onApplyButtonClick: null,
                onCancelButtonClick: null,
                buttonsLocation: "bottom after"
            })
        },
        _popupConfig: function() {
            return $.extend(this.callBase(), {
                height: "auto",
                width: ""
            })
        },
        _contentReadyHandler: function() {
            this._createColorView();
            this._addPopupBottomClasses()
        },
        _addPopupBottomClasses: function() {
            var $popupBottom = this._popup.bottomToolbar();
            if ($popupBottom) {
                $popupBottom.addClass(COLOR_BOX_CONTAINER_CELL_CLASS).addClass(COLOR_BOX_BUTTON_CELL_CLASS).find(".dx-toolbar-items-container").addClass(COLOR_BOX_BUTTONS_CONTAINER_CLASS);
                $popupBottom.find(".dx-popup-done").addClass(COLOR_BOX_APPLY_BUTTON_CLASS);
                $popupBottom.find(".dx-popup-cancel").addClass(COLOR_BOX_CANCEL_BUTTON_CLASS)
            }
        },
        _createColorView: function() {
            this._popup.overlayContent().addClass(COLOR_BOX_OVERLAY_CLASS);
            var $colorView = $("<div>").appendTo(this._popup.content());
            this._colorView = this._createComponent($colorView, ColorView, this._colorViewConfig());
            this._colorView._enterKeyHandler = $.proxy(this._enterKeyHandler, this);
            $colorView.on("focus", $.proxy(function() {
                this.focus()
            }, this))
        },
        _colorViewConfig: function() {
            var that = this;
            return {
                value: that.option("value"),
                editAlphaChannel: that.option("editAlphaChannel"),
                applyValueMode: that.option("applyValueMode"),
                focusStateEnabled: that.option("focusStateEnabled"),
                onValueChanged: function(args) {
                    var value = args.value;
                    that.option("value", value);
                    if (value) {
                        colorUtils.makeTransparentBackground(that._$colorResultPreview, value)
                    }
                },
                _keyboardProcessor: that._colorViewProcessor
            }
        },
        _enterKeyHandler: function(e) {
            var newValue = this._input().val(),
                oldValue = this.option("editAlphaChannel") ? colorUtils.makeRgba(this.option("value")) : this.option("value");
            var color = new Color(newValue);
            if (color.colorIsInvalid && "" !== newValue) {
                this._input().val(oldValue);
                return
            }
            if (newValue && newValue !== oldValue) {
                this._applyColorFromInput(newValue);
                this.option("value", this.option("editAlphaChannel") ? colorUtils.makeRgba(newValue) : newValue);
                return false
            }
            if (this._colorView && "useButtons" === this.option("applyValueMode")) {
                this._colorView.applyColor()
            }
            if (this.option("opened")) {
                e.preventDefault();
                this.close()
            }
            return false
        },
        _applyButtonHandler: function() {
            this._colorView.applyColor();
            if ($.isFunction(this.option("onApplyButtonClick"))) {
                this.option("onApplyButtonClick")()
            }
            this.callBase()
        },
        _cancelButtonHandler: function() {
            this._colorView.cancelColor();
            if ($.isFunction(this.option("onCancelButtonClick"))) {
                this.option("onCancelButtonClick")()
            }
            this.callBase()
        },
        _attachChildKeyboardEvents: function() {
            this._colorViewProcessor = this._keyboardProcessor.attachChildProcessor();
            if (this._colorView) {
                this._colorView.option("_keyboardProcessor", this._colorViewProcessor);
                return
            }
        },
        _init: function() {
            this.callBase()
        },
        _render: function() {
            this.callBase();
            this.element().addClass(COLOR_BOX_CLASS)
        },
        _renderInput: function() {
            this.callBase();
            this._input().addClass(COLOR_BOX_INPUT_CLASS);
            this._renderColorPreview()
        },
        _renderColorPreview: function() {
            this.element().wrapInner($("<div/>").addClass(COLOR_BOX_INPUT_CONTAINER_CLASS));
            this._$colorBoxInputContainer = this.element().children().eq(0);
            this._$colorResultPreview = $("<div>", {
                "class": COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS,
                appendTo: this._$colorBoxInputContainer
            });
            if (!this.option("value")) {
                this._$colorBoxInputContainer.addClass(COLOR_BOX_COLOR_IS_NOT_DEFINED)
            } else {
                colorUtils.makeTransparentBackground(this._$colorResultPreview, this.option("value"))
            }
        },
        _renderValue: function() {
            var value = this.option("value");
            this.option("text", this.option("editAlphaChannel") ? colorUtils.makeRgba(value) : value);
            this.callBase()
        },
        _valueChangeEventHandler: function(e) {
            var value = this._input().val();
            if (value) {
                value = this._applyColorFromInput(value);
                if (this._colorView) {
                    this._colorView._setCurrentColor(value);
                    this._colorView._refreshMarkup()
                }
            }
            this.callBase(e, value)
        },
        _applyColorFromInput: function(value) {
            var newColor = new Color(value);
            if (newColor.colorIsInvalid) {
                value = this.option("value");
                this._input().val(value)
            }
            return value
        },
        _optionChanged: function(args) {
            var value = args.value,
                name = args.name;
            switch (name) {
                case "value":
                    this._$colorBoxInputContainer.toggleClass(COLOR_BOX_COLOR_IS_NOT_DEFINED, !value);
                    if (value) {
                        colorUtils.makeTransparentBackground(this._$colorResultPreview, value)
                    } else {
                        this._$colorResultPreview.removeAttr("style")
                    }
                    if (this._colorView) {
                        this._colorView.option("value", value)
                    }
                    this.callBase(args);
                    break;
                case "applyButtonText":
                case "cancelButtonText":
                    this.callBase(args);
                    this._popup && this._addPopupBottomClasses();
                    break;
                case "editAlphaChannel":
                case "onCancelButtonClick":
                case "onApplyButtonClick":
                case "keyStep":
                    if (this._colorView) {
                        this._colorView.option(name, value)
                    }
                    break;
                case "applyValueMode":
                    if (this._colorView) {
                        this._colorView.option(name, value)
                    }
                    this.callBase(args);
                    break;
                case "rtlEnabled":
                    if (this._colorView) {
                        this._colorView.option(name, value)
                    }
                    this.callBase(args);
                    break;
                default:
                    this.callBase(args)
            }
        }
    });
    registerComponent("dxColorBox", ColorBox);
    module.exports = ColorBox
});
