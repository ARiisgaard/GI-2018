var osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  });

var city = L.OWM.current({
  appId: 'ee67f8f53521d94193aa7d8364b7f5d9',
  intervall: 15,
  lang: 'en',
  showWindDirection: 'deg'
});

var myIcon = L.icon({ //defines the icon for the wind location
  iconUrl: 'http://icons.iconarchive.com/icons/icons-land/vista-map-markers/256/Map-Marker-Marker-Outside-Chartreuse-icon.png', //Temporary, so we can see the difference between locations and stations
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [-3, -76]
});
var myLayer; //Layer with distination

var stations = new L.GeoJSON.AJAX("stations.geojson", { //creating the "stations" layer
  onEachFeature: function(feature, layer, ) { //creating popup, when clicking on features.
    layer.bindPopup("<h2>Station:</h2>" + " " + feature.properties.navn + "<br>") //tells what to say in the popup. Has to use data from each feature depending on 'navn'.
  }
});

stations.on('click', function(e) {
  coords2 = [e.latlng.lat, e.latlng.lng];
});

var mymap = L.map('map', {
  center: [55.676111, 12.568333],
  zoom: 10,
  layers: [osm, stations] // add it here
});

var overlayMaps = {
  "Cities": city
}; //Adds the overlayer with weather information

var basemaps = {
  "OpenStreetMap": osm
}

var layerControl = L.control.layers(basemaps, overlayMaps).addTo(mymap);
//var overlays = {"Route": control}

L.control.scale().addTo(mymap); //adds a scalebar

mymap.locate({ //This is the code for the gps coordinates - it isn't
    setView: false, //Zooms to the location of the user - disabled since there are going to be zoomed on the map instead
    watch: false //Temporary disabled to avoid getting multiple routing options
  })
  .on('locationfound', function(e) {
    var coords = L.latLng([e.latitude, e.longitude]);
    var StartLocation = coords //The start of the journey



    var api_address = 'http://api.openweathermap.org/data/2.5/weather?lat=' + e.latitude + '&lon=' + e.longitude + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'
    //var api_address = 'http://api.openweathermap.org/data/2.5/weather?lat=55.656553&lon=12.557593&appid=ee67f8f53521d94193aa7d8364b7f5d9'

    fetch(api_address).then(response => {
      return response.json();
    }).then(data => {
      // Work with JSON data here
      var windangle = data.wind.deg

      var angle = windangle //The direction that the bicylclist is going to travel

      var length = 5000 //Distance traveled in meters

      //The following 10ish lines are defining the coordinates used to find the direction. The math behind it can be found here: http://www.movable-type.co.uk/scripts/latlong.html

      var StartLatInRat = e.latitude * Math.PI / 180
      var StartLngInRat = e.longitude * Math.PI / 180
      var AngleInRat = angle * Math.PI / 180

      var R = 6371e3; // Distance to the centre of the earth in metres
      var end_y = Math.asin(Math.sin(StartLatInRat) * Math.cos(length / R) +
        Math.cos(StartLatInRat) * Math.sin(length / R) * Math.cos(AngleInRat));
      var end_x = StartLngInRat + Math.atan2(Math.sin(AngleInRat) * Math.sin(length / R) * Math.cos(StartLatInRat),
        Math.cos(length / R) - Math.sin(StartLatInRat) * Math.sin(end_y));
      var EndLat = end_y * 180 / Math.PI
      var EndLng = end_x * 180 / Math.PI

      //Here stops the coordinate definition


      var Winddestination = L.marker([EndLat, EndLng], {
        icon: myIcon
      }).addTo(mymap);


      //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database
      //Since the code doesn't work at the moment it hasn't been properly documented yet - but basicly the it is the same code as we saw in the parking machine example with small changes
      if (myLayer) {
        mymap.removeLayer(myLayer);
      } //This might be deletable later


      var url = "http://127.0.0.1:5000/findstation?lat=" + EndLat + "&lng=" + EndLng
      console.log(url)
// console.log("Something")
// $.getJSON(url, function(result) {
// console.log("Something else")
//         console.log(result)


fetch(url)
    .then(res => res.json())//response type
    .then(data => console.log(data)); //log the data;

// //The EndLocation should be changed to the coordinate of the station, when those are available
        var EndLocation = L.latLng(EndLat, EndLng) //This line defines the location of the destination - currently it is only defined by going in the direction with the least wind. Later it is going to be replaced with the station the closest to said location

        //Here the routing begins
        var route = L.Routing.control({
          waypoints: [ //This defines from there the route should start and end
            StartLocation,
            EndLocation
          ],
          router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
        }).addTo(mymap);




    })
  })
  .on('locationerror', function(e) { //This refers back to the gps part of the code - so it returns an error message if it cant get access to the gps - if that is the case it skips all of the other steps
    console.log(e);
    alert("Location access denied.");
  });
