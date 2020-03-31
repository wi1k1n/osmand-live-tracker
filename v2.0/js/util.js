// alias for document.getElementById
function ebid(id) {
	return document.getElementById(id);
}

var getFormattedDate = function() {
	let d = new Date();
	d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	return d;
};

// Takes waypoints dictionary and returns lon/lat array
var waypoints2coords = function(wps) {
	return wps.map(x => [x['lon'], x['lat']]);
};

var getCoordinateDistances = function(coords) {
	// Takes an array of coordinates and returns an array of lengths for segments
	// and travelled distances corresponding to each coordinate in the input array
	let segmentDistances = coords.map((cur, idx, arr) => idx == 0 ? 0 : ol.sphere.getDistance(cur, arr[idx-1])).slice(0);
	return [segmentDistances, segmentDistances.reduce((acc, cur) => acc.concat(acc[acc.length-1]+cur), [0])];
};
var findClosestSegment = function(coords, pt, tolerance=1e-2) {
	// Takes list of coords and point, and tries to find best segment for this point
	function dist2segment(pt1, pt2, m) {
		// returns [t, d, p]; where:
		// t \in [0, 1] if projection of m onto pt2-pt1 is on pt2-pt1: coefficient from pt1
		// d - distance from m to pt2-pt1
		// and p is [x, y] - point of projection
		function dotProduct(p1, p2) { return p1[0]*p2[0] + p1[1]*p2[1]; }
		function sqr(x) { return x * x; }
		function dst2(p1, p2) { return sqr(p2[0] - p1[0]) + sqr(p2[1] - p1[1]); }
		// function norm(p) { return Math.sqrt(dst2([0, 0], p))}
		function norm2(p) { return dst2([0, 0], p); }
		let pt1m = [m[0] - pt1[0], m[1] - pt1[1]]; // vector from pt1 to mouse
		let pt12 = [pt2[0] - pt1[0], pt2[1] - pt1[1]]; // vector from pt1 to pt2
		let t = dotProduct(pt1m, pt12) / dst2(pt1, pt2); // coefficient of pt12 to get projection point x
		let pt1x = [t * pt12[0], t * pt12[1]]; // vector from pt1 to projection point x
		let xm = [pt1m[0] - pt1x[0], pt1m[1] - pt1x[1]]; // norm from pt12 to m
		// let d = norm(xm); // distance from m to pt12
		let d = norm2(xm); // squared dst can be used, since only needed for finding minimum
		let p = [pt1[0] + pt1x[0], pt1[1] + pt1x[1]]; // point x of projection m onto pt12
		return [t, d, p];
	}
	let minDst = Infinity;
	let bestInd = null;
	let bestT = null;
	// TODO: may be using coords.findIndex(..) is faster
	for (let i = 0; i < coords.length - 1; i++) {
		let cur = dist2segment(coords[i], coords[i+1], pt);
		if (cur[0] >= 0 && cur[0] <= 1) {
			if (cur[1] < minDst) {
				minDst = cur[1];
				bestInd = i;
				bestT = cur[0];
				if (minDst < tolerance) break;
			}
		}
	}
	return [bestInd, bestT];
};

var formatDistance = function(dst) {
	// Takes number of meters and formats it into a human-readable string
	let output;
	if (dst > 500) {
		output = (Math.round(dst / 1000 * 100) / 100) + ' ' + 'km';
	} else {
		output = (Math.round(dst * 100) / 100) + ' ' + 'm';
	}
	return output;
};
var categorizeHDOP = function(hdop) {
	// hdop >= 100 - special case for no stylization
	if (hdop < 4) return 0;
	else if (hdop < 13) return 1;
	else if (hdop < 100) return 2;
	else return 3;
};


// Styles for map
var styleCursor = new ol.style.Style({
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
});

var CustomControl = (function (Control) {
	function CustomControl(opt_options) {
		var options = opt_options || {};

		var button = document.createElement('button');
		button.innerHTML = options.label ? options.label : 'C';

		var element = document.createElement('div');
		element.className = (options.className ? options.className : 'ol-control-custom') + ' ol-unselectable ol-control';
		element.appendChild(button);

		var callback = options.callback ? options.callback : function() { };

		Control.call(this, {
			element: element,
			target: options.target
		});

		// button.addEventListener('click', this.handleRotateNorth.bind(this), false);
		button.addEventListener('click', callback, false);
	}

	if ( ol.control.Control ) CustomControl.__proto__ = ol.control.Control;
	CustomControl.prototype = Object.create( ol.control.Control && ol.control.Control.prototype );
	CustomControl.prototype.constructor = CustomControl;

	return CustomControl;
}(ol.control.Control));