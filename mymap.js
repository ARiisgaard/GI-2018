var osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         maxZoom: 18,
         attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        });

var ortho = L.tileLayer.wms(
         'https://www.wms.nrw.de/geobasis/wms_nw_dop?', {
         layers: 'nw_dop_rgb'
       });

var counties = new L.GeoJSON.AJAX("counties.geojson", {
          style: {"color": "#ff7800",
                  "weight": 5,
                  "opacity": 0.65},
          onEachFeature: function(feature, layer){
              layer.bindPopup(feature.properties.GN);
          }
       });//Dette er en test

var mymap = L.map('map', {
    center: [50.938056, 6.956944],
    zoom: 8,
    layers: [osm, ortho, counties] // add it here
});

L.control.scale().addTo(mymap);//Dette er en test

var basemaps = {"OpenStreetMap": osm}
var overlays = {"Orthophoto": ortho,
                "County borders": counties}

L.control.layers(basemaps, overlays).addTo(mymap);
