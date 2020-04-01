function Graph(map) {
    this.map = map;
    this.obj = map.obj;
    this.onHover = null;
    this.onMouseLeave = null;
    this.curIndex = 0; // index of point where cursor is raw atm

    this.ply_shapes = [{
        type: 'line',
        x0: 0, y0: 0,
        x1: 0, y1: 1, yref: 'paper',
        line: {
            color: 'grey',
            width: 1,
            dash: 'dot'
        }
    }];
    this.ply_data = [{
        x: this.map.cumulativeDistances,
        y: this.map.ele,
        type: 'scatter',
        name: 'a',
        line: {shape: 'spline'}
    }, {
        x: this.map.cumulativeDistances,
        y: this.map.speed,
        yaxis: 'y2',
        type: 'scatter',
        name: 's',
        line: {shape: 'spline'}
    }];
    this.ply_layout = {
        modebar: {orientation: 'v'},
        margin: {l: 30, t: 10, r: 60, b: 25},
        showlegend: true,
        shapes: this.ply_shapes,
        // dragmode: false
        yaxis: {
            // title: 'altitude',
            titlefont: {color: 'rgb(31,119,180)'},
            tickfont: {color: 'rgb(31,119,180)'},
            fixedrange: true
        },
        yaxis2: {
            // title: 'speed',
            titlefont: {color: 'rgb(255,127,14)'},
            tickfont: {color: 'rgb(255,127,14)'},
            overlaying: 'y',
            side: 'right',
            fixedrange: true
        },
        hovermode: 'x'
    };
    let ply_options = {
        displaylogo: false,
        modeBarButtonsToRemove: ['toImage', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian', 'resetScale2d'],
        responsive: true
    };
    Plotly.newPlot(this.obj.graph, this.ply_data, this.ply_layout, ply_options).then((function() {
        // https://codepen.io/etpinard/pen/EyydEj
        // let xaxis = this.obj.graph._fullLayout.xaxis;
        // let ml = this.obj.graph._fullLayout.margin.l;
        // let ol = this.obj.graph.offsetLeft;
        //
        // this.obj.graph.addEventListener('mousemove', (function(evt) {
        //     let xInDataCoord = xaxis.p2c(evt.x - ol - ml);
        //     this.obj.trackInfo.speed.innerText = xInDataCoord;
        // }).bind(this));
    }).bind(this));


    this.obj.graph.on('plotly_hover', (function(d) {
        let idx = d.points[0].pointNumber;
        this.updateLayout(idx);
        if (this.onHover) this.onHover(d);
    }).bind(this));
    this.obj.graph.addEventListener('mouseleave', (function(d) {
        this.updateLayout();
        if (this.onMouseLeave) this.onMouseLeave(d);
    }).bind(this));
}

Graph.prototype.updateData = function() {
    this.ply_data[0].x = this.ply_data[1].x = this.map.cumulativeDistances;
    this.ply_data[0].y = this.map.ele;
    this.ply_data[1].y = this.map.speed.map(x => x * 3.6);
    Plotly.redraw(this.obj.graph);
};
Graph.prototype.updateLayout = function(ind=null) {
    let v = 0;
    if (ind != null) {
        if (this.curIndex !== ind) this.curIndex = ind;
        else return;
        v = this.map.cumulativeDistances[ind];
    }
    this.ply_shapes[0].x0 = this.ply_shapes[0].x1 = v;
    // Plotly.relayout(this.obj.graph, {
    //     'shapes[0]': this.ply_shapes[0]
    // });
    Plotly.relayout(this.obj.graph, 'shapes', this.ply_shapes);
};