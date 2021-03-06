/** 
 * DevExtreme (ui/map/ui.map.provider.dynamic.google.js)
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
        DynamicProvider = require("./ui.map.provider.dynamic"),
        Color = require("../../color");
    var GOOGLE_MAP_READY = "_googleScriptReady",
        GOOGLE_URL = "https://maps.google.com/maps/api/js?sensor=false&callback=" + GOOGLE_MAP_READY;
    var CustomMarker;
    var initCustomMarkerClass = function() {
        CustomMarker = function(options) {
            this._position = options.position;
            this._offset = options.offset;
            this._$overlayContainer = $("<div>").css({
                position: "absolute",
                display: "none",
                cursor: "pointer"
            }).append(options.html);
            this.setMap(options.map)
        };
        CustomMarker.prototype = new google.maps.OverlayView;
        CustomMarker.prototype.onAdd = function() {
            var $pane = $(this.getPanes().overlayMouseTarget);
            $pane.append(this._$overlayContainer);
            this._clickListener = google.maps.event.addDomListener(this._$overlayContainer.get(0), "click", $.proxy(function(e) {
                google.maps.event.trigger(this, "click");
                e.preventDefault()
            }, this));
            this.draw()
        };
        CustomMarker.prototype.onRemove = function() {
            google.maps.event.removeListener(this._clickListener);
            this._$overlayContainer.remove()
        };
        CustomMarker.prototype.draw = function() {
            var position = this.getProjection().fromLatLngToDivPixel(this._position);
            this._$overlayContainer.css({
                left: position.x + this._offset.left,
                top: position.y + this._offset.top,
                display: "block"
            })
        }
    };
    var googleMapsLoaded = function() {
        return window.google && window.google.maps
    };
    var googleMapsLoader;
    var GoogleProvider = DynamicProvider.inherit({
        _mapType: function(type) {
            var mapTypes = {
                hybrid: google.maps.MapTypeId.HYBRID,
                roadmap: google.maps.MapTypeId.ROADMAP,
                satellite: google.maps.MapTypeId.SATELLITE
            };
            return mapTypes[type] || mapTypes.hybrid
        },
        _movementMode: function(type) {
            var movementTypes = {
                driving: google.maps.TravelMode.DRIVING,
                walking: google.maps.TravelMode.WALKING
            };
            return movementTypes[type] || movementTypes.driving
        },
        _resolveLocation: function(location) {
            var d = $.Deferred();
            var latLng = this._getLatLng(location);
            if (latLng) {
                d.resolve(new google.maps.LatLng(latLng.lat, latLng.lng))
            } else {
                this._geocodeLocation(location).done(function(geocodedLocation) {
                    d.resolve(geocodedLocation)
                })
            }
            return d.promise()
        },
        _geocodedLocations: {},
        _geocodeLocationImpl: function(location) {
            var d = $.Deferred();
            var geocoder = new google.maps.Geocoder;
            geocoder.geocode({
                address: location
            }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    d.resolve(results[0].geometry.location)
                } else {
                    d.resolve(new google.maps.LatLng(0, 0))
                }
            });
            return d.promise()
        },
        _normalizeLocation: function(location) {
            return {
                lat: location.lat(),
                lng: location.lng()
            }
        },
        _normalizeLocationRect: function(locationRect) {
            return {
                northEast: this._normalizeLocation(locationRect.getNorthEast()),
                southWest: this._normalizeLocation(locationRect.getSouthWest())
            }
        },
        _loadImpl: function() {
            this._googleMapsLoader = $.Deferred();
            if (googleMapsLoaded()) {
                this._mapReady()
            } else {
                if (!googleMapsLoader || "resolved" === googleMapsLoader.state() && !googleMapsLoaded()) {
                    googleMapsLoader = $.Deferred();
                    var key = this._keyOption("google");
                    window[GOOGLE_MAP_READY] = $.proxy(googleMapsLoader.resolve, googleMapsLoader);
                    $.getScript(GOOGLE_URL + (key ? "&key=" + key : ""))
                }
                googleMapsLoader.done($.proxy(this._mapReady, this))
            }
            return this._googleMapsLoader.promise()
        },
        _mapReady: function() {
            try {
                delete window[GOOGLE_MAP_READY]
            } catch (e) {
                window[GOOGLE_MAP_READY] = void 0
            }
            initCustomMarkerClass();
            this._googleMapsLoader.resolve()
        },
        _init: function() {
            var deferred = $.Deferred(),
                initPromise = $.Deferred(),
                controls = this._option("controls");
            this._map = new google.maps.Map(this._$container[0], {
                zoom: this._option("zoom"),
                panControl: controls,
                zoomControl: controls,
                mapTypeControl: controls,
                streetViewControl: controls
            });
            var listener = google.maps.event.addListener(this._map, "idle", $.proxy(initPromise.resolve, initPromise));
            $.when(initPromise).done($.proxy(function() {
                google.maps.event.removeListener(listener);
                deferred.resolve()
            }, this));
            return deferred.promise()
        },
        _attachHandlers: function() {
            this._boundsChangeListener = google.maps.event.addListener(this._map, "bounds_changed", $.proxy(this._boundsChangeHandler, this));
            this._clickListener = google.maps.event.addListener(this._map, "click", $.proxy(this._clickActionHandler, this))
        },
        _boundsChangeHandler: function() {
            var bounds = this._map.getBounds();
            this._option("bounds", this._normalizeLocationRect(bounds));
            var center = this._map.getCenter();
            this._option("center", this._normalizeLocation(center));
            if (!this._preventZoomChangeEvent) {
                this._option("zoom", this._map.getZoom())
            }
        },
        _clickActionHandler: function(e) {
            this._fireClickAction({
                location: this._normalizeLocation(e.latLng)
            })
        },
        updateDimensions: function() {
            var center = this._option("center");
            google.maps.event.trigger(this._map, "resize");
            this._option("center", center);
            return this.updateCenter()
        },
        updateMapType: function() {
            this._map.setMapTypeId(this._mapType(this._option("type")));
            return $.Deferred().resolve().promise()
        },
        updateBounds: function() {
            var deferred = $.Deferred(),
                that = this;
            var northEastPromise = this._resolveLocation(this._option("bounds.northEast")),
                southWestPromise = this._resolveLocation(this._option("bounds.southWest"));
            $.when(northEastPromise, southWestPromise).done(function(northEast, southWest) {
                var bounds = new google.maps.LatLngBounds;
                bounds.extend(northEast);
                bounds.extend(southWest);
                that._map.fitBounds(bounds);
                deferred.resolve()
            });
            return deferred.promise()
        },
        updateCenter: function() {
            var deferred = $.Deferred(),
                that = this;
            this._resolveLocation(this._option("center")).done(function(center) {
                that._map.setCenter(center);
                that._option("center", that._normalizeLocation(center));
                deferred.resolve()
            });
            return deferred.promise()
        },
        updateZoom: function() {
            this._map.setZoom(this._option("zoom"));
            return $.Deferred().resolve().promise()
        },
        updateControls: function() {
            var controls = this._option("controls");
            this._map.setOptions({
                panControl: controls,
                zoomControl: controls,
                mapTypeControl: controls,
                streetViewControl: controls
            });
            return $.Deferred().resolve().promise()
        },
        _renderMarker: function(options) {
            var d = $.Deferred(),
                that = this;
            this._resolveLocation(options.location).done(function(location) {
                var marker;
                if (options.html) {
                    marker = new CustomMarker({
                        map: that._map,
                        position: location,
                        html: options.html,
                        offset: $.extend({
                            top: 0,
                            left: 0
                        }, options.htmlOffset)
                    })
                } else {
                    marker = new google.maps.Marker({
                        position: location,
                        map: that._map,
                        icon: options.iconSrc || that._option("markerIconSrc")
                    })
                }
                var infoWindow = that._renderTooltip(marker, options.tooltip);
                var listener;
                if (options.onClick || options.tooltip) {
                    var markerClickAction = that._mapWidget._createAction(options.onClick || $.noop),
                        markerNormalizedLocation = that._normalizeLocation(location);
                    listener = google.maps.event.addListener(marker, "click", function() {
                        markerClickAction({
                            location: markerNormalizedLocation
                        });
                        if (infoWindow) {
                            infoWindow.open(that._map, marker)
                        }
                    })
                }
                d.resolve({
                    location: location,
                    marker: marker,
                    listener: listener
                })
            });
            return d.promise()
        },
        _renderTooltip: function(marker, options) {
            if (!options) {
                return
            }
            options = this._parseTooltipOptions(options);
            var infoWindow = new google.maps.InfoWindow({
                content: options.text
            });
            if (options.visible) {
                infoWindow.open(this._map, marker)
            }
            return infoWindow
        },
        _destroyMarker: function(marker) {
            marker.marker.setMap(null);
            if (marker.listener) {
                google.maps.event.removeListener(marker.listener)
            }
        },
        _renderRoute: function(options) {
            var d = $.Deferred(),
                that = this,
                directionsService = new google.maps.DirectionsService;
            var points = $.map(options.locations, function(point) {
                return that._resolveLocation(point)
            });
            $.when.apply($, points).done(function() {
                var locations = $.makeArray(arguments),
                    origin = locations.shift(),
                    destination = locations.pop(),
                    waypoints = $.map(locations, function(location) {
                        return {
                            location: location,
                            stopover: true
                        }
                    });
                var request = {
                    origin: origin,
                    destination: destination,
                    waypoints: waypoints,
                    optimizeWaypoints: true,
                    travelMode: that._movementMode(options.mode)
                };
                directionsService.route(request, function(response, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        var color = new Color(options.color || that._defaultRouteColor()).toHex(),
                            directionOptions = {
                                directions: response,
                                map: that._map,
                                suppressMarkers: true,
                                preserveViewport: true,
                                polylineOptions: {
                                    strokeWeight: options.weight || that._defaultRouteWeight(),
                                    strokeOpacity: options.opacity || that._defaultRouteOpacity(),
                                    strokeColor: color
                                }
                            };
                        var route = new google.maps.DirectionsRenderer(directionOptions),
                            bounds = response.routes[0].bounds;
                        d.resolve({
                            instance: route,
                            northEast: bounds.getNorthEast(),
                            southWest: bounds.getSouthWest()
                        })
                    }
                })
            });
            return d.promise()
        },
        _destroyRoute: function(routeObject) {
            routeObject.instance.setMap(null)
        },
        _fitBounds: function() {
            this._updateBounds();
            if (this._bounds && this._option("autoAdjust")) {
                var zoomBeforeFitting = this._map.getZoom();
                this._preventZoomChangeEvent = true;
                this._map.fitBounds(this._bounds);
                this._boundsChangeHandler();
                var zoomAfterFitting = this._map.getZoom();
                if (zoomBeforeFitting < zoomAfterFitting) {
                    this._map.setZoom(zoomBeforeFitting)
                } else {
                    this._option("zoom", zoomAfterFitting)
                }
                delete this._preventZoomChangeEvent
            }
            return $.Deferred().resolve().promise()
        },
        _extendBounds: function(location) {
            if (this._bounds) {
                this._bounds.extend(location)
            } else {
                this._bounds = new google.maps.LatLngBounds;
                this._bounds.extend(location)
            }
        },
        clean: function() {
            if (this._map) {
                google.maps.event.removeListener(this._boundsChangeListener);
                google.maps.event.removeListener(this._clickListener);
                this._clearMarkers();
                this._clearRoutes();
                delete this._map;
                this._$container.empty()
            }
            return $.Deferred().resolve().promise()
        }
    });
    module.exports = GoogleProvider
});
