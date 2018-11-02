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

var StartLocation = L.latLng(55.650575, 12.541276)
var EndLocation = L.latLng(55.678437, 12.572282)

var control = L.Routing.control({
  waypoints: [
StartLocation,
EndLocation
  ],
  router: new L.Routing.osrmv1({
serviceUrl: "https://router.project-osrm.org/route/v1",
    language: 'en', 
    profile: 'bike', //Method of transport
    steps: 'true' //Adds a guide for the trip
  })//,
//  geocoder: L.Control.Geocoder.nominatim({}) This code I haven't activated yet, but it should help translating from addresses to latlon
}).addTo(mymap);
