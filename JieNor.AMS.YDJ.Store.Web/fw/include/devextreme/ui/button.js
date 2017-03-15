/** 
 * DevExtreme (ui/button.js)
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
        iconUtils = require("../core/utils/icon"),
        devices = require("../core/devices"),
        registerComponent = require("../core/component_registrator"),
        ValidationMixin = require("./validation/validation_mixin"),
        ValidationEngine = require("./validation_engine"),
        Widget = require("./widget/ui.widget"),
        inkRipple = require("./widget/utils.ink_ripple"),
        eventUtils = require("../events/utils"),
        themes = require("./themes"),
        clickEvent = require("../events/click");
    var BUTTON_CLASS = "dx-button",
        BUTTON_CONTENT_CLASS = "dx-button-content",
        BUTTON_HAS_TEXT_CLASS = "dx-button-has-text",
        BUTTON_HAS_ICON_CLASS = "dx-button-has-icon",
        TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper",
        ANONYMOUS_TEMPLATE_NAME = "content",
        BUTTON_FEEDBACK_HIDE_TIMEOUT = 100;
    var Button = Widget.inherit({
        _supportedKeys: function() {
            var that = this,
                click = function(e) {
                    e.preventDefault();
                    that._executeClickAction(e)
                };
            return $.extend(this.callBase(), {
                space: click,
                enter: click
            })
        },
        _setDeprecatedOptions: function() {
            this.callBase();
            $.extend(this._deprecatedOptions, {
                iconSrc: {
                    since: "15.1",
                    alias: "icon"
                }
            })
        },
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                hoverStateEnabled: true,
                onClick: null,
                type: "normal",
                text: "",
                icon: "",
                validationGroup: void 0,
                activeStateEnabled: true,
                template: "content",
                useInkRipple: false
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
            }, {
                device: function() {
                    return /android5/.test(themes.current())
                },
                options: {
                    useInkRipple: true
                }
            }])
        },
        _getAnonymousTemplateName: function() {
            return ANONYMOUS_TEMPLATE_NAME
        },
        _feedbackHideTimeout: BUTTON_FEEDBACK_HIDE_TIMEOUT,
        _render: function() {
            this.element().addClass(BUTTON_CLASS);
            this._renderType();
            this.option("useInkRipple") && this._renderInkRipple();
            this._renderClick();
            this.setAria("role", "button");
            this._updateAriaLabel();
            this.callBase()
        },
        _renderInkRipple: function() {
            var isOnlyIconButton = !this.option("text") && this.option("icon") || "back" === this.option("type"),
                config = {};
            if (isOnlyIconButton) {
                $.extend(config, {
                    waveSizeCoefficient: 1,
                    useHoldAnimation: false,
                    isCentered: true
                })
            }
            this._inkRipple = inkRipple.render(config)
        },
        _toggleActiveState: function($element, value, e) {
            this.callBase.apply(this, arguments);
            if (!this._inkRipple) {
                return
            }
            var config = {
                element: this._$content,
                jQueryEvent: e
            };
            if (value) {
                this._inkRipple.showWave(config)
            } else {
                this._inkRipple.hideWave(config)
            }
        },
        _renderContentImpl: function() {
            var $element = this.element(),
                data = this._getContentData();
            if (this._$content) {
                this._$content.empty()
            } else {
                this._$content = $("<div>").addClass(BUTTON_CONTENT_CLASS).appendTo($element)
            }
            $element.toggleClass(BUTTON_HAS_ICON_CLASS, !!data.icon).toggleClass(BUTTON_HAS_TEXT_CLASS, !!data.text);
            var template = this._getTemplateByOption("template"),
                $result = template.render({
                    model: data,
                    container: this._$content
                });
            if ($result.hasClass(TEMPLATE_WRAPPER_CLASS)) {
                this._$content.replaceWith($result);
                this._$content = $result;
                this._$content.addClass(BUTTON_CONTENT_CLASS)
            }
        },
        _getContentData: function() {
            var icon = this.option("icon"),
                text = this.option("text"),
                back = "back" === this.option("type");
            if (back && !icon) {
                icon = "back"
            }
            return {
                icon: icon,
                text: text
            }
        },
        _renderClick: function() {
            var that = this,
                eventName = eventUtils.addNamespace(clickEvent.name, this.NAME);
            this._clickAction = this._createActionByOption("onClick");
            this.element().off(eventName).on(eventName, function(e) {
                that._executeClickAction(e)
            })
        },
        _executeClickAction: function(e) {
            this._clickAction({
                jQueryEvent: e,
                validationGroup: ValidationEngine.getGroupConfig(this._findGroup())
            })
        },
        _updateAriaLabel: function() {
            var icon = this.option("icon"),
                text = this.option("text");
            if ("image" === iconUtils.getImageSourceType(icon)) {
                if (icon.indexOf("base64") === -1) {
                    icon = icon.replace(/.+\/([^\.]+)\..+$/, "$1")
                } else {
                    icon = "Base64"
                }
            }
            var ariaLabel = text || icon;
            this.setAria("label", $.trim(ariaLabel))
        },
        _renderType: function() {
            var type = this.option("type");
            if (type) {
                this.element().addClass("dx-button-" + type)
            }
        },
        _refreshType: function(prevType) {
            var type = this.option("type");
            prevType && this.element().removeClass("dx-button-" + prevType).addClass("dx-button-" + type);
            if (!this.element().hasClass(BUTTON_HAS_ICON_CLASS) && "back" === type) {
                this._renderContentImpl()
            }
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "onClick":
                    this._renderClick();
                    break;
                case "icon":
                case "text":
                    this._renderContentImpl();
                    this._updateAriaLabel();
                    break;
                case "type":
                    this._refreshType(args.previousValue);
                    this._renderContentImpl();
                    this._updateAriaLabel();
                    break;
                case "template":
                    this._renderContentImpl();
                    break;
                case "useInkRipple":
                    this._invalidate();
                    break;
                default:
                    this.callBase(args)
            }
        },
        _clean: function() {
            this.callBase();
            delete this._$content
        }
    }).include(ValidationMixin);
    registerComponent("dxButton", Button);
    module.exports = Button
});
