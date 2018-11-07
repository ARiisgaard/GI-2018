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

// lc = L.control.locate({
//         strings: {
//         title: "Show me where I am, yo!"
//     },
//     locateOptions: {
//                enableHighAccuracy: true //Should in theory increase the accuracy - doesn't seem to work though
// }
// }).addTo(mymap);

// StartCoordinates = null

var basemaps = {"OpenStreetMap": osm}

//L.easyButton('fa-globe', function(btn, map, locationEvent){

//var overlays = {"Route": control}

var StartLocation = L.latLng(55.650575, 12.541276) //The start of the journey - is later going to be changed to gps coordinates
var EndLocation = L.latLng(55.678437, 12.572282)
// mymap.on('locationfound', function (locationEvent) {
// alert(locationEvent)
//   var StartLocation = locationEvent//var Her = locationEvent
// })
//mymap.getCenter()
//

// mymap.locate({setView : true})
// StartLocation = mymap.getCenter()


// window.onload = function() { //When the window is opened it connects to our part of the server?
//
//   let orsDirections = new Openrouteservice.Directions({
//     api_key: "5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf"
//   });
//
//   orsDirections.calculate({
//     coordinates: [[8.690958, 49.404662], [8.687868, 49.390139]],
//     profile: "driving-car",
//     extra_info: ["waytype", "steepness"],
//     geometry_format: "encodedpolyline",
//     format: "json",
//     mime_type: "application/json",
//   })
//     .then(function(json) {
//         // Add your own result handling here
//         console.log(JSON.stringify(json));
//     })
//     .catch(function(err) {
//         console.error(err);
//     });
// };

var request = new XMLHttpRequest();

request.open('GET', 'https://api.openrouteservice.org/directions?api_key=5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf&coordinates=8.34234,48.23424%7C8.34423,48.26424&profile=cycling-road&geometry_format=polyline');

request.onreadystatechange = function () {
  if (this.readyState === 4) {//ReadyState 4 = Done - So when it is done do the following steps
    console.log('Status:', this.status);
    console.log('Headers:', this.getAllResponseHeaders());
    console.log('Body:', this.responseText);

  }
};

request.send();

// L.geoJSON(data, {
//     style: function (feature) {
//         return {color: feature.properties.color};
//     }
// }).bindPopup(function (layer) {
//     return layer.feature.properties.description;
// }).addTo(map);

//
//
// Every thing below is the old routing engine - delete when the new one works
//


// var control = L.Routing.control({
//   waypoints: [
// StartLocation,
// EndLocation
//   ],
//   router: new L.Routing.osrmv1({
//     language: 'en',
//     profile: 'bike', //Method of transport
//     steps: 'true' //Adds a guide for the trip
//   })//,
// //  geocoder: L.Control.Geocoder.nominatim({}) This code I haven't activated yet, but it should help translating from addresses to latlon
// })
// //})
// .addTo(mymap);
