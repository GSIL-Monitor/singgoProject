/** 
 * DevExtreme (animation/fx.js)
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
        errors = require("../core/errors"),
        translator = require("./translator"),
        animationFrame = require("./frame"),
        support = require("../core/utils/support"),
        positionUtils = require("./position"),
        removeEvent = require("../core/remove_event"),
        eventUtils = require("../events/utils"),
        transitionEndEventName = support.transitionEndEventName + ".dxFX",
        removeEventName = eventUtils.addNamespace(removeEvent, "dxFX");
    var CSS_TRANSITION_EASING_REGEX = /cubic-bezier\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)/,
        RELATIVE_VALUE_REGEX = /^([+-])=(.*)/i,
        ANIM_DATA_KEY = "dxAnimData",
        ANIM_QUEUE_KEY = "dxAnimQueue",
        TRANSFORM_PROP = "transform";
    var TransitionAnimationStrategy = {
        initAnimation: function($element, config) {
            $element.css({
                transitionProperty: "none"
            });
            if ("string" === typeof config.from) {
                $element.addClass(config.from)
            } else {
                setProps($element, config.from)
            }
            var that = this,
                deferred = $.Deferred(),
                cleanupWhen = config.cleanupWhen;
            config.transitionAnimation = {
                deferred: deferred,
                finish: function() {
                    that._finishTransition($element, config);
                    if (cleanupWhen) {
                        $.when(deferred, cleanupWhen).always(function() {
                            that._cleanup($element, config)
                        })
                    } else {
                        that._cleanup($element, config)
                    }
                    deferred.resolveWith($element, [config, $element])
                }
            };
            this._completeAnimationCallback($element, config).done(function() {
                config.transitionAnimation.finish()
            }).fail(function() {
                deferred.rejectWith($element, [config, $element])
            });
            if (!config.duration) {
                config.transitionAnimation.finish()
            }
            $element.css("transform")
        },
        animate: function($element, config) {
            this._startAnimation($element, config);
            return config.transitionAnimation.deferred.promise()
        },
        _completeAnimationCallback: function($element, config) {
            var simulatedEndEventTimer, waitForJSCompleteTimer, that = this,
                startTime = $.now() + config.delay,
                deferred = $.Deferred(),
                transitionEndFired = $.Deferred(),
                simulatedTransitionEndFired = $.Deferred();
            config.transitionAnimation.cleanup = function() {
                clearTimeout(simulatedEndEventTimer);
                clearTimeout(waitForJSCompleteTimer);
                $element.off(transitionEndEventName);
                $element.off(removeEventName)
            };
            $element.one(transitionEndEventName, function() {
                if ($.now() - startTime >= config.duration) {
                    transitionEndFired.reject()
                }
            }).off(removeEventName).on(removeEventName, function() {
                that.stop($element, config);
                deferred.reject()
            });
            waitForJSCompleteTimer = setTimeout(function() {
                simulatedEndEventTimer = setTimeout(function() {
                    simulatedTransitionEndFired.reject()
                }, config.duration + config.delay + fx._simulatedTransitionEndDelay);
                $.when(transitionEndFired, simulatedTransitionEndFired).fail($.proxy(function() {
                    deferred.resolve()
                }, this))
            });
            return deferred.promise()
        },
        _startAnimation: function($element, config) {
            $element.css({
                transitionProperty: "all",
                transitionDelay: config.delay + "ms",
                transitionDuration: config.duration + "ms",
                transitionTimingFunction: config.easing
            });
            if ("string" === typeof config.to) {
                $element[0].className += " " + config.to
            } else {
                if (config.to) {
                    setProps($element, config.to)
                }
            }
        },
        _finishTransition: function($element, config) {
            $element.css("transition", "none")
        },
        _cleanup: function($element, config) {
            config.transitionAnimation.cleanup();
            if ("string" === typeof config.from) {
                $element.removeClass(config.from);
                $element.removeClass(config.to)
            }
        },
        stop: function($element, config, jumpToEnd) {
            if (!config) {
                return
            }
            if (jumpToEnd) {
                config.transitionAnimation.finish()
            } else {
                if ($.isPlainObject(config.to)) {
                    $.each(config.to, function(key) {
                        $element.css(key, $element.css(key))
                    })
                }
                this._finishTransition($element, config);
                this._cleanup($element, config)
            }
        }
    };
    var FrameAnimationStrategy = {
        initAnimation: function($element, config) {
            setProps($element, config.from)
        },
        animate: function($element, config) {
            var deferred = $.Deferred(),
                that = this;
            if (!config) {
                return deferred.reject().promise()
            }
            $.each(config.to, function(prop) {
                if (void 0 === config.from[prop]) {
                    config.from[prop] = that._normalizeValue($element.css(prop))
                }
            });
            if (config.to[TRANSFORM_PROP]) {
                config.from[TRANSFORM_PROP] = that._parseTransform(config.from[TRANSFORM_PROP]);
                config.to[TRANSFORM_PROP] = that._parseTransform(config.to[TRANSFORM_PROP])
            }
            config.frameAnimation = {
                to: config.to,
                from: config.from,
                currentValue: config.from,
                easing: convertTransitionTimingFuncToJQueryEasing(config.easing),
                duration: config.duration,
                startTime: (new Date).valueOf(),
                finish: function() {
                    this.currentValue = this.to;
                    this.draw();
                    animationFrame.cancelAnimationFrame(config.frameAnimation.animationFrameId);
                    deferred.resolve()
                },
                draw: function() {
                    if (config.draw) {
                        config.draw(this.currentValue);
                        return
                    }
                    var currentValue = $.extend({}, this.currentValue);
                    if (currentValue[TRANSFORM_PROP]) {
                        currentValue[TRANSFORM_PROP] = $.map(currentValue[TRANSFORM_PROP], function(value, prop) {
                            if ("translate" === prop) {
                                return translator.getTranslateCss(value)
                            } else {
                                if ("scale" === prop) {
                                    return "scale(" + value + ")"
                                } else {
                                    if ("rotate" === prop.substr(0, prop.length - 1)) {
                                        return prop + "(" + value + "deg)"
                                    }
                                }
                            }
                        }).join(" ")
                    }
                    $element.css(currentValue)
                }
            };
            if (config.delay) {
                config.frameAnimation.startTime += config.delay;
                config.frameAnimation.delayTimeout = setTimeout(function() {
                    that._startAnimation($element, config)
                }, config.delay)
            } else {
                that._startAnimation($element, config)
            }
            return deferred.promise()
        },
        _startAnimation: function($element, config) {
            $element.off(removeEventName).on(removeEventName, function() {
                if (config.frameAnimation) {
                    animationFrame.cancelAnimationFrame(config.frameAnimation.animationFrameId)
                }
            });
            this._animationStep($element, config)
        },
        _parseTransform: function(transformString) {
            var result = {};
            $.each(transformString.match(/(\w|\d)+\([^\)]*\)\s*/g), function(i, part) {
                var translateData = translator.parseTranslate(part),
                    scaleData = part.match(/scale\((.+?)\)/),
                    rotateData = part.match(/(rotate.)\((.+)deg\)/);
                if (translateData) {
                    result.translate = translateData
                }
                if (scaleData && scaleData[1]) {
                    result.scale = parseFloat(scaleData[1])
                }
                if (rotateData && rotateData[1]) {
                    result[rotateData[1]] = parseFloat(rotateData[2])
                }
            });
            return result
        },
        stop: function($element, config, jumpToEnd) {
            var frameAnimation = config && config.frameAnimation;
            if (!frameAnimation) {
                return
            }
            animationFrame.cancelAnimationFrame(frameAnimation.animationFrameId);
            clearTimeout(frameAnimation.delayTimeout);
            if (jumpToEnd) {
                frameAnimation.finish()
            }
            delete config.frameAnimation
        },
        _animationStep: function($element, config) {
            var frameAnimation = config && config.frameAnimation;
            if (!frameAnimation) {
                return
            }
            var now = (new Date).valueOf();
            if (now >= frameAnimation.startTime + frameAnimation.duration) {
                frameAnimation.finish();
                return
            }
            frameAnimation.currentValue = this._calcStepValue(frameAnimation, now - frameAnimation.startTime);
            frameAnimation.draw();
            var that = this;
            frameAnimation.animationFrameId = animationFrame.requestAnimationFrame(function() {
                that._animationStep($element, config)
            })
        },
        _calcStepValue: function(frameAnimation, currentDuration) {
            var calcValueRecursively = function(from, to) {
                var result = $.isArray(to) ? [] : {};
                var calcEasedValue = function(propName) {
                    var x = currentDuration / frameAnimation.duration,
                        t = currentDuration,
                        b = 1 * from[propName],
                        c = to[propName] - from[propName],
                        d = frameAnimation.duration;
                    return $.easing[frameAnimation.easing](x, t, b, c, d)
                };
                $.each(to, function(propName, endPropValue) {
                    if ("string" === typeof endPropValue && false === parseFloat(endPropValue, 10)) {
                        return true
                    }
                    result[propName] = "object" === typeof endPropValue ? calcValueRecursively(from[propName], endPropValue) : calcEasedValue(propName)
                });
                return result
            };
            return calcValueRecursively(frameAnimation.from, frameAnimation.to)
        },
        _normalizeValue: function(value) {
            var numericValue = parseFloat(value, 10);
            if (false === numericValue) {
                return value
            }
            return numericValue
        }
    };
    var FallbackToNoAnimationStrategy = {
        initAnimation: function($element, config) {},
        animate: function($element, config) {
            return $.Deferred().resolve().promise()
        },
        stop: $.noop,
        isSynchronous: true
    };
    var animationStrategies = {
        transition: support.transition ? TransitionAnimationStrategy : FrameAnimationStrategy,
        frame: FrameAnimationStrategy,
        noAnimation: FallbackToNoAnimationStrategy
    };
    var getAnimationStrategy = function(config) {
        config = config || {};
        var strategy = config.strategy || "transition";
        if ("css" === config.type && !support.transition) {
            strategy = "noAnimation"
        }
        return animationStrategies[strategy]
    };
    var TransitionTimingFuncMap = {
        linear: "cubic-bezier(0, 0, 1, 1)",
        ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
        "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)"
    };
    var convertTransitionTimingFuncToJQueryEasing = function(cssTransitionEasing) {
        cssTransitionEasing = TransitionTimingFuncMap[cssTransitionEasing] || cssTransitionEasing;
        var bezCoeffs = cssTransitionEasing.match(CSS_TRANSITION_EASING_REGEX);
        if (!bezCoeffs) {
            return "linear"
        }
        bezCoeffs = bezCoeffs.slice(1, 5);
        $.each(bezCoeffs, function(index, value) {
            bezCoeffs[index] = parseFloat(value)
        });
        var easingName = "cubicbezier_" + bezCoeffs.join("_").replace(/\./g, "p");
        if (!$.isFunction($.easing[easingName])) {
            var polynomBezier = function(x1, y1, x2, y2) {
                var Cx = 3 * x1,
                    Bx = 3 * (x2 - x1) - Cx,
                    Ax = 1 - Cx - Bx,
                    Cy = 3 * y1,
                    By = 3 * (y2 - y1) - Cy,
                    Ay = 1 - Cy - By;
                var bezierX = function(t) {
                    return t * (Cx + t * (Bx + t * Ax))
                };
                var bezierY = function(t) {
                    return t * (Cy + t * (By + t * Ay))
                };
                var findXfor = function(t) {
                    var z, x = t,
                        i = 0;
                    while (i < 14) {
                        z = bezierX(x) - t;
                        if (Math.abs(z) < .001) {
                            break
                        }
                        x -= z / derivativeX(x);
                        i++
                    }
                    return x
                };
                var derivativeX = function(t) {
                    return Cx + t * (2 * Bx + 3 * t * Ax)
                };
                return function(t) {
                    return bezierY(findXfor(t))
                }
            };
            $.easing[easingName] = function(x, t, b, c, d) {
                return c * polynomBezier(bezCoeffs[0], bezCoeffs[1], bezCoeffs[2], bezCoeffs[3])(t / d) + b
            }
        }
        return easingName
    };
    var baseConfigValidator = function(config, animationType, validate, typeMessage) {
        $.each(["from", "to"], function() {
            if (!validate(config[this])) {
                throw errors.Error("E0010", animationType, this, typeMessage)
            }
        })
    };
    var isObjectConfigValidator = function(config, animationType) {
        return baseConfigValidator(config, animationType, function(target) {
            return $.isPlainObject(target)
        }, "a plain object")
    };
    var isStringConfigValidator = function(config, animationType) {
        return baseConfigValidator(config, animationType, function(target) {
            return "string" === typeof target
        }, "a string")
    };
    var CustomAnimationConfigurator = {
        setup: function($element, config) {}
    };
    var CssAnimationConfigurator = {
        validateConfig: function(config) {
            isStringConfigValidator(config, "css")
        },
        setup: function($element, config) {}
    };
    var positionAliases = {
        top: {
            my: "bottom center",
            at: "top center"
        },
        bottom: {
            my: "top center",
            at: "bottom center"
        },
        right: {
            my: "left center",
            at: "right center"
        },
        left: {
            my: "right center",
            at: "left center"
        }
    };
    var SlideAnimationConfigurator = {
        validateConfig: function(config) {
            isObjectConfigValidator(config, "slide")
        },
        setup: function($element, config) {
            var location = translator.locate($element);
            if ("slide" !== config.type) {
                var positioningConfig = "slideIn" === config.type ? config.from : config.to;
                positioningConfig.position = $.extend({
                    of: window
                }, positionAliases[config.direction]);
                setupPosition($element, positioningConfig)
            }
            this._setUpConfig(location, config.from);
            this._setUpConfig(location, config.to);
            translator.clearCache($element);
            if (!support.transform && "static" === $element.css("position")) {
                $element.css("position", "relative")
            }
        },
        _setUpConfig: function(location, config) {
            config.left = "left" in config ? config.left : "+=0";
            config.top = "top" in config ? config.top : "+=0";
            this._initNewPosition(location, config)
        },
        _initNewPosition: function(location, config) {
            var position = {
                left: config.left,
                top: config.top
            };
            delete config.left;
            delete config.top;
            var relativeValue = this._getRelativeValue(position.left);
            if (void 0 !== relativeValue) {
                position.left = relativeValue + location.left
            } else {
                config.left = 0
            }
            relativeValue = this._getRelativeValue(position.top);
            if (void 0 !== relativeValue) {
                position.top = relativeValue + location.top
            } else {
                config.top = 0
            }
            var translate = {
                x: 0,
                y: 0
            };
            if (support.transform) {
                translate = {
                    x: position.left,
                    y: position.top
                }
            } else {
                config.left = position.left;
                config.top = position.top
            }
            config[TRANSFORM_PROP] = translator.getTranslateCss(translate)
        },
        _getRelativeValue: function(value) {
            var relativeValue;
            if ("string" === typeof value && (relativeValue = RELATIVE_VALUE_REGEX.exec(value))) {
                return parseInt(relativeValue[1] + "1") * relativeValue[2]
            }
        }
    };
    var FadeAnimationConfigurator = {
        setup: function($element, config) {
            var toOpacity, from = config.from,
                fromOpacity = $.isPlainObject(from) ? config.skipElementInitialStyles ? 0 : $element.css("opacity") : String(from);
            switch (config.type) {
                case "fadeIn":
                    toOpacity = 1;
                    break;
                case "fadeOut":
                    toOpacity = 0;
                    break;
                default:
                    toOpacity = String(config.to)
            }
            config.from = {
                visibility: "visible",
                opacity: fromOpacity
            };
            config.to = {
                opacity: toOpacity
            }
        }
    };
    var PopAnimationConfigurator = {
        validateConfig: function(config) {
            isObjectConfigValidator(config, "pop")
        },
        setup: function($element, config) {
            var from = config.from,
                to = config.to,
                fromOpacity = "opacity" in from ? from.opacity : $element.css("opacity"),
                toOpacity = "opacity" in to ? to.opacity : 1,
                fromScale = "scale" in from ? from.scale : 0,
                toScale = "scale" in to ? to.scale : 1;
            config.from = {
                opacity: fromOpacity
            };
            var translate = translator.getTranslate($element);
            config.from[TRANSFORM_PROP] = this._getCssTransform(translate, fromScale);
            config.to = {
                opacity: toOpacity
            };
            config.to[TRANSFORM_PROP] = this._getCssTransform(translate, toScale)
        },
        _getCssTransform: function(translate, scale) {
            return translator.getTranslateCss(translate) + "scale(" + scale + ")"
        }
    };
    var animationConfigurators = {
        custom: CustomAnimationConfigurator,
        slide: SlideAnimationConfigurator,
        slideIn: SlideAnimationConfigurator,
        slideOut: SlideAnimationConfigurator,
        fade: FadeAnimationConfigurator,
        fadeIn: FadeAnimationConfigurator,
        fadeOut: FadeAnimationConfigurator,
        pop: PopAnimationConfigurator,
        css: CssAnimationConfigurator
    };
    var getAnimationConfigurator = function(config) {
        var result = animationConfigurators[config.type];
        if (!result) {
            throw errors.Error("E0011", config.type)
        }
        return result
    };
    var defaultJSConfig = {
            type: "custom",
            from: {},
            to: {},
            duration: 400,
            start: $.noop,
            complete: $.noop,
            easing: "ease",
            delay: 0
        },
        defaultCssConfig = {
            duration: 400,
            easing: "ease",
            delay: 0
        };
    var setupAnimationOnElement = function() {
        var animation = this,
            $element = animation.element,
            config = animation.config;
        setupPosition($element, config.from);
        setupPosition($element, config.to);
        animation.configurator.setup($element, config);
        $element.data(ANIM_DATA_KEY, animation);
        if (fx.off) {
            config.duration = 0;
            config.delay = 0
        }
        animation.strategy.initAnimation($element, config);
        if (config.start) {
            config.start.apply(this, [$element, config])
        }
    };
    var onElementAnimationComplete = function(animation) {
        var $element = animation.element,
            config = animation.config;
        $element.removeData(ANIM_DATA_KEY);
        if (config.complete) {
            config.complete.apply(this, [$element, config])
        }
        animation.deferred.resolveWith(this, [$element, config])
    };
    var startAnimationOnElement = function() {
        var animation = this,
            $element = animation.element,
            config = animation.config;
        animation.isStarted = true;
        return animation.strategy.animate($element, config).done(function() {
            onElementAnimationComplete(animation)
        }).fail(function() {
            animation.deferred.rejectWith(this, [$element, config])
        })
    };
    var stopAnimationOnElement = function(jumpToEnd) {
        var animation = this,
            $element = animation.element,
            config = animation.config;
        clearTimeout(animation.startTimeout);
        if (!animation.isStarted) {
            animation.start()
        }
        animation.strategy.stop($element, config, jumpToEnd)
    };
    var scopedRemoveEvent = eventUtils.addNamespace(removeEvent, "dxFXStartAnimation");
    var subscribeToRemoveEvent = function(animation) {
        animation.element.off(scopedRemoveEvent).on(scopedRemoveEvent, function() {
            fx.stop(animation.element)
        });
        animation.deferred.always(function() {
            animation.element.off(scopedRemoveEvent)
        })
    };
    var createAnimation = function(element, initialConfig) {
        var defaultConfig = "css" === initialConfig.type ? defaultCssConfig : defaultJSConfig,
            config = $.extend(true, {}, defaultConfig, initialConfig),
            configurator = getAnimationConfigurator(config),
            strategy = getAnimationStrategy(config),
            animation = {
                element: $(element),
                config: config,
                configurator: configurator,
                strategy: strategy,
                isSynchronous: strategy.isSynchronous,
                setup: setupAnimationOnElement,
                start: startAnimationOnElement,
                stop: stopAnimationOnElement,
                deferred: $.Deferred()
            };
        if ($.isFunction(configurator.validateConfig)) {
            configurator.validateConfig(config)
        }
        subscribeToRemoveEvent(animation);
        return animation
    };
    var animate = function(element, config) {
        var $element = $(element);
        if (!$element.length) {
            return $.Deferred().resolve().promise()
        }
        var animation = createAnimation($element, config);
        pushInAnimationQueue($element, animation);
        return animation.deferred.promise()
    };
    var pushInAnimationQueue = function($element, animation) {
        var queueData = getAnimQueueData($element);
        writeAnimQueueData($element, queueData);
        queueData.push(animation);
        if (!isAnimating($element)) {
            shiftFromAnimationQueue($element, queueData)
        }
    };
    var getAnimQueueData = function($element) {
        return $element.data(ANIM_QUEUE_KEY) || []
    };
    var writeAnimQueueData = function($element, queueData) {
        $element.data(ANIM_QUEUE_KEY, queueData)
    };
    var destroyAnimQueueData = function($element) {
        $element.removeData(ANIM_QUEUE_KEY)
    };
    var isAnimating = function($element) {
        return !!$element.data(ANIM_DATA_KEY)
    };
    var shiftFromAnimationQueue = function($element, queueData) {
        queueData = getAnimQueueData($element);
        if (!queueData.length) {
            return
        }
        var animation = queueData.shift();
        if (0 === queueData.length) {
            destroyAnimQueueData($element)
        }
        executeAnimation(animation).done(function() {
            if (!isAnimating($element)) {
                shiftFromAnimationQueue($element)
            }
        })
    };
    var executeAnimation = function(animation) {
        animation.setup();
        if (fx.off || animation.isSynchronous) {
            animation.start()
        } else {
            animation.startTimeout = setTimeout(function() {
                animation.start()
            })
        }
        return animation.deferred.promise()
    };
    var setupPosition = function($element, config) {
        if (!config || !config.position) {
            return
        }
        var position = positionUtils.calculate($element, config.position),
            offset = $element.offset(),
            currentPosition = $element.position();
        $.extend(config, {
            left: position.h.location - offset.left + currentPosition.left,
            top: position.v.location - offset.top + currentPosition.top
        });
        delete config.position
    };
    var setProps = function($element, props) {
        $.each(props, function(key, value) {
            try {
                $element.css(key, value)
            } catch (e) {}
        })
    };
    var stop = function(element, jumpToEnd) {
        var $element = $(element),
            queueData = getAnimQueueData($element);
        $.each(queueData, function(_, animation) {
            animation.config.delay = 0;
            animation.config.duration = 0;
            animation.isSynchronous = true
        });
        if (!isAnimating($element)) {
            shiftFromAnimationQueue($element, queueData)
        }
        var animation = $element.data(ANIM_DATA_KEY);
        if (animation) {
            animation.stop(jumpToEnd)
        }
        $element.removeData(ANIM_DATA_KEY);
        destroyAnimQueueData($element)
    };
    var fx = {
        off: false,
        animationTypes: animationConfigurators,
        animate: animate,
        createAnimation: createAnimation,
        isAnimating: isAnimating,
        stop: stop,
        _simulatedTransitionEndDelay: 100
    };
    module.exports = fx
});
