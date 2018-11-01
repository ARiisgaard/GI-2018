var osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         maxZoom: 18,
         attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        });

var mymap = L.map('map', {
    center: [55.676111, 12.568333],
    zoom: 10,
    layers: [osm] // add it here
});

L.control.scale().addTo(mymap);//Dette er en test

var basemaps = {"OpenStreetMap": osm}
var overlays = {"Orthophoto": ortho,
                "County borders": counties}

L.control.layers(basemaps, overlays).addTo(mymap);
