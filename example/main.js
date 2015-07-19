var map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: {lat: 46.285318, lng: -1.868843},
    zoom: 4
});

var lm = new LabelingManager(map);
var lb = new LabelBox({
    arrowLocation: new google.maps.LatLng(39, -9),
    labelOffset: {
        x: 100,
        y: -100
    }
});
lm.addLabelBox(lb);
