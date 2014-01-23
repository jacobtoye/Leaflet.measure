L.Control.Measure = L.Control.extend({
	options: {
		position: 'topleft',
		repeatMode: true,
		shapeOptions: {
			weight: 6
		}
	},

	onAdd: function(map) {
		var container = L.DomUtil.create('div', 'leaflet-draw-section'),
			li, i;

		// TODO: listen to draw stated event so we can disable in case someone starts drawing rather than measuring
		this._handler = new L.Draw.Polyline(map, this.options);

		this._map = map;

		this._measurementLayers = L.layerGroup().addTo(map);

		this._toolbarContainer = L.DomUtil.create('div', 'leaflet-bar');

		this._button = this._createButton({
			title: 'Enter measurement mode',
			className: 'leaflet-measure-button',
			container: this._toolbarContainer,
			callback: this._enableMeasuring
		});

		this._actionsContainer = L.DomUtil.create('ul', 'leaflet-draw-actions');

		li = L.DomUtil.create('li', '', this._actionsContainer);

		this._close = this._createButton({
			title: 'Exit measurement mode',
			text: 'close',
			container: li,
			callback: this._disableMeasuring
		});
		this._close.style.display = 'block';

		// Add draw and cancel containers to the control container
		container.appendChild(this._toolbarContainer);
		container.appendChild(this._actionsContainer);

		return container;
	},

	onRemove: function () {
		this._diposeButton(this._button, this._enableMeasuring);
		this._diposeButton(this._close, this._disableMeasuring);
	},

	_enableMeasuring: function () {
		if(!this._handler.enabled()) {
			this._handler.enable();

			this._map.on('draw:created', this._onMeasured, this);

			this._showClose();
		}
	},

	_disableMeasuring: function () {
		// disable the handler
		this._handler.disable();

		this._map.off('draw:created', this._onMeasured, this);

		this._measurementLayers.clearLayers();

		// hide the close button
		this._hideClose();
	},

	_createButton: function (options) {
		var link = L.DomUtil.create('a', options.className || '', options.container);
		link.href = '#';

		if (options.text) {
			link.innerHTML = options.text;
		}

		if (options.title) {
			link.title = options.title;
		}

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'mousedown', L.DomEvent.stopPropagation)
			.on(link, 'dblclick', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', options.callback, this);

		return link;
	},

	_diposeButton: function (button, callback) {
		L.DomEvent
			.off(button, 'click', L.DomEvent.stopPropagation)
			.off(button, 'mousedown', L.DomEvent.stopPropagation)
			.off(button, 'dblclick', L.DomEvent.stopPropagation)
			.off(button, 'click', L.DomEvent.preventDefault)
			.off(button, 'click', callback, this);
	},

	_showClose: function () {
		L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
		L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
		L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
		L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');

		this._actionsContainer.style.display = 'block';
	},

	_hideClose: function () {
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-top');
		L.DomUtil.removeClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
		L.DomUtil.removeClass(this._actionsContainer, 'leaflet-draw-actions-bottom');

		this._actionsContainer.style.display = 'none';
	},

	_onMeasured: function (e) {
		var layer = e.layer,
			map = this._map;

		if (layer instanceof L.Polyline) {
			this._measurementLayers
				.addLayer(layer)
				.addLayer(this._createLabel(layer));
		}
	},

	_createLabel: function (layer) {
		var distance = L.GeometryUtil.readableDistance(layer.getDistance(), true),
			latlngs = layer.getLatLngs(),
			lastLatLng = latlngs[latlngs.length - 1],
			icon = L.divIcon({
				className: 'leaflet-measure-tooltip-marker',
				iconSize: [0, 0],
				iconAnchor: [6, -6],
				html: '<div class="leaflet-draw-tooltip" style="visibility: visible;">' +
					'<span class="leaflet-draw-tooltip-subtext">' + distance + '</span>'+
					'<br><span></span></div>'
			}),
			labelMarker = L.marker(lastLatLng, { icon: icon });

		return labelMarker;
	}
});

L.Polyline.include({
	getDistance: function () {
		var distance = 0,
			latLngs = this._latlngs,
			latLngsCount = latLngs.length,
			latLng, prevLatLng;

		for(var i = 1; i < latLngsCount; i++) {
			prevLatLng = latLngs[i - 1];

			latLng = latLngs[i];

			distance += latLng.distanceTo(prevLatLng);
		}

		return distance;
	}
});

L.Map.mergeOptions({
	measure: false
});

L.Map.addInitHook(function () {
	if (this.options.measure) {
		this.measure = L.Control.measure().addTo(this);
	}
});

L.Control.measure = function (options) {
	return new L.Control.Measure(options);
};