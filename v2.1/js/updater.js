function Updater(obj) {
    this.obj = obj;
    this.refresh_interval = -1;
    this.refresh_interval_id = null; // setInterval returns ID, which is stored here
    this.waitingData = false;
    this.key_result = null; // bool, if tracks were requested with secret key

    this.onDataLoaded = null;
    this.onDataUpdated = null;

    this.tracks = null;
    this.selectedTrack = null;
    this.points = [];
    this.pointsNewLength = 0;

    if (obj.refresh) { // This is for using updater.js in manage.html
        obj.refresh.button.onclick = (function () {
            this.updateData.bind(this)();
        }).bind(this);
        obj.refresh.interval.onchange = this._onRefreshIntervalChanged.bind(this);
        this._onRefreshIntervalChanged()
    }
}

Updater.prototype.loadData = function(key=null) {
    // Is supposed to be called once at the very beginning (alerts all unexpected behaviour)
    this._updateTracks(key, (function() {
        if (this.tracks.length == 0) {
            alert('No tracks found!');
            return;
        }
        this.selectedTrack = this.tracks.find(x => x.uid == Math.max(...this.tracks.map(x => x.uid)));
        // this.selectedTrack = this.tracks[this.tracks.length-1];
        let ending = null;
        if (DEBUG) ending = DEBUG_DATABATCH;
        this._requestPoints(this.selectedTrack.uid, null, ending, (function(p) {
            if (p.length == 0) {
                alert('There are no points to load! Please try later, when data is going to appear!');
                return;
            }
            this.points = p;
            this.pointsNewLength = p.length;
            if (this.onDataLoaded) this.onDataLoaded();
        }).bind(this));
    }.bind(this)));
};
Updater.prototype.updateData = function(auto=null) {
    // console.log('upd.updateData' + (auto ? ' (auto)' : ''));
    if (this.waitingData) return; // Deny all updates, if we are still waiting response from server
    this.waitingData = true;
    // Updates current list of points with new ones
    let starting = null;
    let ending = null;
    if (this.points.length > 0) starting = this.points[this.points.length-1].uid;
    if (DEBUG && starting != null) ending = starting + DEBUG_DATABATCH;
    this._requestPoints(this.selectedTrack.uid, starting, ending, (function(p) {
        if (!auto) this._setUpdateInterval(); // restart interval timer if manually clicked
        if (p.length > 0)
            this.points = this.points.concat(p);
        this.pointsNewLength = p.length;
        if (this.onDataUpdated) this.onDataUpdated();
        this.waitingData = false;
    }).bind(this));
};
Updater.prototype.loadTrack = function(track) {
    this.selectedTrack = track;
    this.points = [];
    this.updateData();
};

Updater.prototype.getLatestUpdatePoints = function() {
    // Return the part of points, that has been loaded during last update
    return this.points.slice(this.points.length - this.pointsNewLength, this.points.length);
};

Updater.prototype._updateTracks = function(key=null, callback=null) {
    // Retrieves tracks list from server and stores in this.tracks
    let url = URL_GETTRACKS;
    if (key != null)
        url += '?hidden=true&key=' + key;
    this._getJSON(url, (function (e, d) {
        if (!this._handleJSONResponse(e, d, url, ['tracks'])) return;
        this.tracks = d.tracks;
        if ('key_result' in d)
            this.key_result = d.key_result;
        if (callback) callback();
    }).bind(this));
};
Updater.prototype._requestPoints = function(track_uid, starting, ending, callback) {
    // Careful, this method does not assign points to internal variable this.points!
    let url = URL_GETPOINTS + '?track_uid=' + track_uid;
    if (starting != null) url += '&starting=' + starting;
    if (ending != null) url += '&ending=' + ending;
    this._getJSON(url, (function (e, d) {
        if (!this._handleJSONResponse(e, d, url, ['points'])) return;
        if (callback) callback(d.points);
    }).bind(this));
};

Updater.prototype._setUpdateInterval = function() {
    // console.log('_setUpdateInterval: ' + this.refresh_interval);
    if (this.refresh_interval_id)
        window.clearInterval(this.refresh_interval_id);
    if (this.refresh_interval > 0) {
        this.refresh_interval_id = window.setInterval(this.updateData.bind(this), this.refresh_interval, true);
    }
};
Updater.prototype._onRefreshIntervalChanged = function() {
    // console.log('_onRefreshIntervalChanged');
    this.refresh_interval = parseInt(obj.refresh.interval.options[obj.refresh.interval.selectedIndex].value);
    this._setUpdateInterval();
};
Updater.prototype._getJSON = function(url, callback) {
    // console.log('Requesting: ' + url);
    // Simply makes an AJAX request
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
        let status = xhr.status;
        if (status === 200) callback(null, xhr.response);
        else callback(status);
    };
    xhr.send();
};
Updater.prototype._handleJSONResponse = function(e, d, url, arr_keys) {
    // Takes err and data return values after getJSON request, and handles it properly
    if (e != null || d == null) {
        alert('Could not update data!');
        console.error('Requested url: ' + url);
        console.error(e);
        return false;
    }
    if ('error' in d) {
        alert('Could not update data! Error occurred!');
        console.error('Requested url: ' + url);
        console.error(d['error']);
        return false;
    }
    // if (!('tracks' in d)) {
    if (!arr_keys.every(v => v in d)) {
        alert('Loaded data is invalid!');
        console.error('Requested url: ' + url);
        console.error(d);
        return false;
    }
    return true;
};