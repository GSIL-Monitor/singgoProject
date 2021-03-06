/** 
 * DevExtreme (core/component.js)
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
        Class = require("./class"),
        Action = require("./action"),
        errors = require("./errors"),
        coreDataUtils = require("./utils/data"),
        commonUtils = require("./utils/common"),
        EventsMixin = require("./events_mixin"),
        publicComponentUtils = require("./utils/public_component"),
        devices = require("./devices");
    var cachedGetters = {};
    var cachedSetters = {};
    var Component = Class.inherit({
        _setDeprecatedOptions: function() {
            this._deprecatedOptions = {}
        },
        _getDeprecatedOptions: function() {
            return this._deprecatedOptions
        },
        _getOptionAliasesByName: function(optionName) {
            return $.map(this._deprecatedOptions, function(deprecate, aliasName) {
                return optionName === deprecate.alias ? aliasName : void 0
            })
        },
        _getDefaultOptions: function() {
            return {
                onInitialized: null,
                onOptionChanged: null,
                onDisposing: null,
                defaultOptionsRules: null
            }
        },
        _setDefaultOptions: function() {
            this._options = this._getDefaultOptions()
        },
        _defaultOptionsRules: function() {
            return []
        },
        _setOptionsByDevice: function(userRules) {
            var rules = this._defaultOptionsRules();
            if (this._customRules) {
                rules = rules.concat(this._customRules)
            }
            if ($.isArray(userRules)) {
                rules = rules.concat(userRules)
            }
            var rulesOptions = this._convertRulesToOptions(rules);
            $.extend(true, this._options, rulesOptions);
            for (var fieldName in this._optionsByReference) {
                if (rulesOptions.hasOwnProperty(fieldName)) {
                    this._options[fieldName] = rulesOptions[fieldName]
                }
            }
        },
        _convertRulesToOptions: function(rules) {
            var options = {};
            var currentDevice = devices.current();
            var deviceMatch = function(device, filter) {
                filter = $.makeArray(filter);
                return 1 === filter.length && $.isEmptyObject(filter[0]) || commonUtils.findBestMatches(device, filter).length > 0
            };
            for (var i = 0; i < rules.length; i++) {
                var match, rule = rules[i],
                    deviceFilter = rule.device || {};
                if ($.isFunction(deviceFilter)) {
                    match = deviceFilter(currentDevice)
                } else {
                    match = deviceMatch(currentDevice, deviceFilter)
                }
                if (match) {
                    $.extend(options, rule.options)
                }
            }
            return options
        },
        _isInitialOptionValue: function(name) {
            var isCustomOption = this._customRules && this._convertRulesToOptions(this._customRules).hasOwnProperty(name);
            var optionValue = this.option(name);
            var initialOptionValue = this.initialOption(name);
            var isInitialOption = $.isFunction(optionValue) && $.isFunction(optionValue) ? optionValue.toString() === initialOptionValue.toString() : optionValue === initialOptionValue;
            return !isCustomOption && isInitialOption
        },
        _setOptionsByReference: function() {
            this._optionsByReference = {}
        },
        _getOptionsByReference: function() {
            return this._optionsByReference
        },
        ctor: function(options) {
            this.NAME = this.constructor.publicName();
            options = options || {};
            this._options = {};
            this._updateLockCount = 0;
            this._optionChangedCallbacks = options._optionChangedCallbacks || $.Callbacks();
            this._disposingCallbacks = options._disposingCallbacks || $.Callbacks();
            this.beginUpdate();
            try {
                this._suppressDeprecatedWarnings();
                this._setOptionsByReference();
                this._setDeprecatedOptions();
                this._setDefaultOptions();
                if (options && options.onInitializing) {
                    options.onInitializing.apply(this, [options])
                }
                this._setOptionsByDevice(options.defaultOptionsRules);
                this._resumeDeprecatedWarnings();
                this._initOptions(options)
            } finally {
                this.endUpdate()
            }
        },
        _initOptions: function(options) {
            this.option(options)
        },
        _optionValuesEqual: function(name, oldValue, newValue) {
            oldValue = coreDataUtils.toComparable(oldValue, true);
            newValue = coreDataUtils.toComparable(newValue, true);
            if (oldValue && newValue && oldValue.jquery && newValue.jquery) {
                return newValue.is(oldValue)
            }
            var oldValueIsNaN = oldValue !== oldValue,
                newValueIsNaN = newValue !== newValue;
            if (oldValueIsNaN && newValueIsNaN) {
                return true
            }
            if (null === oldValue || "object" !== typeof oldValue) {
                return oldValue === newValue
            }
            return false
        },
        _init: function() {
            this._createOptionChangedAction();
            this.on("disposing", function(args) {
                this._disposingCallbacks.fireWith(this, [args])
            })
        },
        _createOptionChangedAction: function() {
            this._optionChangedAction = this._createActionByOption("onOptionChanged", {
                excludeValidators: ["disabled", "readOnly", "designMode"]
            })
        },
        _createDisposingAction: function() {
            this._disposingAction = this._createActionByOption("onDisposing", {
                excludeValidators: ["disabled", "readOnly", "designMode"]
            })
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "onDisposing":
                case "onInitialized":
                    break;
                case "onOptionChanged":
                    this._createOptionChangedAction();
                    break;
                case "defaultOptionsRules":
            }
        },
        _dispose: function() {
            this._optionChangedCallbacks.empty();
            this._createDisposingAction();
            this._disposingAction();
            this._disposeEvents();
            this._disposed = true
        },
        instance: function() {
            return this
        },
        beginUpdate: function() {
            this._updateLockCount++
        },
        endUpdate: function() {
            this._updateLockCount = Math.max(this._updateLockCount - 1, 0);
            if (!this._updateLockCount) {
                if (!this._initializing && !this._initialized) {
                    this._initializing = true;
                    try {
                        this._init()
                    } finally {
                        this._initializing = false;
                        this._updateLockCount++;
                        this._createActionByOption("onInitialized", {
                            excludeValidators: ["disabled", "readOnly", "designMode"]
                        })();
                        this._updateLockCount--;
                        this._initialized = true
                    }
                }
            }
        },
        _logWarningIfDeprecated: function(option) {
            var info = this._deprecatedOptions[option];
            if (info && !this._deprecatedOptionsSuppressed) {
                this._logDeprecatedWarning(option, info)
            }
        },
        _logDeprecatedWarningCount: 0,
        _logDeprecatedWarning: function(option, info) {
            var message = info.message || "Use the '" + info.alias + "' option instead";
            errors.log("W0001", this.NAME, option, info.since, message);
            ++this._logDeprecatedWarningCount
        },
        _suppressDeprecatedWarnings: function() {
            this._deprecatedOptionsSuppressed = true
        },
        _resumeDeprecatedWarnings: function() {
            this._deprecatedOptionsSuppressed = false
        },
        _optionChanging: $.noop,
        _notifyOptionChanged: function(option, value, previousValue) {
            var that = this;
            if (this._initialized) {
                var optionNames = [option].concat(that._getOptionAliasesByName(option));
                for (var i = 0; i < optionNames.length; i++) {
                    var name = optionNames[i],
                        args = {
                            name: name.split(/[.\[]/)[0],
                            fullName: name,
                            value: value,
                            previousValue: previousValue
                        };
                    that._optionChangedCallbacks.fireWith(that, [$.extend(that._defaultActionArgs(), args)]);
                    that._optionChangedAction($.extend({}, args));
                    if (!that._disposed) {
                        that._optionChanged(args)
                    }
                }
            }
        },
        initialOption: function(optionName) {
            var currentOptions, currentInitialized = this._initialized;
            if (!this._initialOptions) {
                currentOptions = this._options;
                this._options = {};
                this._initialized = false;
                this._setDefaultOptions();
                this._setOptionsByDevice(currentOptions.defaultOptionsRules);
                this._initialOptions = this._options;
                this._options = currentOptions;
                this._initialized = currentInitialized
            }
            return this._initialOptions[optionName]
        },
        _defaultActionConfig: function() {
            return {
                context: this,
                component: this
            }
        },
        _defaultActionArgs: function() {
            return {
                component: this
            }
        },
        _createAction: function(actionSource, config) {
            var action, that = this;
            return function(e) {
                if (!arguments.length) {
                    e = {}
                }
                if (!$.isPlainObject(e)) {
                    e = {
                        actionValue: e
                    }
                }
                action = action || new Action(actionSource, $.extend(config, that._defaultActionConfig()));
                return action.execute.call(action, $.extend(e, that._defaultActionArgs()))
            }
        },
        _createActionByOption: function(optionName, config) {
            var action, eventName, actionFunc, that = this;
            var result = function() {
                if (!eventName) {
                    config = config || {};
                    if ("string" !== typeof optionName) {
                        throw errors.Error("E0008")
                    }
                    if (0 === optionName.indexOf("on")) {
                        eventName = optionName.charAt(2).toLowerCase() + optionName.substr(3)
                    }
                    actionFunc = that.option(optionName)
                }
                if (!action && !actionFunc && !config.beforeExecute && !config.afterExecute && !that.hasEvent(eventName)) {
                    return
                }
                if (!action) {
                    var beforeExecute = config.beforeExecute;
                    config.beforeExecute = function(args) {
                        that.fireEvent(eventName, args.args);
                        beforeExecute && beforeExecute.apply(that, arguments)
                    };
                    that._suppressDeprecatedWarnings();
                    action = that._createAction(actionFunc, config);
                    that._resumeDeprecatedWarnings()
                }
                return action.apply(that, arguments)
            };
            var onActionCreated = that.option("onActionCreated") || $.noop;
            result = onActionCreated(that, result, config) || result;
            return result
        },
        isOptionDeprecated: function(name) {
            var deprecatedOptions = this._getDeprecatedOptions();
            return deprecatedOptions.hasOwnProperty(name)
        },
        option: function() {
            var normalizeOptionName = function(that, name) {
                var deprecate;
                if (name) {
                    if (!that._cachedDeprecateNames) {
                        that._cachedDeprecateNames = [];
                        for (var optionName in that._deprecatedOptions) {
                            that._cachedDeprecateNames.push(optionName)
                        }
                    }
                    for (var i = 0; i < that._cachedDeprecateNames.length; i++) {
                        if (that._cachedDeprecateNames[i] === name) {
                            deprecate = that._deprecatedOptions[name];
                            break
                        }
                    }
                    if (deprecate) {
                        that._logWarningIfDeprecated(name);
                        var alias = deprecate.alias;
                        if (alias) {
                            name = alias
                        }
                    }
                }
                return name
            };
            var getPreviousName = function(fullName) {
                var splittedNames = fullName.split(".");
                splittedNames.pop();
                return splittedNames.join(".")
            };
            var getFieldName = function(fullName) {
                var splittedNames = fullName.split(".");
                return splittedNames[splittedNames.length - 1]
            };
            var getOptionValue = function(options, name, unwrapObservables) {
                var getter = cachedGetters[name];
                if (!getter) {
                    getter = cachedGetters[name] = coreDataUtils.compileGetter(name)
                }
                return getter(options, {
                    functionsAsIs: true,
                    unwrapObservables: unwrapObservables
                })
            };
            var clearOptionsField = function(options, name) {
                delete options[name];
                var previousFieldName = getPreviousName(name),
                    fieldName = getFieldName(name),
                    fieldObject = previousFieldName ? getOptionValue(options, previousFieldName, false) : options;
                if (fieldObject) {
                    delete fieldObject[fieldName]
                }
            };
            var setOptionsField = function(options, fullName, value) {
                var fieldObject, fieldName = "";
                do {
                    if (fieldName) {
                        fieldName = "." + fieldName
                    }
                    fieldName = getFieldName(fullName) + fieldName;
                    fullName = getPreviousName(fullName);
                    fieldObject = fullName ? getOptionValue(options, fullName, false) : options
                } while (!fieldObject);
                fieldObject[fieldName] = value
            };
            var normalizeOptionValue = function(that, options, name, value) {
                if (name) {
                    var alias = normalizeOptionName(that, name);
                    if (alias && alias !== name) {
                        setOptionsField(options, alias, value);
                        clearOptionsField(options, name)
                    }
                }
            };
            var prepareOption = function(that, options, name, value) {
                if ($.isPlainObject(value)) {
                    for (var valueName in value) {
                        prepareOption(that, options, name + "." + valueName, value[valueName])
                    }
                }
                normalizeOptionValue(that, options, name, value)
            };
            var setOptionValue = function(that, name, value) {
                if (!cachedSetters[name]) {
                    cachedSetters[name] = coreDataUtils.compileSetter(name)
                }
                var path = name.split(/[.\[]/);
                cachedSetters[name](that._options, value, {
                    functionsAsIs: true,
                    merge: !that._getOptionsByReference()[name],
                    unwrapObservables: path.length > 1 && !!that._getOptionsByReference()[path[0]]
                })
            };
            var setOption = function(that, name, value) {
                var previousValue = getOptionValue(that._options, name, false);
                if (that._optionValuesEqual(name, previousValue, value)) {
                    return
                }
                if (that._initialized) {
                    that._optionChanging(name, previousValue, value)
                }
                setOptionValue(that, name, value);
                that._notifyOptionChanged(name, value, previousValue)
            };
            return function(options, value) {
                var that = this,
                    name = options;
                if (arguments.length < 2 && "object" !== $.type(name)) {
                    name = normalizeOptionName(that, name);
                    return getOptionValue(that._options, name)
                }
                if ("string" === typeof name) {
                    options = {};
                    options[name] = value
                }
                that.beginUpdate();
                try {
                    var optionName;
                    for (optionName in options) {
                        prepareOption(that, options, optionName, options[optionName])
                    }
                    for (optionName in options) {
                        setOption(that, optionName, options[optionName])
                    }
                } finally {
                    that.endUpdate()
                }
            }
        }()
    }).include(EventsMixin);
    Component.publicName = publicComponentUtils.getName;
    module.exports = Component
});
