// Simply makes an AJAX request
var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
	    xhr.open('GET', url, true);
	    xhr.responseType = 'json';
	    xhr.onload = function() {
	        var status = xhr.status;
	        if (status === 200) {
	            callback(null, xhr.response);
	        } else {
	            callback(status);
	        }
	    };
	    xhr.send();
};
var getFormattedDate = function() {
	let d = new Date();
	d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	return d;
};

// Takes waypoints dictionary and returns lon/lat array
var waypoints2coords = function(wps) {
	let coords = [wps.length];
	for (let i = 0; i < wps.length; i++) {
		coords[i] = [wps[i]['lon'], wps[i]['lat']];
	}
	return coords;
};

// Styles for map
var styleTrack = new ol.style.Style({
	stroke: new ol.style.Stroke({
		color: 'rgb(255, 0, 0)',
		width: 4
	})
});
var styleMarker = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 5,
		fill: new ol.style.Fill({
			color: 'rgb(255, 255, 0)'
		}),
		stroke: new ol.style.Stroke({
			color: 'rgb(0, 0, 0)',
			width: 2
		})
	})
});