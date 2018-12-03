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
  iconUrl: 'Images/windsock.png', //Credits:  Flaticon/Freepik
  iconSize: [30, 30],
  iconAnchor: [15, 20],
  popupAnchor: [-3, -76]
});
//var myLayer; //Layer with distination

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
  layers: [osm]
});

var locked = false //This variable is telling the program if it should keep looking for new destinations
var EndLocation; //This is variable containing the coordinats of the destination
var StartLocation;
var route;
var length = 5000; //This is the default distance of the trip
var reverse = false;

var toggle = L.easyButton({ //With a click of this button the user can lock in the final destination. The button can be clicked again to start looking for new stations
  states: [{
    stateName: 'UnlockDestination',
    icon: 'fa-unlock',
    title: 'Lock final destination',
    onClick: function(control) {
      locked = true;
      control.state('LockDestination');
    }
  }, {
    icon: 'fa-lock',
    stateName: 'LockDestination',
    onClick: function(control) {
      locked = false;
      control.state('UnlockDestination');
    },
    title: 'Unlock final destination'
  }]
});
toggle.addTo(mymap);

var reversebotton = L.easyButton({ //With a click of this button the user can lock in the final destination. The button can be clicked again to start looking for new stations
  states: [{
    stateName: 'OneWay',
    icon: 'fa-train',
    title: 'Train first',
    onClick: function(control) {
      reverse = true;
      control.state('OtherWay');
    }
  }, {
    icon: 'fa-bicycle',
    stateName: 'OtherWay',
    onClick: function(control) {
      reverse = false;
      control.state('OneWay');
    },
    title: 'Bike first'
  }]
});
reversebotton.addTo(mymap);

function enterDistance() {
    var distance = prompt("Please enter how many kilometers you would like to cycle", "5");
    if (distance != null && isNaN(distance) == false) {
        console.log("isNaN: " + isNaN(distance))
                getRoute(StartLocation.lat, StartLocation.lng);
                length = distance*1000
    }
    else if (isNaN(distance) == true) { //If there is an incorrect input then this error message is returned. It is an else if and not an else because otherwise the cancel button woundnt work
    alert("That is not a valid input")
           enterDistance();
         }
}

L.easyButton( 'fa-flask', function(){
  var proxy = 'https://cors-anywhere.herokuapp.com/';
  var apiLinkDS = "https://api.darksky.net/forecast/b843700cbe82111c47584343a224adcf/55.676111,12.568333";
var apiLinkOWM = 'http://api.openweathermap.org/data/2.5/weather?lat=' + StartLocation.lat + '&lon=' + StartLocation.lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'
var currentTime = Math.round((new Date()).getTime() / 1000);
$.getJSON(proxy + apiLinkOWM, function(data1) {
console.log("Sunrise: " + data1.sys.sunrise)
console.log("Current time: " + currentTime)
var minToSunset = (data1.sys.sunset - currentTime)/60
var minToSunrise = (currentTime - data1.sys.sunrise)/60
if (minToSunset > 0) {
console.log("Minuttes to sunset: " + Math.round(minToSunset))
}
else {
console.log("Minuttes to sunrise: " + Math.round(minToSunrise))
}
});

  $.getJSON(proxy + apiLinkDS, function(data2) {
  console.log(data2.hourly.data["0"].precipProbability*100 + "% Chance of precipitation in current hour. Intensity: " + data2.hourly.data["0"].precipIntensity + " millimeters per hour")
  console.log(data2.hourly.data["1"].precipProbability*100 + "% Chance of precipitation in next hour. Intensity: " + data2.hourly.data["1"].precipIntensity + " millimeters per hour")
});
}).addTo(mymap);


//https://api.darksky.net/forecast/[key]/[latitude],[longitude]
//https://api.darksky.net/forecast/b843700cbe82111c47584343a224adcf/37.8267,-122.4233

L.easyButton( 'fa-ruler', function(){
  enterDistance();
}).addTo(mymap);

var overlayMaps = {
  "Cities": city,
  "Stations": stations
}; //Adds the overlayer with weather information

var basemaps = {
  "OpenStreetMap": osm
}

var layerControl = L.control.layers(basemaps, overlayMaps).addTo(mymap);
//var overlays = {"Route": control}

L.control.scale().addTo(mymap); //adds a scalebar

mymap.locate({ //This is the code for finding the users location
  setView: false, //Zooms to the location of the user - disabled since there are going to be zoomed on the map instead
  watch: true //Makes the program keep track of the user location. So this code wont just run once, but will keep running every now and then
}).on('locationfound', function(e) {
  getRoute(e.latitude, e.longitude);
}).on('locationerror', function(e) { //If the gps is unaccessable it will calculate a route from the university and give an error message
  getRoute(55.6504670, 12.5429260);
  $("span#hidden").show(500);
});

function getRoute(lat, lng) {

  StartLocation = L.latLng([lat, lng]); //The start of the journey

  if (locked == false) { //This (combined with the else statement further down) prevents the program from look for a new destination, when the user has picked a destination.

  var api_address = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'

  //var api_address = 'http://api.openweathermap.org/data/2.5/weather?lat=55.656553&lon=12.557593&appid=ee67f8f53521d94193aa7d8364b7f5d9'

  $.getJSON(api_address, function(data) {

    var windangle = data.wind.deg
if (reverse == false) {

    var angle = windangle + 180 //The direction that the bicylclist is going to travel the opposite way of the wind
}
else {var angle = windangle};

  //  var length = 5000 //Distance traveled in meters

    //The following 10ish lines are defining the coordinates used to find the direction. The math behind it can be found here: http://www.movable-type.co.uk/scripts/latlong.html

    var StartLatInRat = lat * Math.PI / 180
    var StartLngInRat = lng * Math.PI / 180
    var AngleInRat = angle * Math.PI / 180

    var R = 6371e3; // Distance to the centre of the earth in metres
    var end_y = Math.asin(Math.sin(StartLatInRat) * Math.cos(length / R) +
      Math.cos(StartLatInRat) * Math.sin(length / R) * Math.cos(AngleInRat));
    var end_x = StartLngInRat + Math.atan2(Math.sin(AngleInRat) * Math.sin(length / R) * Math.cos(StartLatInRat),
      Math.cos(length / R) - Math.sin(StartLatInRat) * Math.sin(end_y));
    var EndLat = end_y * 180 / Math.PI
    var EndLng = end_x * 180 / Math.PI

    //Here stops the coordinate definition

    var winddestination;
    if (winddestination) {
      mymap.removeLayer(winddestination); //This removes the old winddestination marker, if the program makes another one
console.log("Wind remove")
    }

    var winddestination = L.marker([EndLat, EndLng], {
      icon: myIcon
    }).addTo(mymap);


    //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database

    $.getJSON("http://127.0.0.1:5000/findstation?lat=" + EndLat + "&lng=" + EndLng, function(data) {
      var stationLat = data.geometry.coordinates[1]
      var stationLng = data.geometry.coordinates[0]

      // //The EndLocation should be changed to the coordinate of the station, when those are available
      EndLocation = L.latLng(stationLat, stationLng) //This line defines the location of the destination - currently it is only defined by going in the direction with the least wind. Later it is going to be replaced with the station the closest to said location

      //Here the routing begins
      $("div.leaflet-routing-container").remove(); //Removes the previous route describtion before making a new one
      if (reverse == true) {

      // var templocation = StartLocation;
      // StartLocation = EndLocation;
      // Endlocation = templocation;
[StartLocation,EndLocation] = [EndLocation,StartLocation];
    };

      if (route) {
        mymap.removeControl(route); //This removes the old route, if a new one is created
      }
console.log("StartLocation; " + StartLocation)
console.log("EndLocation; " + EndLocation)
      route = L.Routing.control({
        waypoints: [ //This defines from there the route should start and end
          StartLocation,
          EndLocation
        ],
        router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
      })

      route.addTo(mymap);

    });
  });
} else { //If the user has decided to lock the destination this following code will run instead of the looking for a destination
    //Here the routing begins
    $("div.leaflet-routing-container").remove(); //Removes the previous route describtion before making a new one



    if (route) {
      mymap.removeControl(route); //This removes the old route, if a new one is created
    }

    route = L.Routing.control({
      waypoints: [ //This defines from there the route should start and end
        StartLocation,
        EndLocation
      ],
      router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
    })

    route.addTo(mymap);
}
}
