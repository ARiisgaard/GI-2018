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

L.control.scale().addTo(mymap);

var basemaps = {"OpenStreetMap": osm}
 var overlays = {"Route": control}

var control = L.Routing.control({
  waypoints: [
    L.latLng(55.650575, 12.541276),
    L.latLng(55.678437, 12.572282)
  ],
  router: new L.Routing.osrmv1({
    language: 'en',
    profile: 'bike'
  })//,
//  geocoder: L.Control.Geocoder.nominatim({})
}).addTo(mymap);
