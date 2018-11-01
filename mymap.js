var osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         maxZoom: 18,
         attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        });

        var firstpolyline = new L.Polyline(pointList, {
            color: 'red',
            weight: 3,
            opacity: 0.5,
            smoothFactor: 1
        });

var mymap = L.map('map', {
    center: [55.676111, 12.568333],
    zoom: 10,
    layers: [osm, firstpolyline] // add it here
});

L.control.scale().addTo(mymap);

var basemaps = {"OpenStreetMap": osm}
var overlays = {"Orthophoto": ortho,
                "County borders": counties}

L.control.layers(basemaps, overlays).addTo(mymap);

get /route/v1/bike/55.650575, 12.541276;55.678437, 12.572282?alternatives=2&steps=false&geometries=polyline&overview=full&annotations=false
