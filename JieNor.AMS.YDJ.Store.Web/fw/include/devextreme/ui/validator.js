/** 
 * DevExtreme (ui/validator.js)
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
        errors = require("./widget/ui.errors"),
        DOMComponent = require("../core/dom_component"),
        ValidationMixin = require("./validation/validation_mixin"),
        ValidationEngine = require("./validation_engine"),
        DefaultAdapter = require("./validation/default_adapter"),
        registerComponent = require("../core/component_registrator");
    var VALIDATOR_CLASS = "dx-validator";
    var Validator = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                validationRules: []
            })
        },
        _init: function() {
            this.callBase();
            this._initGroupRegistration();
            this.focused = $.Callbacks();
            this._initAdapter()
        },
        _initGroupRegistration: function() {
            var group = this._findGroup();
            if (!this._groupWasInit) {
                this.on("disposing", function(args) {
                    ValidationEngine.removeRegisteredValidator(args.component._validationGroup, args.component)
                })
            }
            if (!this._groupWasInit || this._validationGroup !== group) {
                ValidationEngine.removeRegisteredValidator(this._validationGroup, this);
                this._groupWasInit = true;
                this._validationGroup = group;
                ValidationEngine.registerValidatorInGroup(group, this)
            }
        },
        _setOptionsByReference: function() {
            this.callBase();
            $.extend(this._optionsByReference, {
                validationGroup: true
            })
        },
        _initAdapter: function() {
            var that = this,
                element = that.element()[0],
                dxStandardEditor = $.data(element, "dx-validation-target"),
                adapter = that.option("adapter");
            if (!adapter) {
                if (dxStandardEditor) {
                    adapter = new DefaultAdapter(dxStandardEditor, this);
                    adapter.validationRequestsCallbacks.add(function() {
                        that.validate()
                    });
                    this.option("adapter", adapter);
                    return
                }
                throw errors.Error("E0120")
            }
            if (adapter.validationRequestsCallbacks) {
                adapter.validationRequestsCallbacks.add(function() {
                    that.validate()
                })
            }
        },
        _render: function() {
            this.element().addClass(VALIDATOR_CLASS);
            this.callBase()
        },
        _visibilityChanged: function(visible) {
            if (visible) {
                this._initGroupRegistration()
            }
        },
        _optionChanged: function(args) {
            switch (args.name) {
                case "validationGroup":
                    this._initGroupRegistration();
                    return;
                case "validationRules":
                    void 0 !== this.option("isValid") && this.validate();
                    return;
                case "adapter":
                    this._initAdapter();
                    break;
                default:
                    this.callBase(args)
            }
        },
        validate: function() {
            var result, that = this,
                adapter = that.option("adapter"),
                name = that.option("name"),
                bypass = adapter.bypass && adapter.bypass(),
                value = adapter.getValue(),
                currentError = adapter.getCurrentValidationError && adapter.getCurrentValidationError(),
                rules = $.map(that.option("validationRules"), function(rule) {
                    rule.validator = that;
                    return rule
                });
            if (bypass) {
                result = {
                    isValid: true
                }
            } else {
                if (currentError && currentError.editorSpecific) {
                    currentError.validator = this;
                    result = {
                        isValid: false,
                        brokenRule: currentError
                    }
                } else {
                    result = ValidationEngine.validate(value, rules, name)
                }
            }
            this._applyValidationResult(result, adapter);
            return result
        },
        reset: function() {
            var that = this,
                adapter = that.option("adapter"),
                result = {
                    isValid: true,
                    brokenRule: null
                };
            adapter.reset();
            this._applyValidationResult(result, adapter)
        },
        _applyValidationResult: function(result, adapter) {
            var validatedAction = this._createActionByOption("onValidated");
            result.validator = this;
            adapter.applyValidationResults && adapter.applyValidationResults(result);
            this.option({
                isValid: result.isValid
            });
            validatedAction(result)
        },
        focus: function() {
            var adapter = this.option("adapter");
            adapter && adapter.focus && adapter.focus()
        }
    }).include(ValidationMixin);
    registerComponent("dxValidator", Validator);
    module.exports = Validator
});
