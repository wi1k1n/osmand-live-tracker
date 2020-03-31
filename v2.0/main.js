// DOM object containers for all elements of page
var obj = {
    map: ebid('map'),
    popup: {
        panel: ebid('popup'),
        content: ebid('popup-content'),
        closer: ebid('popup-closer')
    },
    markerInfo: {
        panel: ebid('info_table'),
        name: ebid('track_name'),
        time: ebid('time_at_marker'),
        speed: ebid('speed_at_marker'),
        timeStart: ebid('time_on_start'),
        distance: ebid('dst_travelled'),
        lastRefresh: ebid('last_refresh')
    },
    refresh: {
        panel: ebid('refresh_panel'),
        interval: ebid('refresh_interval'),
        button: ebid('update_btn')
    },
    graph: ebid('height_map_container'),
    // DEPRECATED:
    curInfo: {
        panel: ebid('cur_info_container'),
        sender: ebid('cur_sender'),
        time: ebid('cur_timestamp'),
        speed: ebid('cur_speed'),
        ele: ebid('cur_ele'),
        distance: ebid('cur_dst')
    }
};

var map = new Map(obj);
var upd = new Updater(obj);

upd.loadData(function() {
    // This function is stored in Updater and is called as a callback for upd.updateData()
    console.log(upd.tracks);
    console.log(upd.points);
    map.updateTrack(upd.points);
});