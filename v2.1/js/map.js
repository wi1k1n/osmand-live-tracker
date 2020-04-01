function Tracker(obj) {
    this.obj = obj; // DOM containers

    this.upd = new Updater(obj);
    this.upd.onDataLoaded = this.onDataLoaded.bind(this);
    this.upd.onDataUpdated = this.onDataUpdated.bind(this);
    this.upd.loadData();

    this.segmentDistances = [];
    this.cumulativeDistances = [0];
    this.ele = [];
    this.speed = [];

    this.popupFixed = false; // flag determining if popup is fixed (not following the cursor)

    this.graph = new Graph(this);
    this.graph.onHover = this.onGraphHover.bind(this);
    this.graph.onMouseLeave = this.onGraphMouseLeave.bind(this);

    ///// Map settings /////
    this.trackLine = new ol.geom.LineString([]); // ol.geom.LineString instance for track
    this.markerPoint = new ol.geom.Point([]); // ol.geom.Point instance for marker
    this.cursorPoint = new ol.geom.Point([]); // ol.geom.Point instance for cursor

    let sourceTrack = new ol.source.Vector({}); // source for track
    let sourceMarker = new ol.source.Vector({}); // source for marker
    let sourceCursor = new ol.source.Vector({}); // source for cursor
    sourceTrack.addFeature(new ol.Feature(this.trackLine));
    sourceMarker.addFeature(new ol.Feature(this.markerPoint));
    sourceCursor.addFeature(new ol.Feature(this.cursorPoint));

    // Overlay object for popup panel
    this.cursorOverlay = new ol.Overlay({
        element: obj.popup.panel,
        autoPan: true,
        autoPanAnimation: {duration: 10}
    });
    this.layerTrack = new ol.layer.Vector({
        name: 'Track',
        source: sourceTrack,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgb(255, 0, 0)',
                width: 4
            })
        })
    });
    this.layerCursor = new ol.layer.Vector({
        name: 'Cursor',
        source: sourceCursor,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 0, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgb(0,0,0)',
                    width: 1
                }),
            })
        }),
        visible: false
    });

    this.map = new ol.Map({
        target: obj.map,
        layers: [
            new ol.layer.Tile({
                name: 'Tile',
                source: new ol.source.OSM()
            }),
            this.layerTrack,
            this.layerCursor,
            new ol.layer.Vector({
                name: 'Marker',
                source: sourceMarker,
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 1],
                        scale: 0.5,
                        src: 'img/pin.png'
                    })
                })
            })
        ],
        view: new ol.View({
            center: [2338580, 4040532],
            zoom: 2.5,
            maxZoom: 19
        }),
        controls: ol.control.defaults().extend([
            new ol.control.ScaleLine({bar: true, text: false, steps: 2}),
            new ol.control.FullScreen(),
            new CustomControl({
                label: 'M',//'⯐',
                className: 'ol-control-marker ol-control-custom',
                callback: this.centerMapOnMarker.bind(this)
            }),
            new CustomControl({
                label: 'H',//'⌂',
                className: 'ol-control-home ol-control-custom',
                callback: this.centerMapOnTrack.bind(this)
            }),
            new ol.control.Control({ element: obj.trackInfo.panel }),
            new ol.control.Control({ element: obj.refresh.panel }),
            new ol.control.Control({ element: obj.graph })
        ]),
        overlays: [this.cursorOverlay]
    });

    this.map.on('pointermove', this.onPointerMove.bind(this));
    this.map.on('click', this.onClick.bind(this));
    this.map.on('singleclick', this.onSingleclick.bind(this));

    this.obj.popup.closer.onclick = this.closePopup.bind(this);
}

Tracker.prototype.updateTrack = function(new_points) {
    // console.log('map.updateTrack');

    if (new_points.length === 0) return;

    // Add coordinates to trackLine
    // let llCoords = new_points.sort((a, b) => a.uid > b.uid).map(x => [x.lon, x.lat]);
    let llCoords = this.upd.points.map(x => [x.lon, x.lat]);
    let mCoords = llCoords.map(x => ol.proj.fromLonLat(x));
    // mCoords.forEach((function(p) {
    //     this.trackLine.appendCoordinate(p);
    // }).bind(this));
    this.trackLine.setCoordinates(this.trackLine.getCoordinates().concat(mCoords));

    // Update marker position
    this.markerPoint.setCoordinates(mCoords[mCoords.length-1]);

    // Calculate distances
    let dstCoords = llCoords;
    if (this.upd.points.length !== this.upd.pointsNewLength) {
        // Add last from old points to connect new points with already existing
        let lp = this.upd.points[this.upd.points.length-this.upd.pointsNewLength-1];
        dstCoords = [[lp.lon, lp.lat]].concat(dstCoords);
    }
    let segmentDsts = new Array(dstCoords.length - 1);
    let cumDsts = new Array(dstCoords.length);
    cumDsts[0] = this.cumulativeDistances[this.cumulativeDistances.length-1];
    for (let i = 0, j = 1; i < dstCoords.length - 1; i++, j++) {
        let dst = ol.sphere.getDistance(dstCoords[i], dstCoords[j]);
        segmentDsts[i] = dst;
        cumDsts[j] = cumDsts[i] + dst;
    }
    this.segmentDistances = this.segmentDistances.concat(segmentDsts);
    this.cumulativeDistances = this.cumulativeDistances.concat(cumDsts.slice(1, cumDsts.length));

    // For usage in graph
    this.ele = this.ele.concat(new_points.map(x => x.altitude));
    this.speed = this.speed.concat(new_points.map(x => x.speed));

    this.graph.updateData();
};
Tracker.prototype.updateVisuals = function(e) {
    let isClick = e.type !== 'pointermove';
    let isAlt = e.originalEvent.altKey;
    let mCoord = this.map.getEventCoordinate(e.originalEvent);

    // Click with Alt: doesn't care about track tolerance
    if (isAlt && isClick) {
        this.updatePopupInfo({
            point: mCoord,
            hdop: 100
        });
        this.obj.popup.track_specific.style.display = 'none';
        this.cursorOverlay.setPosition(mCoord);
        this.popupFixed = true;
        return;
    }

    // Test if event is in tolerance with track
    let hit = false;
    this.map.forEachFeatureAtPixel(e.pixel, function(f, l) {
        hit = true;
        return true;
    }, {hitTolerance: CURSOR_TOLERANCE, layerFilter: l => l === this.layerTrack});


    if (hit) { // We are in tolerance
        // First of all draw cursor
        let clPt = this.trackLine.getClosestPoint(mCoord);
        this.cursorPoint.setCoordinates(clPt);
        this.layerCursor.setVisible(true);

        // Cursor information panel update
        let ind = null, t = null;
        [ind, t] = findClosestSegment(this.trackLine.getCoordinates(), clPt);

        this.graph.updateLayout(ind);

        if (!this.popupFixed || isClick) { // update panel if not fixed or on click on track
            let dst = this.cumulativeDistances[ind] + t * this.segmentDistances[ind];
            let cp = this.upd.points[ind];
            this.updatePopupInfo({
                point: clPt,
                sender: cp.sender,
                time_log: cp.timestamp_log,
                time_server: cp.timestamp_server,
                speed: cp.speed,
                ele: cp.altitude,
                distance: dst,
                hdop: cp.hdop
            });
            this.obj.popup.track_specific.style.display = 'block';
            this.cursorOverlay.setPosition(clPt);
        }
        // Click in tolerance -> fix popup panel
        if (isClick) this.popupFixed = true;
    } else { // not in tolerance
        this.layerCursor.setVisible(false);

        if (!this.popupFixed || isClick) // close popup if simple click (w/o alt) elsewhere
            this.closePopup();
    }
};

Tracker.prototype.updatePopupInfo = function(vals) {
    let hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(vals.point)).replace(/\s/g, '').replace(/N/g, 'N ');
    let hdopCat = categorizeHDOP(vals.hdop);
    this.obj.popup.coords.innerText = hdms;
    this.obj.popup.coords.title = HDOP_TITLES[hdopCat];
    this.obj.popup.coords.className = HDOP_CLASSNAMES[hdopCat];
    this.obj.popup.sender.innerText = vals.sender ? vals.sender : 'unknown';
    this.obj.popup.time.innerText = vals.time_log ? vals.time_log : (vals.time_server + '*');
    this.obj.popup.time.title = vals.time_log ? '' : TIMESTAMP_SERVER_TITLE;
    this.obj.popup.time.className = vals.time_log ? TIMESTAMP_CLASSNAMES[0] : TIMESTAMP_CLASSNAMES[1];
    this.obj.popup.speed.innerText = vals.speed ? Number(parseFloat(vals.speed) * 3.6).toFixed(1) + " km/h" : 'unknown';
    this.obj.popup.ele.innerText = vals.ele ? Number(parseFloat(vals.ele)).toFixed(1) + " m" : 'unknown';
    this.obj.popup.distance.innerText = formatDistance(vals.distance);
};
Tracker.prototype.updateTrackInfo = function() {
    let lwp = this.upd.points[this.upd.points.length - 1]; // last waypoint
    obj.trackInfo.name.innerText = this.upd.selectedTrack.name;
    if (lwp.timestamp_log) obj.trackInfo.timeStart.innerText = this.upd.points[0].timestamp_log;
    else if (lwp.timestamp_server) obj.trackInfo.timeStart.innerText = this.upd.points[0].timestamp_server + ' (request time)';
    else obj.trackInfo.timeStart.innerText = "unknown";
    // Update last_update
    if (lwp.timestamp_log) obj.trackInfo.time.innerText = lwp.timestamp_log;
    else if (lwp.timestamp_server) obj.trackInfo.time.innerText = lwp.timestamp_server + ' (request time)';
    else obj.trackInfo.time.innerText = "unknown";
    // Update current_speed
    if (lwp.speed)  obj.trackInfo.speed.innerText = Number(parseFloat(lwp.speed) * 3.6).toFixed(1) + " km/h";
    else obj.trackInfo.speed.innerText = "unknown";
    // Update travelled distance
    obj.trackInfo.distance.innerText = formatDistance(ol.sphere.getLength(this.trackLine));

    obj.trackInfo.lastRefresh.innerText = getFormattedDate();
};

Tracker.prototype.onGraphHover = function(d) {
    let idx = d.points[0].pointNumber;
    // Draw cursor synchronously
    this.cursorPoint.setCoordinates(this.trackLine.getCoordinates()[idx]);
    this.layerCursor.setVisible(true);
};
Tracker.prototype.onGraphMouseLeave = function(d) {
    this.layerCursor.setVisible(false);
};
Tracker.prototype.onDataLoaded = function() {
    this.onDataUpdated();
    this.centerMapOnTrack();
};
Tracker.prototype.onDataUpdated = function() {
    this.updateTrack(this.upd.getLatestUpdatePoints());
    this.updateTrackInfo();
};

Tracker.prototype.onPointerMove = function(e) {
    if (e.dragging) return;
    this.updateVisuals(e);
};
Tracker.prototype.onClick = function(e) {
    this.updateVisuals(e);
};
Tracker.prototype.onSingleclick = function(e) {
    this.updateVisuals(e);
};

Tracker.prototype.centerMapOnTrack = function() {
    if (this.trackLine.getCoordinates().length > 0)
        this.map.getView().fit(this.trackLine, {padding: [75, 75, 175, 75]});
};
Tracker.prototype.centerMapOnMarker = function() {
    if (this.markerPoint.getCoordinates().length > 0)
        this.map.getView().fit(this.markerPoint);
};
Tracker.prototype.closePopup = function() {
    this.cursorOverlay.setPosition(undefined);
    this.obj.popup.closer.blur();
    this.popupFixed = false;
};