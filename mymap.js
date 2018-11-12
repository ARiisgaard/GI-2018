var osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  });

var city = L.OWM.current({appId: 'ee67f8f53521d94193aa7d8364b7f5d9', intervall: 15, lang: 'en', showWindDirection: 'deg'});

var myIcon = L.icon({
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
      })
    ;

var overlayMaps = {"Cities": city };

var basemaps = {
  "OpenStreetMap": osm
}

var layerControl = L.control.layers(basemaps, overlayMaps).addTo(mymap);
//var overlays = {"Route": control}

L.control.scale().addTo(mymap);
var coords;

mymap.locate({
    setView: false,
    watch: false //Temporary dissabled to avoid getting multiple routing options
  }) /* This will return map so you can do chaining */
  .on('locationfound', function(e) {
    coords = L.latLng([e.latitude, e.longitude]);
    var StartLocation = coords //L.latLng(55.650575, 12.541276) //The start of the journey - is later going to be changed to gps coordinates
//    var EndLocation = L.latLng(55.678437, 12.572282)


//This winddirection point is going to be replaced with http://www.movable-type.co.uk/scripts/latlong.html since this take the earths curves into consideration

var length = 5000 //Distance traveled in meters
var angle = 270

var StartLatInRat = e.latitude* Math.PI / 180
var StartLngInRat = e.longitude* Math.PI / 180
var AngleInRat = angle* Math.PI / 180

var R = 6371e3; // Distance to the centre of the earth in metres
var end_y = Math.asin( Math.sin(StartLatInRat)*Math.cos(length/R) +
                    Math.cos(StartLatInRat)*Math.sin(length/R)*Math.cos(AngleInRat) );
var end_x = StartLngInRat + Math.atan2(Math.sin(AngleInRat)*Math.sin(length/R)*Math.cos(StartLatInRat),
                         Math.cos(length/R)-Math.sin(StartLatInRat)*Math.sin(end_y));
var EndLat = end_y*180/Math.PI
var EndLng = end_x*180/Math.PI

// alert(EndLat);
// alert(EndLng);

// var p1 = new LatLon(coords);
// var p2 = p1.destinationPoint(length, angle); // 51.5135°N, 000.0983°W


 // var end_x = e.longitude + length * Math.cos(angle * Math.PI / 180)//Doesn't take earths curves into consideration
 // var end_y = e.latitude + length * Math.sin(angle * Math.PI / 180)//Doesn't take earths curves into consideration
  var start = L.marker([EndLat, EndLng], {icon: myIcon}).addTo(mymap);
var EndLocation = L.latLng(EndLat, EndLng)
  if(myLayer){
      mymap.removeLayer(myLayer);
  }

  var url = "http://127.0.0.1:5000/findstation?lat="+end_y+"&lng="+end_x
    console.log(url)

    $.getJSON(url, function(data){

      console.log(data)

      // add GeoJSON layer to the map once the file is loaded
      myLayer = L.geoJson(data).bindPopup(function (layer) {
      return layer.feature.properties.navn;
  })
      myLayer.addTo(mymap);
});
    var route = L.Routing.control({
      waypoints: [
        StartLocation,
        EndLocation
      ],
      routeWhileDragging: true,
      router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf')
    }).addTo(mymap);
  })
  .on('locationerror', function(e) {
    console.log(e);
    alert("Location access denied.");
  });
