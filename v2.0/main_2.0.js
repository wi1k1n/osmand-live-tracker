var waypoints = []; // Originally downloaded JSON
var coords = []; // lon/lat array for showing track on map
var currentTrack = null; // track_uid of currently shown track
var ele = []; // array of elevation measurements
var cumulativeDst = []; // array of travelled distance points
var segmDst = []; // array of lengths for each segment
var projectFunction = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');

function centerMapOnTrack() {
    map.getView().fit(trackLine, {padding: [150, 100, 100, 100]});
}
function centerMapOnMarker() {
    let view = map.getView();
    view.setCenter(trackLine.getLastCoordinate());
    view.setZoom(15);
}
var DEBUG_curDataIndex = 0;
const DEBUG_DATABATCH = 10;
var updateWaypoints = function(centerTrack=false) {
    // console.log('updateWaypoints');
    let url = URL_GETPOINTS;
    if (waypoints.length > 0) url += '?starting=' + waypoints[waypoints.length-1]['uid'];
    // <DEBUG>
    if (DEBUG) {
        url = URL_GETPOINTS + '?starting=' + DEBUG_curDataIndex + '&ending=' + (DEBUG_curDataIndex + DEBUG_DATABATCH);
        DEBUG_curDataIndex += DEBUG_DATABATCH;
    }
    // </DEBUG>
    getJSON(url,  function(err, data) {
        if (err != null || data == null) {
            alert('Could not update data!');
            console.error('Requested url: ' + url);
            console.error(err);
            return;
        }
        if ('error' in data) {
            alert('Could not update data! Error occurred!');
            console.error('Requested url: ' + url);
            console.error(data['error']);
            return;
        }
        if (!('tracks' in data) || !('points' in data)) {
            alert('Loaded data is invalid!');
            console.error('Requested url: ' + url);
            console.error(data);
            return;
        }

        // If there is no errors, then parse data
        let tracks = data.tracks; // Every request returns the whole table of tracks
        // This is temporary solution while separate tracks functionality is not implemented
        let last_track_uid = Math.max.apply(Math, tracks.map(function(o) { return o.uid; }));
        if (currentTrack == null) currentTrack = tracks.find(x => x.uid == last_track_uid);
        if (currentTrack.uid !== last_track_uid) alert('A newer track exists in database. Please reload the whole page!');
        let points = data.points.filter(x => x.track_uid == currentTrack.uid);


        if (points.length > 0) { // new data exists
            // Preprocess received data
            let waypoints_upd = points.sort(function(a, b) { return a.uid - b.uid}); // Sort ascending
            let coords_upd = waypoints2coords(waypoints_upd); // prepare lon/lat array
            let ele_upd = points.map(x => x['altitude']);

            // Concatenate with already existing data
            waypoints = waypoints.concat(waypoints_upd);
            coords = coords.concat(coords_upd);
            ele = ele.concat(ele_upd);

            // Update track
            trackLine.setCoordinates(coords);
            trackLine.applyTransform(projectFunction);

            // Calculate segment distances and cumulative distances
            [segmDst, cumulativeDst] = getCoordinateDistances(trackLine.getCoordinates());
            ply_data[0].x = cumulativeDst;
            ply_data[0].y = ele;
            Plotly.redraw(obj.graph);

            // Update marker
            markerPoint.setCoordinates(ol.proj.fromLonLat(coords[coords.length-1]));

            // Center map on track
            if (!waypoints || centerTrack) centerMapOnTrack();

            // ======= Update info on page =======
            let lwp = waypoints[waypoints.length - 1]; // last waypoint

            // Update track_started_at info
            obj.markerInfo.name.innerText = currentTrack.name;
            if (lwp.timestamp_log) obj.markerInfo.timeStart.innerText = waypoints[0].timestamp_log;
            else if (lwp.timestamp_server) obj.markerInfo.timeStart.innerText = waypoints[0].timestamp_server + ' (request time)';
            else obj.markerInfo.timeStart.innerText = "unknown";
            // Update last_update
            if (lwp.timestamp_log) obj.markerInfo.time.innerText = lwp.timestamp_log;
            else if (lwp.timestamp_server) obj.markerInfo.time.innerText = lwp.timestamp_server + ' (request time)';
            else obj.markerInfo.time.innerText = "unknown";
            // Update current_speed
            if (lwp.speed)  obj.markerInfo.speed.innerText = Number(parseFloat(lwp.speed) * 3.6).toFixed(1) + " km/h";
            else obj.markerInfo.speed.innerText = "unknown";
            // Update travelled distance
            obj.markerInfo.distance.innerText = formatDistance(ol.sphere.getLength(trackLine));
        }

        // Update last_update info
        obj.markerInfo.lastRefresh.innerText = getFormattedDate();
    });
}; updateWaypoints(true); // initial update with full track

// onClick for [update] button
obj.refresh.button.addEventListener('click', function(e) {
    updateWaypoints();
    setUpdateInterval();
});

function closePopup() {
    cursorOverlay.setPosition(undefined);
    obj.popup.closer.blur();
    arbitraryPopup = false;
}
obj.popup.closer.onclick = function() {
    closePopup();
    return false;
};









var ply_shapes = [{
    type: 'line',
    x0: 0, y0: 0,
    x1: 0, y1: 1, yref: 'paper',
    line: {
        color: 'grey',
        width: 1,
        dash: 'dot'
    }
}];
var ply_data = [{
    x: cumulativeDst,
    y: ele,
    type: 'scatter',
    name: 'Altitude'
}];
var ply_layout = {
    modebar: {orientation: 'v'},
    margin: {l: 30, t: 10, r: 20, b: 25},
    showlegend: false,
    shapes: ply_shapes,
    // dragmode: false
};
var ply_options = {
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian', 'resetScale2d']
};
Plotly.newPlot(obj.graph, ply_data, ply_layout, ply_options);
function drawHeightmap(ind=null) {
    let v = cumulativeDst[0];
    if (ind != null) v = cumulativeDst[ind];
    ply_shapes[0].x0 = ply_shapes[0].x1 = v;
    Plotly.relayout(obj.graph, {
        'shapes[0]': ply_shapes[0]
    });
}
obj.graph.on('plotly_hover', function(d) {
    let idx = d.points[0].pointNumber;
    drawHeightmap(idx);
});
obj.graph.addEventListener('mouseleave', function(d) {
    // console.log('mouseleave');
    drawHeightmap();
});

// Cursor part
var cursor = null;
var arbitraryPopup = false; // true, if popup shows non-track point atm. needed to trigger closePopup() correctly
// Pointer onMouseMove
var displayCursor = function(coord, click=false, alt=false) {
    let closestPoint = trackLine.getClosestPoint(coord);
    let ind = null; // index of closes point (global scope for drawHeightMap function)
    if (Math.sqrt(Math.pow(closestPoint[0] - coord[0], 2) + Math.pow(closestPoint[1] - coord[1], 2)) > CURSOR_TOLERANCE) {
        // Cursor not in tolerance
        cursor = null;
        map.render();
        // Hide info panel
        obj.curInfo.panel.style.display = "none";
        // If not in tolerance and no alt (i.e. track point request) ~ ordinary click on map -> close popup
        if (click && !alt) {
            closePopup();
        }
    } else {
        // Cursor in tolerance
        if (cursor === null)  cursor = new ol.geom.Point(closestPoint);
        else cursor.setCoordinates(closestPoint);
        map.render();

        // Trying to find closest segment of trackLine
        let closestSegment = findClosestSegment(trackLine.getCoordinates(), closestPoint);
        ind = closestSegment[0];
        let t = closestSegment[1];

        let wp = null;
        if (ind != null && t != null)  wp = waypoints[ind];

        let infoContent = '';
        let hdopCat = null; // hdop category: 0, 1 or 2
        if (wp) {
            // Calculated distance so far
            let cursorTrack = new ol.geom.LineString(coords.slice(0, ind + 1));
            cursorTrack.applyTransform(projectFunction);
            // Considering that wp can be in the middle of last segment
            let crds = cursorTrack.getCoordinates();
            if (crds.length > 1) { // case, when cursor at a very beginning does not need last point adjustment
                let l = crds[crds.length - 1], lp = crds[crds.length - 2];
                let dxy = [l[0] - lp[0], l[1] - lp[1]];
                crds[crds.length - 1] = [lp[0] + t * dxy[0], lp[1] + t * dxy[1]];
            }
            cursorTrack.setCoordinates(crds);
            // Calculating distance itself
            let dst = ol.sphere.getLength(cursorTrack);

            // Updating info on page if found
            let timestamp = (wp.timestamp_log ? wp.timestamp_log : wp.timestamp_server);
            let speed = null;
            let ele = null;
            let sender = null;
            let hdop = null;
            if (wp.speed) speed = Number(parseFloat(wp.speed) * 3.6).toFixed(1) + " km/h";
            if (wp.altitude) ele = Number(parseFloat(wp.altitude)).toFixed(1) + " m";
            if (wp.sender) sender = wp.sender;
            if (wp.hdop) hdop = wp.hdop;

            if (hdop) hdopCat = categorizeHDOP(hdop);

            // Info panel in the bottom-right corner
            obj.curInfo.panel.style.display = "block";
            obj.curInfo.sender.innerText = sender ? sender : 'unknown';
            obj.curInfo.time.innerText = timestamp;
            obj.curInfo.speed.innerText = speed ? speed : 'unknown';
            obj.curInfo.ele.innerText = ele ? ele : 'unknown';
            obj.curInfo.distance.innerText = formatDistance(dst);

            // Info for popup
            infoContent = '';
            if (sender) infoContent += 'Sender: ' + sender;
            infoContent += (infoContent.length > 0 ? '<br>Time: ' : '') + timestamp;
            if (speed) infoContent += '<br>Speed: ' + speed;
            if (ele) infoContent += '<br>Altitude: ' + ele;
            infoContent += (infoContent.length > 0 ? '<br>Travelled: ' : '') + formatDistance(dst);
        }

        if (click && !alt) {
            // Click without alt but in tolerance lead to track-popup
            let hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(closestPoint)).replace(/\s/g, '').replace(/N/g, 'N ');
            if (hdopCat != null) obj.popup.content.innerHTML = '<code title="'+HDOP_TITLES[hdopCat]+'" style="color: '+HDOP_COLORS[hdopCat]+';">' + hdms + '</code>';
            else  obj.popup.content.innerHTML = '<code>' + hdms + '</code>';
            obj.popup.content.innerHTML += '<p>' + infoContent + '</p>';
            arbitraryPopup = false;
            cursorOverlay.setPosition(closestPoint);
        }
    }
    if (click && alt) {
        // Independently of tolerance, if alt used with click, showing coordinate of exact click position
        let hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coord)).replace(/\s/g, '').replace(/N/g, 'N ');
        obj.popup.content.innerHTML = '<code>' + hdms + '</code>';
        arbitraryPopup = true;
        cursorOverlay.setPosition(coord);
    }
    drawHeightmap(ind);
};
map.on('pointermove', function(evt) {
    if (evt.dragging) return;
    var coord = map.getEventCoordinate(evt.originalEvent);
    displayCursor(coord);
});
map.on('click', function(evt) {
    displayCursor(evt.coordinate);
});
map.on('singleclick', function(evt) {
    displayCursor(evt.coordinate, true, evt.originalEvent.altKey);
});

layerTrack.on('postrender', function(evt) {
    var vectorContext = ol.render.getVectorContext(evt);
    vectorContext.setStyle(styleCursor);
    if (cursor !== null)
        vectorContext.drawGeometry(cursor);
});