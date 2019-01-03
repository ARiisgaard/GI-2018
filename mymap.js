//These are all of the global variables. They are defined here because they are used across multiple functions.
//Most of these will be explained, when they are used instead of here.

var locked = false //This variable is telling the program if it should keep looking for new destinations
var EndLocation; //This is variable containing the coordinats of the destination
var StartLocation;
var route;
var length = 5000; //This is the default distance of the trip
var reverse = false;
var finalArray = [];
var goThrough = [];
var orderOfWaypoints = [];
var firstTime = true;
var showPlusMinus = false;
var center;
var sunset;
var wantWarnings = true;


var osm = L.tileLayer( //Defining what map to use in the background
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  });

//This one should be disabled in the final version
var city = L.OWM.current({
  appId: 'ee67f8f53521d94193aa7d8364b7f5d9',
  intervall: 15,
  lang: 'en',
  showWindDirection: 'deg'
});

var myIcon = L.icon({ //defines the icon for the wind location - should also be disabled
  iconUrl: 'Images/windsock.png', //Credits:  Flaticon/Freepik
  iconSize: [30, 30],
  iconAnchor: [15, 20],
  popupAnchor: [-3, -76]
});

var trainIcon = L.icon({//Defines the icon used for the train stations
  iconUrl: 'https://image.flaticon.com/icons/svg/1201/1201644.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 20],
  popupAnchor: [-3, -76]
  });

  var startIcon = L.icon({ //defines the icon for the wind location - should also be disabled
    iconUrl: 'Images/maps-and-flags.png', //Credits:  Flaticon/Freepik
    iconSize: [30, 30],
    iconAnchor: [15, 20],
    popupAnchor: [-3, -76]
  });

  var middleIcon = L.icon({ //defines the icon for the wind location - should also be disabled
    iconUrl: 'Images/park.png', //Credits:  Flaticon/Freepik
    iconSize: [30, 30],
    iconAnchor: [15, 20],
    popupAnchor: [-3, -76]
  });

  var destinationIcon = L.icon({ //defines the icon for the wind location - should also be disabled
    iconUrl: 'Images/racing-flag.png', //Credits:  Flaticon/Freepik
    iconSize: [30, 30],
    iconAnchor: [15, 20],
    popupAnchor: [-3, -76]
  });


// function iconAB (i, start, n){
//
//
//
// }

var stations = new L.GeoJSON.AJAX("stations.geojson", { //creating the "stations" layer
  onEachFeature: function(feature, layer, ) { //creating popup, when clicking on features.
    layer.bindPopup("<h2>Station:</h2>" + " " + feature.properties.navn + "<br>") //tells what to say in the popup. Has to use data from each feature depending on 'navn'.
  },
  pointToLayer: function(geoJsonPoint, latlng) { return L.marker(latlng, {icon: trainIcon})} //Adds the icon to the stations
})

var parks = new L.GeoJSON.AJAX("parks.geojson", {
  onEachFeature: function(feature, layer, ) { //creating popup, when clicking on features.
    layer.bindPopup("You want to go here?" + '<br/><button onclick="goHere()" >Yes</button>' + '<br/><button onclick="dontGoHere()" >No</button>') //tells what to say in the popup. Has to use data from each feature depending on 'navn'.
    layer.on({
      click: function(e) {
        var findBounds = layer.getBounds();
        console.log(findBounds)
        center = findBounds.getCenter();
        console.log(center)
      }
    })

  }
});

function alreadyIncluded(search){
  var result = -1 //By default the answer is no
for (var i = 0; i < finalArray.length; i++) {
  // compare coordinates using Leaflet's equals function:
  if(finalArray[i].equals(search)){//checks every point and sees if it is equal the currently clicked park
    result = i;
}
}

return result;
}

function goHere() {
  if (alreadyIncluded(center) > -1) {//If the park already is included, then the program should just close the popup
    mymap.closePopup();
    console.log("alreadyIncluded(center)a: " + alreadyIncluded(center))
  } else {
    console.log("alreadyIncluded(center)b: " + alreadyIncluded(center))
    goThrough.push(center);
    orderOfWaypoints.push(getDistanceFromLatLonInKm(StartLocation.lat, StartLocation.lng, center.lat, center.lng))
    console.log("orderOfWaypoints: " + orderOfWaypoints)
    console.log("click: " + goThrough)
    var orderedParks = orderArray(goThrough, orderOfWaypoints);
    var parksNoUndefined = orderedParks.filter(function(el) { //There were some issue with center sometimes returning both the coordinates and undefined - this gets rid of the additional undefined
      return el != null;
    })
    console.log("orderedParks: " + orderedParks)
        console.log("parksNoUndefined: " + parksNoUndefined)
    var tempArray = []; //In this empty Array we are fitting all the pieces together
    finalArray = tempArray.concat([StartLocation], parksNoUndefined, [EndLocation])
    mymap.closePopup();
    wantWarnings = true;
    getRoute(StartLocation.lat, StartLocation.lng);
  }
}

function dontGoHere() {
  var index = alreadyIncluded(center);
  if (index > -1) {
    finalArray.splice(index, 1);
  }
  var index2 = goThrough.indexOf(String(center))
  if (index > -1) {
    goThrough.splice(index, 1);
  }
  mymap.closePopup();
  wantWarnings = true;
  getRoute(StartLocation.lat, StartLocation.lng);
  }

var mymap = L.map('map', {//Defines the center of the map and the default zoom-level. Largely irrelevant, since it will zoom to the route immediately after
  center: [55.676111, 12.568333],
  zoom: 10,
  layers: [osm]
});

// // Create an element to hold all your text and markup
// var container = $('<div />');
// // Delegate all event handling for the container itself and its contents to the container
// container.on('click', '.smallPolygonLink', function(e) {
//   console.log("e: " + JSON.stringify(e))
//   // coords2 = L.latLng([e.latlng.lat, e.latlng.lng])
//   numberofwaypoints += 1
//   console.log(numberofwaypoints)
//   getRoute(StartLocation.lat, StartLocation.lng);
// });
// // Insert whatever you want into the container, using whichever approach you prefer
// container.html("You want to go here?: <a href='#' class='smallPolygonLink'>Yes</a>.");
// container.append($('<span class="bold">').text())
// // Insert the container into the popup
// parks.bindPopup(container[0]).on('click', function(e) {
//   parkLocation = L.latLng([e.latlng.lat, e.latlng.lng])
//   goThrough.push(parkLocation);
//   orderOfWaypoints.push(getDistanceFromLatLonInKm(StartLocation.lat, StartLocation.lng, e.latlng.lat, e.latlng.lng))
//   console.log("orderOfWaypoints: " + orderOfWaypoints)
//   console.log("click: " + goThrough)
//   var orderedParks =  orderArray(goThrough, orderOfWaypoints);
//   console.log("orderedParks: " + orderedParks)
//   var tempArray = []; //In this empty Array we are fitting all the pieces together
//   finalArray = tempArray.concat([StartLocation],orderedParks,[EndLocation])
// });

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
      getRoute(StartLocation.lat, StartLocation.lng);
      control.state('OtherWay');
    }
  }, {
    icon: 'fa-bicycle',
    stateName: 'OtherWay',
    onClick: function(control) {
      reverse = false;
      getRoute(StartLocation.lat, StartLocation.lng);
      control.state('OneWay');
    },
    title: 'Bike first'
  }]
});
reversebotton.addTo(mymap);

// function enterDistance() {
//   var distance = prompt("Please enter how many kilometers you would like to cycle", "5");
//   if (distance != null && isNaN(distance) == false) {
//     console.log("isNaN: " + isNaN(distance))
//     length = distance * 1000
//     getRoute(StartLocation.lat, StartLocation.lng);
//   } else if (isNaN(distance) == true) { //If there is an incorrect input then this error message is returned. It is an else if and not an else because otherwise the cancel button woundnt work
//     alert("That is not a valid input")
//     enterDistance();
//   }
// }



L.easyButton('fa-flask', function() {
  var proxy = 'https://cors-anywhere.herokuapp.com/';
  var apiLinkDS = "https://api.darksky.net/forecast/b843700cbe82111c47584343a224adcf/55.676111,12.568333";
  var apiLinkOWM = 'http://api.openweathermap.org/data/2.5/weather?lat=' + StartLocation.lat + '&lon=' + StartLocation.lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'
  var currentTime = Math.round((new Date()).getTime() / 1000);
  $.getJSON(proxy + apiLinkOWM, function(data1) {
    console.log("Sunrise: " + data1.sys.sunrise)
    console.log("Current time: " + currentTime)
    var minToSunset = (data1.sys.sunset - currentTime) / 60
    var minToSunrise = (currentTime - data1.sys.sunrise) / 60
    if (minToSunset > 0) {
      console.log("Minuttes to sunset: " + Math.round(minToSunset))
    } else {
      console.log("Minuttes to sunrise: " + Math.round(minToSunrise))
    }
  });

var dsFlask = "http://127.0.0.1:5000/darksky?lat=" + StartLocation.lat + "&lng=" + StartLocation.lng;
console.log(dsFlask)
  $.getJSON(dsFlask, function(data2) {
    console.log(data2.hourly.data["0"].precipProbability * 100 + "% Chance of precipitation in current hour. Intensity: " + data2.hourly.data["0"].precipIntensity + " millimeters per hour")
    console.log(data2.hourly.data["1"].precipProbability * 100 + "% Chance of precipitation in next hour. Intensity: " + data2.hourly.data["1"].precipIntensity + " millimeters per hour")
  });
}).addTo(mymap);


//https://api.darksky.net/forecast/[key]/[latitude],[longitude]
//https://api.darksky.net/forecast/b843700cbe82111c47584343a224adcf/37.8267,-122.4233

function showhideDistancebuttons() {//This shows or hides the increase/decrease distance buttons
if (showPlusMinus == false) {
  longer.disable()
  shorter.disable()
}
else {
  longer.enable()
  shorter.enable()
}

}

var showLongerShorter = L.easyButton('fa-ruler', function() {//This is the button for showing/hiddin the increase/decrease buttons
  if (showPlusMinus == false) {showPlusMinus = true}
  else {showPlusMinus = false}
  showhideDistancebuttons();
}).addTo(mymap);

var longer = L.easyButton('fa-plus', function() {//This increases the distance with 1 km and calculates a new route
      var oldDistance = routeDistance
      length += 1000
      console.log(length)
      wantWarnings = true;
      getRoute(StartLocation.lat, StartLocation.lng);
});

var shorter = L.easyButton('fa-minus', function() {//This decrease the distance with 1 km and calculates a new route
  length -= 1000
  console.log(length)
  wantWarnings = true;
  getRoute(StartLocation.lat, StartLocation.lng);
});

var distanceBar = L.easyBar([showLongerShorter, longer, shorter, ]); //This connects the buttons for manipuplating the distance of the route. Without this the hidden buttons look messy

distanceBar.addTo(mymap);
showhideDistancebuttons(); //This hides the distance changing buttons as default

var overlayMaps = {//This is the layers, that are hidden, when the map loads, but is possible to enable
  "Cities": city,
  "Stations": stations,
  "Parks": parks
};

var basemaps = {
  "OpenStreetMap": osm
}

var layerControl = L.control.layers(basemaps, overlayMaps).addTo(mymap); //Here it is possible to disable/enable layers

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
    var owmFlask = "http://127.0.0.1:5000/openweathermap?lat=" + lat + "&lng=" + lng;
    // console.log("Test1: " + owmFlask);
    $.getJSON(owmFlask, function(data) {

      var windangle = data.wind.deg //Here it gets the direction of the wind from the api
       sunset = data.sys.sunset //Here the time for sunset gets defined - this is not used here, but it makes more sense to do here than to call the api twice

      if (reverse == false) {//This checks if the reverse botton has been clicked - if it is the case, then it will look for a station in the opposite direction and then further down in the code swap the start and end location

        var angle = windangle + 180 //The direction that the bicylclist is going to travel the opposite way of the winds origin
      } else {
        var angle = windangle
      };

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


//This following disabled code was for showing the "ideal location" - Only use for testing
      var winddestination;
      if (winddestination) {
        mymap.removeLayer(winddestination); //This removes the old winddestination marker, if the program makes another one
        console.log("Wind remove")
      }

      var winddestination = L.marker([EndLat, EndLng], {
        icon: myIcon
      }).addTo(mymap);


      //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database
      $.getJSON("http://127.0.0.1:5000/findstation?lat=" + EndLat + "&lng=" + EndLng, function(data) {//Here we connect to the server and run the findstation request based on the lat and lng of the "ideal" location

        //Here we get the lat and lng from the server
        var stationLat = data.geometry.coordinates[1]
        var stationLng = data.geometry.coordinates[0]

        //the lat and lng are the put together:
        EndLocation = L.latLng(stationLat, stationLng) //This line defines the location of the destination


if (firstTime == true) {//This checks if any parks have been added. If it is not the case, then it defines the waypoint, that ORS should plan the routing after to only being the beginning and the end locations
        finalArray = [StartLocation,
          EndLocation
        ]
        firstTime = false;
}

if (reverse == true) {//This swaps the order of the array, if the user has decided to take the train first (so the journey starts at a train station and ends at their current location)
  finalArray = finalArray.reverse()
};

        calculateRoute(finalArray); //Then the route gets calculated

      });
    });
  } else { //If the user has decided to lock the destination this following code will run instead of the looking for a destination
    calculateRoute(finalArray);
  }
}

function orderArray(coords, distances) {//This function sorts the parks, that the routing is going through, so the order is based on what is the closest to the start location instead of the order of the clicks
  var sorted_coords = []

var coordsLeft = coords.concat(); //This is basicly the same as coordsLeft = coords, but that doesn't work the same way with arrays, so we have to do it this way. If we dont the program would have made coordsLeft a reference to coords instead of just making a copy. This is an issue, since we need to remove values from coordsLeft, but coords has to remain untouched - else it will be impossible to have muliple parks.
var distancesLeft = distances.concat();


  // keep doing this until the distances array is empty:
  while (distancesLeft.length > 0) {

    // find index of smallest distance
    var i = distancesLeft.indexOf(Math.min(...distancesLeft));

    // copy the coordinates for that entry over
    sorted_coords.push(coordsLeft[i]);

    // remove that element from the two input arrays
    coordsLeft.splice(i, 1);
    distancesLeft.splice(i, 1);
  }

  return (sorted_coords);

}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {//This function calculates the distance between to points in km. Based on sphere geometry
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {//This changes from degrees to radians
  return deg * (Math.PI / 180)
}

function calculateRoute(array) {//This is the function, that calculates the routing between the waypoints
  $("div.leaflet-routing-container").remove(); //Removes the previous route description before making a new one



  if (route) {
    mymap.removeControl(route); //This removes the old route, before a new one is created
  }

  route = L.Routing.control({
    waypoints: array,
    createMarker: function (i, start, n){
    var marker_icon = null
    if (i == 0) {
        // This is the first marker, indicating start
        marker_icon = startIcon
    } else if (i == n -1) {
        //This is the last marker indicating destination
        marker_icon =destinationIcon
    } else {marker_icon =middleIcon}
    var marker = L.marker (start.latLng, {
                draggable: true,
                bounceOnAdd: false,
                bounceOnAddOptions: {
                    duration: 1000,
                    height: 800,
                    function(){
                        (bindPopup(myPopup).openOn(mymap))
                    }
                },
                icon: marker_icon
    })
    return marker
  },
    router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
  }).on('routesfound', function(e) {
    routeCoordinates = e.routes[0].coordinates //Saves the coordinates for Later
    routeTime = e.routes[0].summary.totalTime //Saves the total time of the trip
      routeDistance = e.routes[0].summary.totalDistance //Saves the total distance

if (wantWarnings == true){//This prevents the program from spamming - otherwise the alerts would popup every time one gets new coordinates from the gps. This way it only gives results if one makes changes to the route
      var currentTime = Math.round((new Date()).getTime() / 1000);
      if (currentTime < sunset && sunset < routeTime + currentTime) {
      //  alert("Your trip will end " + Math.round((-(sunset - routeTime - currentTime) / 60)) + " minutes after sunset")
      console.log("Your trip will end " + Math.round((-(sunset - routeTime - currentTime) / 60)) + " minutes after sunset")
      }
      var dsFlask = "http://127.0.0.1:5000/darksky?lat=" + StartLocation.lat + "&lng=" + StartLocation.lng;
      $.getJSON(dsFlask, function(data) {
          var thisHour = data.hourly.data["0"].time
          var nextHour = data.hourly.data["1"].time
          var evenLater = data.hourly.data["2"].time
          var precipChanceThisHour = data.hourly.data["0"].precipProbability
          var precipChanceNextHour = data.hourly.data["1"].precipProbability
          var precipIntensityThisHour = data.hourly.data["0"].precipIntensity
          var precipIntensityNextHour = data.hourly.data["1"].precipIntensity


          function Unix_timestamp(t) //This function converts
          {
          var dt = new Date(t*1000);
          var hr = dt.getHours();

          return hr;
        }
//if
          //Noget med test af - er det det ene eller det andet tidspunkt
          //Tilføj et or statement
          if (precipChanceThisHour > 0.5) { //Alerts the user, if there are a higher than 50 percent chance of rain
            alert("There are a " + precipChanceThisHour * 100 + "% Chance of precipitation between " + Unix_timestamp(thisHour) + "-" + Unix_timestamp(nextHour) + ". Intensity: " + precipChanceThisHour + " millimeters per hour")
        } //Chance of precipitation between" + klokkeslet 1 (fra apien) +"-" + klokkelset2 (fra apien)
        //if (currentTime == en time && routeTime + currentTime == en anden time) {}
        if (nextHour < routeTime + currentTime && precipChanceNextHour > 0.5) { //first part is checking if the next hour is relevant
          alert("There are a " + precipChanceNextHour * 100 + "% Chance of precipitation between " + Unix_timestamp(nextHour) + "-" + Unix_timestamp(evenLater) + ". Intensity: " + precipIntensityNextHour + " millimeters per hour")
      }
    })
    wantWarnings = false;
  }
    });



  route.addTo(mymap);
}
