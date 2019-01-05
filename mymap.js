//These are all of the global variables. They are defined here because they are used across multiple functions.
//Most of these will be explained, when they are used instead of here.

var locked = false //This variable is telling the program if it should keep looking for new destinations
var endLocation; //This is variable containing the coordinats of the destination
var startLocation;
var route;
var length = 5000; //This is the default distance of the trip
var triesChangingLength = 0;
var reverse = false;
var finalArray = [];
var arrayWithParks = [];
var goThrough = [];
var orderOfWaypoints = [];
var parksAdded = 0;
var showPlusMinus = false;
var center;
var sunset;
var wantWarnings = true; //This makes warnings if there are a risk of rain/sundown during the trip.
var oldDestination;
var distanceButtonClicked;

var osm = L.tileLayer( //Defining what map to use in the background
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © \
              <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  });

//This is the layer with weather information
var weatherinfobox = L.OWM.current({
  appId: 'ee67f8f53521d94193aa7d8364b7f5d9',
  intervall: 15, //updates every 15 minuttes
  lang: 'en',
  showWindDirection: 'both',
  showWindSpeed: 'speed'
});

var myIcon = L.icon({ //defines the icon for the wind location -
  iconUrl: 'Images/windsock.png', //Credits:  Flaticon/Freepik
  iconSize: [30, 30],
  iconAnchor: [15, 20],
  popupAnchor: [-3, -76]
});

var trainIcon = L.icon({ //Defines the icon used for the train stations
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

//Here the credits for the icons are added to the map
mymap.attributionControl.addAttribution('<abbr title="Icons made by Freepik and Icon Pond from www.flaticon.com">Icons</abbr>');

var stations = new L.GeoJSON.AJAX("stations.geojson", { //creating the "stations" layer
  onEachFeature: function(feature, layer, ) { //creating popup, when clicking on features.
    layer.bindPopup("<h2>Station:</h2>" + " " + feature.properties.navn + "<br>") //tells what to say in the popup. Has to use data from each feature depending on 'navn'.
  },
  pointToLayer: function(geoJsonPoint, latlng) {
    return L.marker(latlng, {
      icon: trainIcon
    })
  } //Adds the icon to the stations
})

var parks = new L.GeoJSON.AJAX("parks.geojson", {
  onEachFeature: function(feature, layer, ) { //creating popup, when clicking on features.
    layer.bindPopup("You want to go here?" + '<br/><button onclick="goHere()" >Yes</button>' + '<br/><button onclick="dontGoHere()" >No</button>') //Content of the popup. The popup includes two buttons that triggers the the two functions below
    layer.on({ //This saves the coordinates of the center of the clicked park. These coordinates are used, if one clicks one of the buttons.
      click: function(e) {
        var findBounds = layer.getBounds();
        center = findBounds.getCenter();
      }
    })

  }
});

// This function checks if a clicked park already has been clicked
function alreadyIncluded(search, array) {
  var result = -1 //By default the answer is no
  for (var i = 0; i < array.length; i++) {
    // compare coordinates using Leaflet's equals function:
    if (array[i].equals(search)) { //checks every point and sees if it is equal the currently clicked park
      result = i;
    }
  }

  return result;
}

function goHere() {
  if (alreadyIncluded(center, finalArray) > -1) { //If the park already is included, then the program should just close the popup
    mymap.closePopup();
  } else {
    goThrough.push(center);
    orderOfWaypoints.push(getDistanceFromLatLonInKm(startLocation.lat, startLocation.lng, center.lat, center.lng))
    var orderedParks = orderArray(goThrough, orderOfWaypoints);
    arrayWithParks = orderedParks.filter(function(el) { //There were some issue with center sometimes returning both the coordinates and undefined - this gets rid of the additional undefined
      return el != null;
    })

    mymap.closePopup();
    wantWarnings = true; //Since this would increase the duration of the trip the should again check if there are any warnings to give in regards to rain/sundown
    parksAdded += 1;
    findIdealLocation(startLocation.lat, startLocation.lng);
  }
}

function dontGoHere() {
  var index = alreadyIncluded(center, arrayWithParks);
  if (index > -1) {
    arrayWithParks.splice(index, 1);
  }
  var index2 = alreadyIncluded(center, goThrough);
  if (index2 > -1) {
    goThrough.splice(index2, 1); //Removes the park from the list of parks,
  }
  mymap.closePopup();
  parksAdded -= 1;
  findIdealLocation(startLocation.lat, startLocation.lng);
}

var mymap = L.map('map', { //Defines the center of the map and the default zoom-level. Largely irrelevant, since it will zoom to the route immediately after
  center: [55.676111, 12.568333],
  zoom: 10,
  layers: [osm]
});

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
      findIdealLocation(startLocation.lat, startLocation.lng);
      control.state('OtherWay');
    }
  }, {
    icon: 'fa-bicycle',
    stateName: 'OtherWay',
    onClick: function(control) {
      reverse = false;
      findIdealLocation(startLocation.lat, startLocation.lng);
      control.state('OneWay');
    },
    title: 'Bike first'
  }]
});
reversebotton.addTo(mymap);


function showhideDistancebuttons() { //This shows or hides the increase/decrease distance buttons
  if (showPlusMinus == false) {
    longer.disable()
    shorter.disable()
  } else {
    longer.enable()
    shorter.enable()
  }
}

var showLongerShorter = L.easyButton('fa-ruler', function() { //This is the button for showing/hiddin the increase/decrease buttons
  if (showPlusMinus == false) {
    showPlusMinus = true
  } else {
    showPlusMinus = false
  }
  showhideDistancebuttons();
}).addTo(mymap);

var longer = L.easyButton('fa-plus', function() { //This increases the distance with 1 km and calculates a new route
  length += 1000
  wantWarnings = true;
  oldDestination = endLocation;
  distanceButtonClicked = "longer"
  findIdealLocation(startLocation.lat, startLocation.lng);
});

var shorter = L.easyButton('fa-minus', function() { //This decrease the distance with 1 km and calculates a new route
  length -= 1000
  wantWarnings = true;
  oldDestination = endLocation;
  distanceButtonClicked = "shorter"
  findIdealLocation(startLocation.lat, startLocation.lng);
});

var distanceBar = L.easyBar([showLongerShorter, longer, shorter, ]); //This connects the buttons for manipuplating the distance of the route. Without this the hidden buttons look messy

distanceBar.addTo(mymap);
showhideDistancebuttons(); //This hides the distance changing buttons as default

var overlayMaps = { //This is the layers, that are hidden, when the map loads, but is possible to enable
  "Weather information": weatherinfobox,
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
  findIdealLocation(e.latitude, e.longitude);
}).on('locationerror', function(e) { //If the gps is unaccessable it will calculate a route from the university and give an error message
  findIdealLocation(55.6504670, 12.5429260);
  $("span#hidden").show(500);
});

function findIdealLocation(lat, lng) {

  startLocation = L.latLng([lat, lng]); //The start of the journey

  if (locked == false) { //This (combined with the else statement further down) prevents the program from look for a new destination, when the user has picked a destination.

    var owmFlask = "http://127.0.0.1:5000/openweathermap?lat=" + lat + "&lng=" + lng;

    $.getJSON(owmFlask, function(data) {
      var windangle = data.wind.deg //Here it gets the direction of the wind from the api
      sunset = data.sys.sunset //Here the time for sunset gets defined - this is not used here, but it makes more sense to do here than to call the api twice

      if (reverse == false) { //This checks if the reverse botton has been clicked - if it is the case, then it will look for a station in the opposite direction and then further down in the code swap the start and end location

        var angle = windangle + 180 //The direction that the bicylclist is going to travel the opposite way of the winds origin
      } else {
        var angle = windangle
      };

      //The following 10ish lines are defining the coordinates used to find the direction. The math behind it can be found here: http://www.movable-type.co.uk/scripts/latlong.html
      var startLatInRat = lat * Math.PI / 180
      var startLngInRat = lng * Math.PI / 180
      var angleInRat = angle * Math.PI / 180

      var radiusEarth = 6371e3; // Distance to the centre of the earth in metres
      var end_y = Math.asin(Math.sin(startLatInRat) * Math.cos(length / radiusEarth) +
        Math.cos(startLatInRat) * Math.sin(length / radiusEarth) * Math.cos(angleInRat));
      var end_x = startLngInRat + Math.atan2(Math.sin(angleInRat) * Math.sin(length / radiusEarth) * Math.cos(startLatInRat),
        Math.cos(length / radiusEarth) - Math.sin(startLatInRat) * Math.sin(end_y));
      var endLat = end_y * 180 / Math.PI
      var endLng = end_x * 180 / Math.PI

      //Here stops the coordinate definition


      //This following disabled code was for showing the "ideal location" - Only use for testing - Included in case that is going to be needed for the exam

      // var winddestination;
      // if (winddestination) {
      //   mymap.removeLayer(winddestination); //This removes the old winddestination marker, if the program makes another one
      // }
      //
      // winddestination = L.marker([endLat, endLng], {
      //   icon: myIcon
      // }).addTo(mymap);


      //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database
      $.getJSON("http://127.0.0.1:5000/findstation?lat=" + endLat + "&lng=" + endLng, function(data) { //Here we connect to the server and run the findstation request based on the lat and lng of the "ideal" location

        //Here we get the lat and lng from the server
        var stationLat = data.geometry.coordinates[1]
        var stationLng = data.geometry.coordinates[0]

        //the lat and lng are the put together:
        endLocation = L.latLng(stationLat, stationLng) //This line defines the location of the destination

        if (endLocation.equals(oldDestination)) { //This makes sure that using the distance buttons return a new station every time, by seeing if the previous endLocation is the same as the current one.
          //All of this is only triggered if distance buttons are pressed and the results are the same as before
          triesChangingLength += 1
          if (distanceButtonClicked == "shorter") { //These if-statements checks which of the distance buttons were pressed and increase or decrease the seach distance before restarting the function
            length -= 1000

          }
          if (distanceButtonClicked == "longer") {
            length += 1000
          }

          if (triesChangingLength < 5) { //This prevents an endless loop, if the program is unable to find a new station
            findIdealLocation(startLocation.lat, startLocation.lng); //This restarts the function
            return; //This ends the function here - otherwise the rest of the function would play out as well (This way it doesnt have to draw the route every time)
          } else {
            console.log("Unable to find a station further away")
            oldDestination = null; //This ensures that endLocation =/= oldDestination on the next run through
            findIdealLocation(startLocation.lat, startLocation.lng); //This restarts the function one last time
            return;
          }
        } else {
          triesChangingLength = 0; //This resets the number of tries
          if (parksAdded == 0) { //This checks if any parks have been added. If it is not the case, then it defines the waypoints, that ORS should plan the routing after to only being the beginning and the end locations
            finalArray = [startLocation,
              endLocation
            ]
          } else { //This defines the waypoints that the route is going through if parks were selected

            var tempArray = []; //In this empty Array we are fitting all the pieces together
            finalArray = tempArray.concat([startLocation], arrayWithParks, [endLocation])
          }

          if (reverse == true) { //This swaps the order of the array, if the user has decided to take the train first (so the journey starts at a train station and ends at their current location)
            finalArray = finalArray.reverse()
          };

          calculateRoute(finalArray); //Then the route gets calculated
        }
      });
    });
  } else { //If the user has decided to lock the destination this following code will run instead of the looking for a destination
    calculateRoute(finalArray);
  }
}

function orderArray(coords, distances) { //This function sorts the parks, that the routing is going through, so the order is based on what is the closest to the start location instead of the order of the clicks
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

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) { //This function calculates the distance between to points in km. Based on sphere geometry
  var radiusEarth = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = radiusEarth * c; // Distance in km
  return d;
}

function deg2rad(deg) { //This changes from degrees to radians
  return deg * (Math.PI / 180)
}

function calculateRoute(array) { //This is the function, that calculates the routing between the waypoints
  $("div.leaflet-routing-container").remove(); //Removes the previous route description before making a new one

  if (route) {
    mymap.removeControl(route); //This removes the old route, before a new one is created
  }

  route = L.Routing.control({
    waypoints: array,
    createMarker: function(i, start, n) { //This defines what the start, middle and end icons should look like
      var marker_icon = null
      if (i == 0) {
        // This is the first marker, indicating start
        marker_icon = startIcon
      } else if (i == n - 1) {
        //This is the last marker indicating destination
        marker_icon = destinationIcon
      } else {
        marker_icon = middleIcon
      }
      var marker = L.marker(start.latLng, {
        draggable: false,
        bounceOnAdd: false,
        bounceOnAddOptions: {
          duration: 1000,
          height: 800,
          function() {
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

    //The next lines are weather alerts, that triggered if there are a high risk of rain or the trip ends before sundown
    if (wantWarnings == true) { //This prevents the program from spamming - otherwise the alerts would popup every time one gets new coordinates from the gps. This way it only gives results if one makes changes to the route
      var content1 = ""; //These are empty, so that the alert doesnt say "undefined" if there are no need for this alert
      var content2 = "";
      var content3 = "";
      var currentTime = Math.round((new Date()).getTime() / 1000); //This finds the current time in unix time (seconds from jan 1970)
      if (currentTime < sunset && sunset < routeTime + currentTime) { //The sunset alert triggers if the route starts before sunset and ends after
        content1 = String("Your trip will end " + Math.round((-(sunset - routeTime - currentTime) / 60)) + " minutes after sunset \n")
      }
      var dsFlask = "http://127.0.0.1:5000/darksky?lat=" + startLocation.lat + "&lng=" + startLocation.lng;
      $.getJSON(dsFlask, function(data) { //This checks the risk and intensity of precipitation for the current hour and the next
        var thisHour = data.hourly.data["0"].time
        var nextHour = data.hourly.data["1"].time
        var evenLater = data.hourly.data["2"].time
        var precipChanceThisHour = data.hourly.data["0"].precipProbability
        var precipChanceNextHour = data.hourly.data["1"].precipProbability
        var precipIntensityThisHour = data.hourly.data["0"].precipIntensity
        var precipIntensityNextHour = data.hourly.data["1"].precipIntensity
        var tempThisHour = (data.hourly.data["0"].temperature - 32) * 5 / 9 //This finds the temperature converted from fahrenheit to celcius
        var tempNextHour = (data.hourly.data["1"].temperature - 32) * 5 / 9

        function Unix_timestamp(t) //This function converts unix to hours
        {
          var dt = new Date(t * 1000);
          var hr = dt.getHours();

          return hr;
        }

        if (precipChanceThisHour >= 0.5) { //Alerts the user, if there are a higher than 50 percent chance of rain
          var precipTypeThisHour = "rain"
          if (tempThisHour < 0) { //This changes rain to snow in the message below if the temperature are below 0
            precipTypeThisHour = "snow"
          }
          content2 = String("There are a " + precipChanceThisHour * 100 + "% Chance of " + precipTypeThisHour + " between " + Unix_timestamp(thisHour) + "-" + Unix_timestamp(nextHour) + ". Intensity: " + precipIntensityThisHour + " millimeters per hour\n")
        }
        if (nextHour < routeTime + currentTime && precipChanceNextHour >= 0.5) { //first part is checking if the next hour is relevant
          var precipTypeNextHour = "rain"
          if (tempNextHour < 0) { //This changes rain to snow in the message below if the temperature are below 0
            precipTypeNextHour = "snow"
          }
          content3 = String("There are a " + precipChanceNextHour * 100 + "% Chance of " + precipTypeNextHour + " between " + Unix_timestamp(nextHour) + "-" + Unix_timestamp(evenLater) + ". Intensity: " + precipIntensityNextHour + " millimeters per hour")
        }

        var content = content1 + content2 + content3 //This connects the three content strings into one alert
        if (content.length > 0) { //This makes sure that no alert is shown if there is nothing to alert about
          alert(content)
        }
      })
      wantWarnings = false; //This disables alerts until the user changes the distance of the trip or adds/removes a park
    }
  });
  route.addTo(mymap);
}




//The next lines of code are connected to the 5 ECTS extra



var clockAngle = 0; //This is a variable used for the clock, to see which angles it has checked.
var buttonPressed;
var energyCalcWindAngle;
var energyCalcWindSpeed;

L.easyButton('fa-bolt', function() { //Clicking this button will calculate the energy needed for the trip
  buttonPressed = "bolt"

  var owmFlask = "http://127.0.0.1:5000/openweathermap?lat=" + startLocation.lat + "&lng=" + startLocation.lng;
  $.getJSON(owmFlask, function(data) {

    energyCalcWindAngle = data.wind.deg
    energyCalcWindSpeed = data.wind.speed

    energyCalculations();
  })
}).addTo(mymap);

L.easyButton('fa-clock', function() {
  buttonPressed = "clock"

  energyCalcWindAngle = 270
  energyCalcWindSpeed = 3

  mymap.stopLocate() //This stops the other locate function
  mymap.options.minZoom = 12; //This changes the zoom level, so the entire clock area can be seen
  mymap.options.maxZoom = 12;

  if (route) {
    mymap.removeControl(route); //This removes the old route, before a new one is created
  }

  clockRoute(0);
}).addTo(mymap);


function clockRoute(givenAngle) {


  startLocation = L.latLng([55.6504670, 12.5429260]); //The start of the journey

  var lat = 55.6504670
  var lng = 12.5429260

  var api_address = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'

  $.getJSON(api_address, function(data) {

    windangle = data.wind.deg
    windspeed = data.wind.speed


    angle = givenAngle

    //Du er nået her til - evt. tjek om det er relevant at bruge angle i andre sammenhænge

    //  var length = 5000 //Distance traveled in meters

    //The following 10ish lines are defining the coordinates used to find the direction. The math behind it can be found here: http://www.movable-type.co.uk/scripts/latlong.html

    var startLatInRat = lat * Math.PI / 180
    var startLngInRat = lng * Math.PI / 180
    var angleInRat = angle * Math.PI / 180

    var radiusEarth = 6371e3; // Distance to the centre of the earth in metres
    var end_y = Math.asin(Math.sin(startLatInRat) * Math.cos(length / radiusEarth) +
      Math.cos(startLatInRat) * Math.sin(length / radiusEarth) * Math.cos(angleInRat));
    var end_x = startLngInRat + Math.atan2(Math.sin(angleInRat) * Math.sin(length / radiusEarth) * Math.cos(startLatInRat),
      Math.cos(length / radiusEarth) - Math.sin(startLatInRat) * Math.sin(end_y));
    var endLat = end_y * 180 / Math.PI
    var endLng = end_x * 180 / Math.PI

    //Here stops the coordinate definition

    //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database

    $.getJSON("http://127.0.0.1:5000/findstation?lat=" + endLat + "&lng=" + endLng, function(data) {
      var stationLat = data.geometry.coordinates[1]
      var stationLng = data.geometry.coordinates[0]

      // //The endLocation should be changed to the coordinate of the station, when those are available
      endLocation = L.latLng(stationLat, stationLng) //This line defines the location of the destination - currently it is only defined by going in the direction with the least wind. Later it is going to be replaced with the station the closest to said location

      fullRoute = [startLocation,
        endLocation
      ]
      calculateClockRoute(fullRoute);

    });
  });


}

function calculateClockRoute(array) {
  $("div.leaflet-routing-container").remove(); //Removes the previous route describtion before making a new one



  if (route) {
    mymap.removeControl(route); //This removes the old route, if a new one is created
  }

  route = L.Routing.control({
      waypoints: array,
      createMarker: function(i, start, n) { //This defines what the start, middle and end icons should look like
        var marker_icon = null
        if (i == 0) {
          // This is the first marker, indicating start
          marker_icon = startIcon
        } else if (i == n - 1) {
          //This is the last marker indicating destination
          marker_icon = destinationIcon
        } else {
          marker_icon = middleIcon
        }
        var marker = L.marker(start.latLng, {
          draggable: false,
          bounceOnAdd: false,
          bounceOnAddOptions: {
            duration: 1000,
            height: 800,
            function() {
              (bindPopup(myPopup).openOn(mymap))
            }
          },
          icon: marker_icon
        })
        return marker
      },
      router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
    })
    .on('routesfound', function(e) {
      routeCoordinates = e.routes[0].coordinates //Saves the coordinates for Later
      routeTime = e.routes[0].summary.totalTime //Saves the total time of the trip
      routeDistance = e.routes[0].summary.totalDistance //Saves the total distance

      $("div.leaflet-routing-container").remove(); //Since this is only for analysis and not for going the routes, the route insctructions are not nessercery
      energyCalculations(); //This is the function calculating the energy used on the trip
    })

  route.addTo(mymap);

}



function energyCalculations() {

  //Resets the arrays - otherwise the route would be twice as long on the second button click
  arrayDistance = [];
  arrayAngles = [];
  arrayHeight = [];
  totalEnergyArray = [];
  aeroArray = [];
  rollResArray = [];
  wheelBearingArray = [];
  potentialArray = [];
  arrayHeight = [];

  //This upcoming part of the function is changing the format of the route coordinates, so they fit with the elevationAPIs format
  var elevationRequestCoordinates = [];
  for (i = 0; i < routeCoordinates.length; i++) {
    elevationRequestCoordinates.push(routeCoordinates[i].lat)
    elevationRequestCoordinates.push(routeCoordinates[i].lng)
  }

  var elevationAPI = "http://open.mapquestapi.com/elevation/v1/profile?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&latLngCollection=" + elevationRequestCoordinates //routeCoordinates

  $.getJSON(elevationAPI, function(elevationData) {

    for (i = 0; i < routeCoordinates.length; i++) {
      arrayHeight.push(JSON.stringify(elevationData.elevationProfile[i].height))
    }


    var elevationCurve = "http://open.mapquestapi.com/elevation/v1/chart?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&width=425&height=350&latLngCollection=" + elevationRequestCoordinates



    // These are the fictive weather conditions that the energy calculations are based on

    for (i = 0; i < routeCoordinates.length - 1; i++) { //Goes through each coordinate except the last since this one has no angle and there are no distance from the last coordinate

      var cyclistAnglei = calculateAngle(routeCoordinates[i], routeCoordinates[i + 1]); //The direction of the cyclist gets calculated in every coordinate set
      var cyclistDistancei = 1000 * getDistanceFromLatLonInKm(routeCoordinates[i].lat, routeCoordinates[i].lng, routeCoordinates[i + 1].lat, routeCoordinates[i + 1].lng); //Distance between coordinate sets
      var cyclistTimei = routeTime * cyclistDistancei / (routeDistance); //Calculates the time spend between each coordinates by multiplying the total time with the percentage of the total trip for the distance between each coordinate (distance between point/total distance)

      var cyclistGradei = (arrayHeight[i + 1] - arrayHeight[i]) / (cyclistDistancei) //Grade is calculated as height difference/distance

      if (cyclistDistancei == 0) {
        cyclistGradei = 0
      } // Sometimes there are coordinates with 0 distance between eachother - this makes cyclistGradei return NaN, which breaks the rest of the calculations. Therefore we set cyclistGradei to 0 as there are no changes in the height


      //The following lines are the equations from the appendix converted to javascript
      var roadResistance = 0.0032
      var vwtan = energyCalcWindSpeed * Math.cos((cyclistAnglei - energyCalcWindAngle) * (Math.PI / 180));
      var vwnor = energyCalcWindSpeed * Math.sin((cyclistAnglei - energyCalcWindAngle) * (Math.PI / 180));
      var cyclistSpeed = routeDistance / routeTime;
      var v_a = cyclistSpeed + vwtan;
      var spokesDrag = 0.0044;
      var airDensity = 1.2234;
      var yawAngle = Math.atan(vwnor / v_a) * (180 / Math.PI);
      var cyclistDrag = dragAreaFromYaw(yawAngle);
      var cyclistMass = 90
      var kineticEnergyI = 0.14
      var kineticEnergyR = 0.311

      //Power
      var aerodynamicPower = Math.pow(v_a, 2) * cyclistSpeed * 0.5 * airDensity * (cyclistDrag + spokesDrag)
      var rollingResistancePower = cyclistSpeed * Math.cos(Math.atan(cyclistGradei)) * roadResistance * cyclistMass * 9.81
      var wheelBearingFrictionPower = cyclistSpeed * (91 + 8.7 * cyclistSpeed) * 0.001
      var potentialEnergyPower = cyclistSpeed * cyclistMass * 9.81 * Math.sin(Math.atan(cyclistGradei))
      var kineticEnergyPower = 0.5 * (cyclistMass + kineticEnergyI / Math.pow(kineticEnergyR, 2)) * 0 //This value becomes 0, and isn't included further down

      //Energy
      //Because there isn't the same distance between the sets of coordinates it is nessercery to convert the effects from before to energy using the time spend between each set of coordinates.

      var aerodynamicEnergyi = aerodynamicPower * cyclistTimei
      var rollingResistanceEnergyi = rollingResistancePower * cyclistTimei
      var wheelBearingFrictionEnergyi = wheelBearingFrictionPower * cyclistTimei
      var potentialEnergyi = potentialEnergyPower * cyclistTimei

      var energyTotali = aerodynamicEnergyi + rollingResistanceEnergyi + wheelBearingFrictionEnergyi + potentialEnergyi

      //These result then get collected in the arrays below
      totalEnergyArray.push(energyTotali)
      aeroArray.push(aerodynamicEnergyi)
      rollResArray.push(rollingResistanceEnergyi)
      wheelBearingArray.push(wheelBearingFrictionEnergyi)
      potentialArray.push(potentialEnergyi)

    }

    function getSum(total, num) { //Small function of calculate the sum of values in a array
      return total + num;
    }


    if (buttonPressed == "clock") {
      //The results then get send to the console. The " ," in the beginning is nessercery for being able to copy the values over in Excel, since copying multiple values from the console will replace the first value with "mymap.js:(number)"
      console.log(" ," + clockAngle + "," + endLocation + "," + totalEnergyArray.reduce(getSum) / routeDistance + "," + aeroArray.reduce(getSum) / routeDistance + "," + rollResArray.reduce(getSum) / routeDistance + "," + wheelBearingArray.reduce(getSum) / routeDistance + "," + potentialArray.reduce(getSum) / routeDistance);
      clockAngle += 10 //This increases the angle, so that when the function runs again it will look for results 10 degrees to the right of before
      if (clockAngle < 360) { //This checks if the clock has gone a full round. If not it will restart the function


        setTimeout(function() { //This tells the code to wait for 2 sec, before it runs again in a new direction - the routing machine sometimes had a difficult time keeping up otherwise
          clockRoute(clockAngle);
        }, 2000);

      } else {
        clockAngle = 0;
      } //This resets the clock, so the function can run again - otherwise it would run once and then stop
    } else if (buttonPressed == "bolt") {
      alert("Energy used on the trip: \n \n Total Energy: " + (totalEnergyArray.reduce(getSum) / 1000).toFixed(2) +
        " kJ \n Aerodynamic Energy: " + (aeroArray.reduce(getSum) / 1000).toFixed(2) +
        " kJ \n Rolling Resistance  Energy: " + (rollResArray.reduce(getSum) / 1000).toFixed(2) +
        " kJ \n Wheel Bearing Friction Energy: " + (wheelBearingArray.reduce(getSum) / 1000).toFixed(2) +
        " kJ \n Potential Energy: " + (potentialArray.reduce(getSum) / 1000).toFixed(2) + " kJ"
      )

    }


  }); //This is the end of the heightRequest


}

//This function calculate the angle between two coordinates
function calculateAngle(punktStart, punktSlut) {
  //https://stackoverflow.com/questions/11415106/issue-with-calcuating-compass-bearing-between-two-gps-coordinates?lq=1
  var dLon = (punktSlut.lng - punktStart.lng);
  var y = Math.sin(dLon) * Math.cos(punktSlut.lat);
  var x = Math.cos(punktStart.lat) * Math.sin(punktSlut.lat) - Math.sin(punktStart.lat) * Math.cos(punktSlut.lat) * Math.cos(dLon);
  var brng = 180 / Math.PI * (Math.atan2(y, x));
  if (brng < 0) {
    var brng360 = brng + 360
  } else brng360 = brng
  return brng360

}

//This function calculates the distance between to coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var radiusEarth = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = radiusEarth * c; // Distance in km
  return d;
}

function deg2rad(deg) { //This is a converter from degrees to rad
  return deg * (Math.PI / 180)
}

//This function converts yaw angles into drag area
function dragAreaFromYaw(yaw) {
  var positiveYaw = Math.abs(yaw) //Changes the value to a positive number. Without this we would have to make the if else code below twice as long - one for when the wind comes from the right side (positive values) and one for values on the left side (negative values)

  //These are the drag areas for the yaw angle
  var yaw0 = 0.34;
  var yaw15 = 0.36;
  var yaw30 = 0.34;
  var yaw45 = 0.28;
  var yaw60 = 0.21;
  var yaw75 = 0.13;
  var yaw90 = 0.04;

  //This is (drag per degree in that interval)*(number of degree from last known value)+(drag at last known value)
  if (positiveYaw == 0) {
    var dragArea = yaw0
  } else if (positiveYaw > 0 && positiveYaw < 15) {
    var dragArea = ((yaw15 - yaw0) / 15) * (positiveYaw - 0) + yaw0
  } else if (positiveYaw > 15 && positiveYaw < 30) {
    var dragArea = ((yaw30 - yaw15) / 15) * (positiveYaw - 15) + yaw15
  } else if (positiveYaw > 30 && positiveYaw < 45) {
    var dragArea = ((yaw45 - yaw30) / 15) * (positiveYaw - 30) + yaw30
  } else if (positiveYaw > 45 && positiveYaw < 60) {
    var dragArea = ((yaw60 - yaw45) / 15) * (positiveYaw - 45) + yaw45
  } else if (positiveYaw > 60 && positiveYaw < 75) {
    var dragArea = ((yaw75 - yaw60) / 15) * (positiveYaw - 60) + yaw60
  } else if (positiveYaw > 75 && positiveYaw < 90) {
    var dragArea = ((yaw90 - yaw75) / 15) * (positiveYaw - 75) + yaw75
  } else console.log("Yaw is too big!!!!") //This shouldn't technical be possible - so if it happens some calculates went wrong

  return dragArea
}
