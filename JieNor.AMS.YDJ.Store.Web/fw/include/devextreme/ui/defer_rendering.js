/** 
 * DevExtreme (ui/defer_rendering.js)
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
        commonUtils = require("../core/utils/common"),
        domUtils = require("../core/utils/dom"),
        TransitionExecutorModule = require("../animation/transition_executor/transition_executor"),
        Widget = require("./widget/ui.widget"),
        LoadIndicator = require("./load_indicator");
    var WIDGET_CLASS = "dx-widget",
        DEFER_RENDERING_CLASS = "dx-deferrendering",
        PENDING_RENDERING_CLASS = "dx-pending-rendering",
        PENDING_RENDERING_MANUAL_CLASS = "dx-pending-rendering-manual",
        PENDING_RENDERING_ACTIVE_CLASS = "dx-pending-rendering-active",
        VISIBLE_WHILE_PENDING_RENDERING_CLASS = "dx-visible-while-pending-rendering",
        INVISIBLE_WHILE_PENDING_RENDERING_CLASS = "dx-invisible-while-pending-rendering",
        LOADINDICATOR_CONTAINER_CLASS = "dx-loadindicator-container",
        DEFER_DEFER_RENDERING_LOAD_INDICATOR = "dx-deferrendering-load-indicator",
        ANONYMOUS_TEMPLATE_NAME = "content",
        ACTIONS = ["onRendered", "onShown"];
    var DeferRendering = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                showLoadIndicator: false,
                renderWhen: void 0,
                animation: void 0,
                staggerItemSelector: void 0,
                onRendered: null,
                onShown: null
            })
        },
        _getAnonymousTemplateName: function() {
            return ANONYMOUS_TEMPLATE_NAME
        },
        _init: function() {
            this.transitionExecutor = new TransitionExecutorModule.TransitionExecutor;
            this._initElement();
            this._initRender();
            this._$initialContent = this.element().clone().contents();
            this._initActions();
            this.callBase()
        },
        _initElement: function() {
            this.element().addClass(DEFER_RENDERING_CLASS).addClass(LOADINDICATOR_CONTAINER_CLASS)
        },
        _initRender: function() {
            var that = this,
                $element = this.element(),
                renderWhen = this.option("renderWhen");
            var doRender = function() {
                return that._renderDeferredContent()
            };
            if (renderWhen && renderWhen.done) {
                renderWhen.done(doRender)
            } else {
                $element.data("dx-render-delegate", doRender);
                if (void 0 === renderWhen) {
                    $element.addClass(PENDING_RENDERING_MANUAL_CLASS)
                }
            }
        },
        _initActions: function() {
            this._actions = {};
            $.each(ACTIONS, $.proxy(function(_, action) {
                this._actions[action] = this._createActionByOption(action) || $.noop
            }, this))
        },
        _renderContentImpl: function() {
            this.element().removeClass(WIDGET_CLASS);
            this.element().append(this._$initialContent);
            this._setLoadingState()
        },
        _renderDeferredContent: function() {
            var that = this,
                $element = this.element(),
                result = $.Deferred();
            $element.removeClass(PENDING_RENDERING_MANUAL_CLASS);
            $element.addClass(PENDING_RENDERING_ACTIVE_CLASS);
            this._renderTask = commonUtils.executeAsync(function() {
                that._renderImpl().done(function() {
                    var shownArgs = {
                        element: $element
                    };
                    that._actions.onShown([shownArgs]);
                    result.resolve(shownArgs)
                }).fail(function() {
                    result.rejectWith(result, arguments)
                })
            });
            return result.promise()
        },
        _isElementInViewport: function(element) {
            var rect = element.getBoundingClientRect();
            return rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth)
        },
        _animate: function() {
            var animatePromise, that = this,
                $element = this.element(),
                animation = this.option("animation"),
                staggerItemSelector = this.option("staggerItemSelector");
            that.transitionExecutor.stop();
            if (animation) {
                if (staggerItemSelector) {
                    $element.find(staggerItemSelector).each(function() {
                        if (that._isElementInViewport(this)) {
                            that.transitionExecutor.enter($(this), animation)
                        }
                    })
                } else {
                    that.transitionExecutor.enter($element, animation)
                }
                animatePromise = that.transitionExecutor.start()
            } else {
                animatePromise = $.Deferred().resolve().promise()
            }
            return animatePromise
        },
        _renderImpl: function() {
            var $element = this.element(),
                renderedArgs = {
                    element: $element
                };
            var contentTemplate = this._getTemplate(this._getAnonymousTemplateName());
            if (contentTemplate) {
                contentTemplate.render({
                    container: $element.empty(),
                    noModel: true
                })
            }
            this._setRenderedState($element);
            $element.trigger("dxcontentrendered");
            this._actions.onRendered([renderedArgs]);
            this._isRendered = true;
            return this._animate()
        },
        _setLoadingState: function() {
            var $element = this.element(),
                hasCustomLoadIndicator = !!$element.find("." + VISIBLE_WHILE_PENDING_RENDERING_CLASS).length;
            $element.addClass(PENDING_RENDERING_CLASS);
            if (!hasCustomLoadIndicator) {
                $element.children().addClass(INVISIBLE_WHILE_PENDING_RENDERING_CLASS)
            }
            if (this.option("showLoadIndicator")) {
                this._showLoadIndicator($element)
            }
        },
        _showLoadIndicator: function($container) {
            this._$loadIndicator = $("<div/>")[LoadIndicator.publicName()]({
                visible: true
            }).addClass(DEFER_DEFER_RENDERING_LOAD_INDICATOR);
            $container.append(this._$loadIndicator)
        },
        _setRenderedState: function() {
            var $element = this.element();
            if (this._$loadIndicator) {
                this._$loadIndicator.remove()
            }
            $element.removeClass(PENDING_RENDERING_CLASS);
            $element.removeClass(PENDING_RENDERING_ACTIVE_CLASS);
            domUtils.triggerShownEvent($element.children())
        },
        _optionChanged: function(args) {
            var value = args.value,
                previousValue = args.previousValue;
            switch (args.name) {
                case "renderWhen":
                    if (false === previousValue && true === value) {
                        this._renderOrAnimate()
                    } else {
                        if (true === previousValue && false === value) {
                            this._setLoadingState()
                        }
                    }
                    break;
                case "showLoadIndicator":
                case "onRendered":
                case "onShown":
                    break;
                default:
                    this.callBase(args)
            }
        },
        _renderOrAnimate: function() {
            var result;
            if (this._isRendered) {
                this._setRenderedState();
                result = this._animate()
            } else {
                result = this._renderDeferredContent()
            }
            return result
        },
        renderContent: function() {
            return this._renderOrAnimate()
        },
        _dispose: function() {
            this.transitionExecutor.stop(true);
            if (this._renderTask) {
                this._renderTask.abort()
            }
            this._actions = null;
            this._$initialContent = null;
            this.callBase()
        }
    });
    registerComponent("dxDeferRendering", DeferRendering);
    module.exports = DeferRendering
});
