/** 
 * DevExtreme (viz/core/export.js)
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
        _extend = $.extend,
        _each = $.each,
        clientExporter = require("../../client_exporter"),
        messageLocalization = require("../../localization/message"),
        config = require("../../core/config"),
        imageExporter = clientExporter.image,
        svgExporter = clientExporter.svg,
        pdfExporter = clientExporter.pdf,
        hoverEvent = require("../../events/hover"),
        pointerEvents = require("../../events/pointer"),
        pointerActions = [pointerEvents.down, pointerEvents.move].join(" "),
        BUTTON_SIZE = 35,
        ICON_COORDS = [
            [9, 12, 26, 12, 26, 14, 9, 14],
            [9, 17, 26, 17, 26, 19, 9, 19],
            [9, 22, 26, 22, 26, 24, 9, 24]
        ],
        LIST_PADDING_TOP = 4,
        LIST_WIDTH = 120,
        VERTICAL_TEXT_MARGIN = 8,
        HORIZONTAL_TEXT_MARGIN = 15,
        MENU_ITEM_HEIGHT = 30,
        LIST_STROKE_WIDTH = 1,
        MARGIN = 10,
        SHADOW_OFFSET = 2,
        SHADOW_BLUR = 3,
        ALLOWED_EXPORT_FORMATS = ["PNG", "PDF", "JPEG", "SVG", "GIF"],
        EXPORT_CSS_CLASS = "dx-export-menu",
        EXPORT_DATA_KEY = "export-element-type",
        FORMAT_DATA_KEY = "export-element-format";

    function validateFormat(format) {
        var validatedFormat = String(format).toUpperCase();
        if ($.inArray(validatedFormat, ALLOWED_EXPORT_FORMATS) !== -1) {
            return validatedFormat
        }
    }

    function getCreatorFunc(format) {
        if ("SVG" === format) {
            return svgExporter.getData
        } else {
            if ("PDF" === format) {
                return pdfExporter.getData
            } else {
                return imageExporter.getData
            }
        }
    }

    function print(data) {
        var vizWindow = window.open();
        if (!vizWindow) {
            return
        }
        vizWindow.document.open();
        vizWindow.document.write(data);
        vizWindow.document.close();
        vizWindow.print();
        vizWindow.close()
    }
    exports.exportFromMarkup = function(markup, options) {
        options.format = validateFormat(options.format) || "PNG";
        options.fileName = options.fileName || "file";
        clientExporter.export(markup, options, getCreatorFunc(options.format))
    };
    exports.ExportMenu = function(params) {
        var that = this,
            renderer = that._renderer = params.renderer;
        that._incidentOccurred = params.incidentOccurred;
        that._svgMethod = params.svgMethod;
        that._shadow = renderer.shadowFilter("-50%", "-50%", "200%", "200%", SHADOW_OFFSET, 6, SHADOW_BLUR);
        that._shadow.attr({
            opacity: .8
        });
        that._group = renderer.g().attr({
            "class": EXPORT_CSS_CLASS
        }).linkOn(renderer.root, {
            name: "export-menu",
            after: "peripheral"
        });
        that._buttonGroup = renderer.g().attr({
            "class": EXPORT_CSS_CLASS + "-button"
        }).append(that._group);
        that._listGroup = renderer.g().attr({
            "class": EXPORT_CSS_CLASS + "-list"
        }).append(that._group);
        that._subscribeEvents()
    };
    _extend(exports.ExportMenu.prototype, {
        getLayoutOptions: function() {
            if (this._hiddenDueToLayout) {
                return {
                    width: 0,
                    height: 0
                }
            }
            var bbox = this._buttonGroup.getBBox();
            bbox.cutSide = "vertical";
            bbox.cutLayoutSide = "top";
            bbox.height += MARGIN;
            bbox.position = {
                vertical: "top",
                horizontal: "right"
            };
            bbox.verticalAlignment = "top";
            bbox.horizontalAlignment = "right";
            return bbox
        },
        probeDraw: function() {
            this._hiddenDueToLayout = false;
            this.show()
        },
        shift: function(_, y) {
            this._group.attr({
                translateY: this._group.attr("translateY") + y
            })
        },
        draw: function(width, height, canvas) {
            var layoutOptions;
            this._options.exportOptions.width = canvas.width;
            this._options.exportOptions.height = canvas.height;
            this._group.move(width - BUTTON_SIZE - SHADOW_OFFSET - SHADOW_BLUR, Math.floor(height / 2 - BUTTON_SIZE / 2));
            layoutOptions = this.getLayoutOptions();
            if (layoutOptions.width > width || layoutOptions.height > height) {
                this._incidentOccurred("W2107");
                this._hiddenDueToLayout = true;
                this.hide()
            }
            return this
        },
        show: function() {
            !this._hiddenDueToLayout && this._group.linkAppend()
        },
        hide: function() {
            this._group.linkRemove()
        },
        setOptions: function(options) {
            this._options = options;
            options.formats = options.formats || ALLOWED_EXPORT_FORMATS;
            options.printingEnabled = void 0 === options.printingEnabled ? true : options.printingEnabled;
            if (options.enabled && (options.formats.length || options.printingEnabled)) {
                this.show();
                this._updateButton();
                this._updateList();
                this._hideList()
            } else {
                this.hide()
            }
        },
        dispose: function() {
            var that = this;
            that._unsubscribeEvents();
            that._group.linkRemove().linkOff();
            that._group.dispose();
            that._shadow.dispose();
            that._shadow = that._group = that._listGroup = that._buttonGroup = that._button = null;
            that._options = null
        },
        layoutOptions: function() {
            var options = this._options;
            return options.enabled && {
                horizontalAlignment: "right",
                verticalAlignment: "top",
                weak: true
            }
        },
        measure: function() {
            return [BUTTON_SIZE + SHADOW_OFFSET, BUTTON_SIZE]
        },
        move: function(rect) {
            this._group.attr({
                translateX: Math.round(rect[0]),
                translateY: Math.round(rect[1])
            })
        },
        _hideList: function() {
            this._listGroup.remove();
            this._listShown = false;
            this._setButtonState("default")
        },
        _showList: function() {
            this._listGroup.append(this._group);
            this._listShown = true
        },
        _setButtonState: function(state) {
            var that = this,
                style = that._options.button[state];
            this._button.attr({
                stroke: style.borderColor,
                fill: style.backgroundColor
            });
            this._icon.attr({
                fill: style.color
            })
        },
        _subscribeEvents: function() {
            var that = this;
            that._renderer.root.on(pointerEvents.up + ".export", function(e) {
                var exportOptions, elementType = e.target[EXPORT_DATA_KEY],
                    options = that._options;
                if (!elementType) {
                    if (that._button) {
                        that._hideList()
                    }
                    return
                }
                if ("button" === elementType) {
                    if (that._listShown) {
                        that._setButtonState("default");
                        that._hideList()
                    } else {
                        that._setButtonState("focus");
                        that._showList()
                    }
                } else {
                    if ("printing" === elementType) {
                        that.hide();
                        print(that._svgMethod());
                        that.show();
                        that._hideList()
                    } else {
                        if ("exporting" === elementType) {
                            that.hide();
                            exportOptions = _extend({}, options.exportOptions, {
                                format: e.target[FORMAT_DATA_KEY],
                                backgroundColor: options.backgroundColor
                            });
                            clientExporter.export(that._svgMethod(), exportOptions, getCreatorFunc(exportOptions.format));
                            that.show();
                            that._hideList()
                        }
                    }
                }
            });
            that._listGroup.on(pointerActions, function(e) {
                e.stopPropagation()
            });
            that._buttonGroup.on(pointerEvents.enter, function() {
                that._setButtonState("hover")
            });
            that._buttonGroup.on(pointerEvents.leave, function() {
                that._setButtonState(that._listShown ? "focus" : "default")
            });
            that._buttonGroup.on(pointerEvents.down + ".export", function(e) {
                that._setButtonState("active")
            })
        },
        _unsubscribeEvents: function() {
            this._renderer.root.off(".export");
            this._listGroup.off();
            this._buttonGroup.off()
        },
        _updateButton: function() {
            var that = this,
                renderer = that._renderer,
                options = that._options,
                iconAttr = {
                    fill: options.button.default.color,
                    cursor: "pointer"
                },
                exportData = {
                    "export-element-type": "button"
                };
            if (!that._button) {
                that._button = renderer.rect(0, 0, BUTTON_SIZE, BUTTON_SIZE).append(that._buttonGroup);
                that._button.attr({
                    rx: 4,
                    ry: 4,
                    fill: options.button.default.backgroundColor,
                    stroke: options.button.default.borderColor,
                    "stroke-width": 1,
                    cursor: "pointer"
                });
                that._button.data(exportData);
                that._icon = renderer.path(ICON_COORDS).append(that._buttonGroup);
                that._icon.attr(iconAttr);
                that._icon.data(exportData);
                that._buttonGroup.setTitle(messageLocalization.format("vizExport-titleMenuText"))
            }
        },
        _getItemStyle: function(options) {
            var font = options.font,
                style = {
                    rect: {
                        cursor: "pointer",
                        "pointer-events": "all"
                    },
                    text: {
                        "pointer-events": "none"
                    }
                };
            style.text["font-size"] = font.size;
            style.text["font-family"] = font.family;
            style.text.fill = font.color;
            style.text["font-weight"] = font.weight;
            return style
        },
        _getItemAttributes: function(options, items) {
            var path, attr = {},
                x = BUTTON_SIZE - LIST_WIDTH,
                y = BUTTON_SIZE + LIST_PADDING_TOP + (items.length + 1) * MENU_ITEM_HEIGHT;
            attr.rect = {
                width: LIST_WIDTH - 2 * LIST_STROKE_WIDTH,
                height: MENU_ITEM_HEIGHT,
                x: x + LIST_STROKE_WIDTH,
                y: y - MENU_ITEM_HEIGHT
            };
            attr.text = config().rtlEnabled ? {
                x: x + LIST_WIDTH - 2 * LIST_STROKE_WIDTH - HORIZONTAL_TEXT_MARGIN
            } : {
                x: x + HORIZONTAL_TEXT_MARGIN
            };
            attr.text.y = y - VERTICAL_TEXT_MARGIN;
            if ("printing" === options.type) {
                path = "M " + x + " " + (y - LIST_STROKE_WIDTH) + " L " + (x + LIST_WIDTH) + " " + (y - LIST_STROKE_WIDTH);
                attr.separator = {
                    stroke: options.stroke,
                    "stroke-width": LIST_STROKE_WIDTH,
                    cursor: "pointer",
                    sharp: "v",
                    d: path
                }
            }
            return attr
        },
        _addMenuItem: function(renderer, options, items) {
            var menuItem, that = this,
                itemData = {},
                hoverFill = options.hoverFill,
                fill = options.fill,
                type = options.type,
                format = options.format,
                style = that._getItemStyle(options),
                attr = that._getItemAttributes(options, items);
            menuItem = renderer.g().attr({
                "class": EXPORT_CSS_CLASS + "-list-item"
            });
            itemData[EXPORT_DATA_KEY] = type;
            if (format) {
                itemData[FORMAT_DATA_KEY] = format
            }
            var rect = renderer.rect(),
                text = renderer.text(options.text);
            rect.attr(attr.rect).css(style.rect).data(itemData);
            rect.on(hoverEvent.start + ".export", function(e) {
                rect.attr({
                    fill: hoverFill
                })
            }).on(hoverEvent.end + ".export", function(e) {
                rect.attr({
                    fill: fill
                })
            });
            rect.append(menuItem);
            text.css(style.text).attr(attr.text).append(menuItem);
            if ("printing" === type) {
                renderer.path(null, "line").attr(attr.separator).append(menuItem)
            }
            items.push({
                g: menuItem,
                rect: rect
            })
        },
        _getMenuItems: function(options) {
            var that = this,
                buttonDefault = options.button.default,
                buttonHover = options.button.hover,
                formats = options.formats,
                renderer = that._renderer,
                items = [];
            if (options.printingEnabled) {
                that._addMenuItem(renderer, {
                    font: options.font,
                    type: "printing",
                    fill: buttonDefault.backgroundColor,
                    stroke: buttonDefault.borderColor,
                    hoverFill: buttonHover.backgroundColor,
                    text: messageLocalization.format("vizExport-printingButtonText")
                }, items)
            }
            _each(formats, function(_, format) {
                format = validateFormat(format);
                if (format) {
                    that._addMenuItem(renderer, {
                        font: options.font,
                        fill: buttonDefault.backgroundColor,
                        stroke: buttonDefault.borderColor,
                        hoverFill: buttonHover.backgroundColor,
                        type: "exporting",
                        text: messageLocalization.getFormatter("vizExport-exportButtonText")(format),
                        format: format
                    }, items)
                }
            });
            items && that._setCornerRadius(items);
            return items
        },
        _getMenuOverlay: function(options, items) {
            var rect, listHeight, that = this,
                listPadding = BUTTON_SIZE + LIST_PADDING_TOP,
                renderer = that._renderer,
                xCoord = -LIST_WIDTH + BUTTON_SIZE;
            listHeight = items.length * MENU_ITEM_HEIGHT;
            rect = renderer.rect(xCoord, listPadding, LIST_WIDTH, listHeight);
            that._shadow.attr({
                color: options.shadowColor
            });
            rect.attr({
                fill: options.button.default.backgroundColor,
                stroke: options.button.default.borderColor,
                "stroke-width": LIST_STROKE_WIDTH,
                cursor: "pointer",
                rx: 4,
                ry: 4,
                filter: that._shadow.ref
            });
            rect.data({
                "export-element-type": "list"
            });
            return rect
        },
        _setCornerRadius: function(items) {
            var firstRect = items[0].rect,
                lastRect = items[items.length - 1].rect;
            firstRect.attr({
                y: parseInt(firstRect.attr("y")) + 2 * LIST_STROKE_WIDTH,
                height: parseInt(firstRect.attr("height")) - 2 * LIST_STROKE_WIDTH
            });
            lastRect.attr({
                height: parseInt(lastRect.attr("height")) - 2 * LIST_STROKE_WIDTH
            })
        },
        _updateList: function() {
            var that = this,
                options = that._options,
                listGroup = that._listGroup,
                items = that._getMenuItems(options),
                menuOverlay = that._getMenuOverlay(options, items);
            listGroup.clear();
            menuOverlay.append(listGroup);
            _each(items, function(_, item) {
                item.g.append(listGroup)
            })
        }
    });

    function getExportOptions(widget, fileName, format, backgroundColor) {
        var validatedFormat = String(format).toUpperCase();
        if ($.inArray(validatedFormat, ["PNG", "PDF", "JPEG", "SVG", "GIF"]) === -1) {
            validatedFormat = "PNG"
        }
        return {
            format: validatedFormat,
            fileName: fileName || "file",
            proxyUrl: widget.option("export.proxyUrl"),
            width: widget._canvas.width,
            height: widget._canvas.height,
            exportingAction: widget._createActionByOption("onExporting"),
            exportedAction: widget._createActionByOption("onExported"),
            fileSavingAction: widget._createActionByOption("onFileSaving")
        }
    }
    exports.plugin = {
        name: "export",
        init: function() {
            var that = this;
            that._exportMenu = new exports.ExportMenu({
                renderer: that._renderer,
                svgMethod: function() {
                    return that.svg()
                },
                incidentOccurred: that._incidentOccurred
            });
            that._layout.add(that._exportMenu)
        },
        dispose: function() {
            this._exportMenu.dispose();
            this._exportMenu = null
        },
        members: {
            _getExportMenuOptions: function() {
                var that = this,
                    userOptions = that._getOption("export") || {},
                    options = getExportOptions(that, userOptions.fileName, userOptions.format, userOptions.color);
                return $.extend({}, userOptions, {
                    exportOptions: options
                })
            },
            exportTo: function(fileName, format) {
                var exportOptions = getExportOptions(this, fileName, format),
                    exportMenu = this._exportMenu;
                exportMenu && exportMenu.hide();
                clientExporter.export(this.svg(), exportOptions, getCreatorFunc(exportOptions.format));
                exportMenu && exportMenu.show()
            },
            print: function() {
                var vizWindow = window.open();
                if (!vizWindow) {
                    return
                }
                vizWindow.document.open();
                vizWindow.document.write(this.svg());
                vizWindow.document.close();
                vizWindow.print();
                vizWindow.close()
            }
        },
        customize: function(constructor) {
            var proto = constructor.prototype;
            constructor.addChange({
                code: "EXPORT",
                handler: function() {
                    this._exportMenu.setOptions(this._getExportMenuOptions());
                    this._change(["LAYOUT"])
                },
                isThemeDependent: true,
                isOptionChange: true,
                option: "export"
            });
            proto._optionChangesMap.onExporting = "EXPORT";
            proto._optionChangesMap.onExported = "EXPORT";
            proto._optionChangesMap.onFileSaving = "EXPORT"
        }
    }
});
