function Map(obj) {
    this.obj = obj; // DOM containers

    this.trackLine = new ol.geom.LineString([]); // ol.geom.LineString instance for track
    this.markerPoint = new ol.geom.Point([]); // ol.geom.Point instance for marker
    sourceTrack = new ol.source.Vector({}); // source for track
    sourceMarker = new ol.source.Vector({}); // source for marker

    // Overlay object for popup panel
    this.cursorOverlay = new ol.Overlay({element: obj.popup.panel, autoPan: true, autoPanAnimation: {duration: 10}});
    this.layerTrack = new ol.layer.Vector({
        name: 'Track',
        source: this.sourceTrack,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgb(255, 0, 0)',
                width: 4
            })
        })
    });
    this.map = new ol.Map({
        target: obj.map,
        layers: [
            new ol.layer.Tile({
                name: 'Tile',
                source: new ol.source.OSM()
            }),
            this.layerTrack,
            new ol.layer.Vector({
                name: 'Marker',
                source: sourceMarker,
                style: styleMarker
            })
        ],
        view: new ol.View({center: ol.proj.fromLonLat([37.41, 8.82]), zoom: 4}),
        controls: ol.control.defaults().extend([
            new ol.control.ScaleLine({bar: true, text: false, steps: 2}),
            new ol.control.FullScreen(),
            new CustomControl({
                label: 'M',//'⯐',
                className: 'ol-control-marker ol-control-custom',
                callback: x => null//centerMapOnMarker
            }),
            new CustomControl({
                label: 'H',//'⌂',
                className: 'ol-control-home ol-control-custom',
                callback: x => null// centerMapOnTrack
            }),
            new ol.control.Control({ element: obj.curInfo.panel }),
            new ol.control.Control({ element: obj.markerInfo.panel }),
            new ol.control.Control({ element: obj.refresh.panel }),
            new ol.control.Control({ element: obj.graph })
        ]),
        overlays: [this.cursorOverlay]
    });
    sourceTrack.addFeature(new ol.Feature(this.trackLine));
    sourceMarker.addFeature(new ol.Feature(this.markerPoint));
}

Map.prototype.updateTrack = function(points) {
    console.log('map.updateTrack');
    this.trackLine.setCoordinates(points.map(x => [x.lon, x.lat]));
    this.trackLine.applyTransform(ol.proj.getTransform('EPSG:4326', 'EPSG:3857'));
    // points.map(x => [x.lon, x.lat]).forEach((function(p) {
    //     this.trackLine.appendCoordinate(ol.proj.fromLonLat(p));
    // }).bind(this));
};