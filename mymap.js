var osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  });

var StartLocation = L.latLng(55.650575, 12.541276) //The start of the journey - is later going to be changed to gps coordinates
var EndLocation = L.latLng(55.678437, 12.572282)


var mymap = L.map('map', {
  center: [55.676111, 12.568333],
  zoom: 10,
  layers: [osm] // add it here
});



var route = L.Routing.control({
  waypoints: [
    StartLocation,
    EndLocation
  ],
  profile: "cycling-regular",
  routeWhileDragging: true,
  router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf')
}).addTo(mymap);

var basemaps = {
  "OpenStreetMap": osm
}
//var overlays = {"Route": control}

L.control.scale().addTo(mymap);

// lc = L.control.locate({
//         strings: {
//         title: "Show me where I am, yo!"
//     },
//     locateOptions: {
//                enableHighAccuracy: true //Should in theory increase the accuracy - doesn't seem to work though
// }
// }).addTo(mymap);

// StartCoordinates = null


// mymap.on('locationfound', function (locationEvent) {
// alert(locationEvent)
//   var StartLocation = locationEvent//var Her = locationEvent
// })
//mymap.getCenter()
//
