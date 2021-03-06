/** 
 * DevExtreme (viz/range_selector/range_view.js)
 * Version: 16.1.8
 * Build date: Mon Nov 14 2016
 *
 * Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
 * EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
 * MAY BE USED WITH: DevExtreme Complete, DevExtreme Web
 */
"use strict";
define(function(require, exports, module) {
    var translator2DModule = require("../translators/translator2d");

    function createTranslator(valueRange, screenRange) {
        return new translator2DModule.Translator2D(valueRange, {
            top: screenRange[0],
            height: screenRange[1]
        })
    }

    function drawSeriesView(root, seriesDataSource, translator, screenRange, isAnimationEnabled) {
        var series, i, seriesList = seriesDataSource.getSeries(),
            ii = seriesList.length,
            translators = {
                x: translator,
                y: createTranslator(seriesDataSource.getBoundRange().val, screenRange)
            };
        seriesDataSource.adjustSeriesDimensions(translators);
        for (i = 0; i < ii; ++i) {
            series = seriesList[i];
            series._extGroups.seriesGroup = series._extGroups.labelsGroup = root;
            series.draw(translators, isAnimationEnabled)
        }
    }

    function merge(a, b) {
        return void 0 !== a ? a : b
    }

    function RangeView(params) {
        this._params = params;
        this._clipRect = params.renderer.clipRect();
        params.root.attr({
            clipId: this._clipRect.id
        })
    }
    RangeView.prototype = {
        constructor: RangeView,
        update: function(backgroundOption, backgroundTheme, canvas, isCompactMode, isAnimationEnabled, seriesDataSource) {
            var seriesGroup, renderer = this._params.renderer,
                root = this._params.root;
            backgroundOption = backgroundOption || {};
            root.clear();
            this._clipRect.attr({
                x: canvas.left,
                y: canvas.top,
                width: canvas.width,
                height: canvas.height
            });
            if (!isCompactMode) {
                if (merge(backgroundOption.visible, backgroundTheme.visible)) {
                    if (backgroundOption.color) {
                        renderer.rect(canvas.left, canvas.top, canvas.width + 1, canvas.height).attr({
                            fill: merge(backgroundOption.color, backgroundTheme.color),
                            "class": "dx-range-selector-background"
                        }).append(root)
                    }
                    if (backgroundOption.image && backgroundOption.image.url) {
                        renderer.image(canvas.left, canvas.top, canvas.width + 1, canvas.height, backgroundOption.image.url, merge(backgroundOption.image.location, backgroundTheme.image.location)).append(root)
                    }
                }
                if (seriesDataSource && seriesDataSource.isShowChart()) {
                    seriesGroup = renderer.g().attr({
                        "class": "dxrs-series-group"
                    }).append(root);
                    drawSeriesView(seriesGroup, seriesDataSource, this._params.translator, [canvas.top, canvas.top + canvas.height], isAnimationEnabled)
                }
            }
        }
    };
    exports.RangeView = RangeView
});
