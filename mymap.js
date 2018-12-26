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
  layers: [osm, stations]
});

var locked = false //This variable is telling the program if it should keep looking for new destinations
var EndLocation; //This is variable containing the coordinats of the destination
var StartLocation;
var route;
var length = 5000; //This is the default distance of the trip
var reverse = false;
var routeCoordinates;
var routeTime;
var routeDistance;
var arrayDistance = [];
var arrayAngles = [];
var arrayHeight = [];
var windspeed;
var windangle;

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

function enterDistance() {
  var distance = prompt("Please enter how many kilometers you would like to cycle", "5");
  if (distance != null && isNaN(distance) == false) {
    console.log("isNaN: " + isNaN(distance))
    getRoute(StartLocation.lat, StartLocation.lng);
    length = distance * 1000
  } else if (isNaN(distance) == true) { //If there is an incorrect input then this error message is returned. It is an else if and not an else because otherwise the cancel button woundnt work
    alert("That is not a valid input")
    enterDistance();
  }
}

L.easyButton('fa-flask', function() {

  console.log("Time between coords: " + arrayDistance);
  console.log("Angles: " + arrayAngles);
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

  $.getJSON(proxy + apiLinkDS, function(data2) {
    console.log(data2.hourly.data["0"].precipProbability * 100 + "% Chance of precipitation in current hour. Intensity: " + data2.hourly.data["0"].precipIntensity + " millimeters per hour")
    console.log(data2.hourly.data["1"].precipProbability * 100 + "% Chance of precipitation in next hour. Intensity: " + data2.hourly.data["1"].precipIntensity + " millimeters per hour")
  });
}).addTo(mymap);
var slet = 0;
var testArray = [];

var aeroArray = [];
var rollResArray = [];
var wheelBearingArray = [];
var potentialArray = [];






L.easyButton('fa-bolt', function() {

  arrayDistance = []; //Resets the arrays - otherwise the route would be twice as long on the second button click
  arrayAngles = [];
  arrayHeight = [];
  //This upcoming part of the function is changing the format of the route coordinates, so, they fit with the elevationAPIs demands
    var elevationRequestCoordinates = [];
    for (i = 0; i < routeCoordinates.length; i++) {
      elevationRequestCoordinates.push(routeCoordinates[i].lat)
      elevationRequestCoordinates.push(routeCoordinates[i].lng)
    }

    var elevationAPI = "http://open.mapquestapi.com/elevation/v1/profile?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&latLngCollection=" + elevationRequestCoordinates //routeCoordinates

    $.getJSON(elevationAPI, function(elevationData) {

  // console.log(elevationAPI)
  for (i = 0; i < routeCoordinates.length; i++)
  {
arrayHeight.push(JSON.stringify(elevationData.elevationProfile[i].height))
  }


    var elevationCurve = "http://open.mapquestapi.com/elevation/v1/chart?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&width=425&height=350&latLngCollection=" + elevationRequestCoordinates


    // console.log("arrayHeight: " + arrayHeight)

// console.log("Elevation Curve: " + elevationCurve)


var apiLinkOWM = 'http://api.openweathermap.org/data/2.5/weather?lat=' + StartLocation.lat + '&lon=' + StartLocation.lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'
var proxy = 'https://cors-anywhere.herokuapp.com/';

$.getJSON(proxy + apiLinkOWM, function(data) {

var boltwindangle = 270//data.wind.deg
var boltwindspeed = 3//data.wind.speed

console.log("Windangle"+boltwindangle)


  for (i = 0; i < routeCoordinates.length - 1; i++) { //Goes through each coordinate except the last since this one has no angle and there are no distance from the last coordinate
    // arrayAngles.push(calculateAngle(routeCoordinates[i], routeCoordinates[i + 1])); //Calculating the bearing between a point and the next point on the route - for each point
    //
    // //Calculates the time spend between each coordinates by multiplying the total time with the percentage of the total trip for the distance between each coordinate (distance between point/total distance)
    // arrayDistance.push(routeTime * (getDistanceFromLatLonInKm(routeCoordinates[i].lat, routeCoordinates[i].lng, routeCoordinates[i + 1].lat, routeCoordinates[i + 1].lng) / (routeDistance / 1000)));

    //Warning: arrayDistance is about time and not distance
    var cyclistAnglei = calculateAngle(routeCoordinates[i], routeCoordinates[i + 1]);
    var cyclistDistancei = 1000*getDistanceFromLatLonInKm(routeCoordinates[i].lat, routeCoordinates[i].lng, routeCoordinates[i + 1].lat, routeCoordinates[i + 1].lng);
    var cyclistTimei = routeTime * cyclistDistancei / (routeDistance); //Calculates the time spend between each coordinates by multiplying the total time with the percentage of the total trip for the distance between each coordinate (distance between point/total distance)

    var cyclistGradei = (arrayHeight[i+1]-arrayHeight[i])/(cyclistDistancei)//Grade is calculated as height difference/distance

 if (cyclistDistancei == 0) {cyclistGradei = 0} // Sometimes there are coordinates with 0 distance between eachother - this makes cyclistGradei return NaN, which breaks the rest of the calculations. Therefore we set cyclistGradei to 0 as there are no changes in the height

// console.log("arrayHeight[i]:" + arrayHeight[i] + " arrayHeight[i+1]: " + arrayHeight[i+1])
// console.log("cyclistDistancei: " + cyclistDistancei)
    var roadResistance = 0.0032
    var vwtan = boltwindspeed * Math.cos((cyclistAnglei - boltwindangle)* (Math.PI / 180) );
    var vwnor = boltwindspeed * Math.sin((cyclistAnglei - boltwindangle)* (Math.PI / 180) );
    var cyclistSpeed =  routeDistance / routeTime;
    var Va = cyclistSpeed + vwtan;
    var spokesDrag = 0.0044;
    var airDensity = 1.2234;
    var yawAngle = Math.atan(vwnor / Va) * (180 / Math.PI);
    var cyclistDrag = dragAreaFromYaw(yawAngle);
    var cyclistMass = 90
    var kineticEnergyI = 0.14
    var kineticEnergyR = 0.311

    //Power
    var aerodynamicPower = Math.pow(Va, 2) * cyclistSpeed * 0.5 * airDensity * (cyclistDrag + spokesDrag)
    var rollingResistancePower = cyclistSpeed*Math.cos(Math.atan(cyclistGradei))*roadResistance*cyclistMass*9.81
    var wheelBearingFrictionPower = cyclistSpeed*(91+8.7*cyclistSpeed)*0.001
    var potentialEnergyPower = cyclistSpeed*cyclistMass*9.81*Math.sin(Math.atan(cyclistGradei))
    var kineticEnergyPower = 0.5*(cyclistMass+kineticEnergyI/Math.pow(kineticEnergyR, 2))*0 //Hvis vi siger at cyklisten har en konstant fart, så bliver denne værdi 0

    //Energy

    var aerodynamicEnergyi = aerodynamicPower *cyclistTimei
    var rollingResistanceEnergyi = rollingResistancePower *cyclistTimei
    var wheelBearingFrictionEnergyi = wheelBearingFrictionPower *cyclistTimei
    var potentialEnergyi = potentialEnergyPower *cyclistTimei

    var energyTotali = aerodynamicEnergyi+rollingResistanceEnergyi+wheelBearingFrictionEnergyi+potentialEnergyi

    testArray.push(energyTotali) //Slet
    aeroArray.push(aerodynamicEnergyi) //Slet
    rollResArray.push(rollingResistanceEnergyi) //Slet
    wheelBearingArray.push(wheelBearingFrictionEnergyi) //Slet
    potentialArray.push(potentialEnergyi) //Slet



    var heightStart = elevationData.elevationProfile[0].height
    var heightEnd = elevationData.elevationProfile[routeCoordinates.length-1].height

    //m*g*h
    var alternativePotentialEnergy =cyclistMass*9.82*(heightEnd-heightStart)

    if (slet == 0) {
      //
      // console.log("aerodynamicEnergyi: " + aerodynamicEnergyi)
      // console.log("rollingResistanceEnergyi: " + rollingResistanceEnergyi)
      // console.log("wheelBearingFrictionEnergyi: " + wheelBearingFrictionEnergyi)
      // console.log("potentialEnergyi: " + potentialEnergyi)


      // console.log("cyclistDrag: " + cyclistDrag)

      // console.log("cyclistDistancei: " + cyclistDistancei)
      // var bob =arrayHeight[i]-arrayHeight[i+1]
      // console.log("Height difference: " + bob)
      // console.log("cyclistGradei: " + cyclistGradei)
      // console.log("potentialEnergyi: " + potentialEnergyi)
      // console.log("potentialEnergyPower: " + potentialEnergyPower)

// console.log( i + "- vwtan: " + vwtan + " windspeed: " + windspeed + " cycangle: " + cyclistAnglei + " windangle: " + windangle)
// console.log( i + "- vwnor: " + vwnor + " yawAngle: " + yawAngle)
// console.log( i + "Va: " + Va + " cyclistSpeed: " + cyclistSpeed)

      // console.log("Va: " + Va)
      // // console.log("cyclistAnglei: " + cyclistAnglei)
      // console.log("yawAngle " + i + ": " + yawAngle)
      // console.log("cyclistSpeed: " + cyclistSpeed)
      // console.log("arrayHeight[i]: " + arrayHeight[i])

// console.log("Alternative Potential Energy: " + alternativePotentialEnergy);


    }
  }

  function getSum(total, num) { //Small function of calculate the sum of values in a array
  return total + num;
  }
    //console.log("Total Energy per streach: " + testArray);
    console.log(" ," + boltwindangle + "," + routeDistance + "," +testArray.reduce(getSum) + "," +aeroArray.reduce(getSum) + "," +rollResArray.reduce(getSum) + "," +wheelBearingArray.reduce(getSum) + "," +potentialArray.reduce(getSum));
    console.log(" ," + boltwindangle + "," + routeDistance + "," +testArray.reduce(getSum) + "," +aeroArray.reduce(getSum) + "," +rollResArray.reduce(getSum) + "," +wheelBearingArray.reduce(getSum) + "," +potentialArray.reduce(getSum));

    console.log("Angle: " + boltwindangle + " Windspeed: " + boltwindspeed)
    console.log("Routedistance: " + routeDistance)
    console.log("Total total Energy: " + testArray.reduce(getSum));
    console.log("Total total Aero: " + aeroArray.reduce(getSum));
    console.log("Total total RollRes: " + rollResArray.reduce(getSum));
    console.log("Total total WheelBearing: " + wheelBearingArray.reduce(getSum));
    console.log("Total total Potential: " + potentialArray.reduce(getSum));
    // console.log("Alternative Potential: " + alternativePotentialEnergy);


});//This is the end of windRequest
});//This is the end of the heightRequest



}).addTo(mymap);

//https://api.darksky.net/forecast/[key]/[latitude],[longitude]
//https://api.darksky.net/forecast/b843700cbe82111c47584343a224adcf/37.8267,-122.4233

L.easyButton('fa-ruler', function() {
  enterDistance();
}).addTo(mymap);

L.easyButton('fa-clock', function() {
testRoute(0);
}).addTo(mymap);
L.easyButton('fa-calculator', function() {



  var theoryWindspeed = 10// prompt("theoryWindspeed", "2");
  //https://web.archive.org/web/20131212093813/http://subsite.kk.dk/sitecore/content/Subsites/CityOfCopenhagen/SubsiteFrontpage/LivingInCopenhagen/CityAndTraffic/CityOfCyclists/CycleStatistics.aspx
  var theorycyclistSpeed = 5.5//  prompt("theoryWindspeed", "4.3");

for (i = 0; i < 36; i++) {

  var angledifference = i*10

  var vwtan = theoryWindspeed * Math.cos((angledifference)* (Math.PI / 180) );
  var vwnor = theoryWindspeed * Math.sin((angledifference)* (Math.PI / 180) );
  var Va = theorycyclistSpeed + vwtan;
  var spokesDrag = 0.0044;
  var airDensity = 1.2234;
  var yawAngle = Math.atan(vwnor / Va) * (180 / Math.PI);
console.log("yawAngle " + i*10 +": " + yawAngle)
  var cyclistDrag = dragAreaFromYaw(yawAngle);

  //Power
  var aerodynamicPower = Math.pow(Va, 2) * theorycyclistSpeed * 0.5 * airDensity * (cyclistDrag + spokesDrag)

  // console.log("Power at angle " + i*10 +": " + aerodynamicPower)
  testArray.push(yawAngle)

  }
  console.log("Windspeed: " + theoryWindspeed + " Cyclistspeed: " + theorycyclistSpeed + "Wind at different angles: " + testArray);

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

      windangle = data.wind.deg
      windspeed = data.wind.speed

      if (reverse == false) {

        var angle = 240 + 180 //The direction that the bicylclist is going to travel the opposite way of the wind
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


//remove this before the final turn in - only for testing + it doesn't work
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
          [StartLocation, EndLocation] = [EndLocation, StartLocation];
        };

        fullRoute = [StartLocation,
          EndLocation
        ]
        calculateRoute(fullRoute);

      });
    });
  } else { //If the user has decided to lock the destination this following code will run instead of the looking for a destination
    //Here the routing begins
    fullRoute = [StartLocation,
      EndLocation
    ]
    calculateRoute(fullRoute);
  }
}

function calculateRoute(array) {
  $("div.leaflet-routing-container").remove(); //Removes the previous route describtion before making a new one



  if (route) {
    mymap.removeControl(route); //This removes the old route, if a new one is created
  }

  route = L.Routing.control({
      waypoints: array,
      router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
    })
    .on('routesfound', function(e) {
      routeCoordinates = e.routes[0].coordinates //Saves the coordinates for Later
      routeTime = e.routes[0].summary.totalTime //Saves the total time of the trip
      routeDistance = e.routes[0].summary.totalDistance //Saves the total distance
    })
  route.addTo(mymap);


  // for (i = 0; i < 20; i++) {
  //   console.log("Punkt " + i + " lat: " + routePoint[i].latLng.lat + " lng: "+routePoint[i].latLng.lng);
  //   }
}

function testRoute(givenAngle){

  StartLocation = L.latLng([55.6504670, 12.5429260]); //The start of the journey

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

      //The next couple of lines are the code used to connect to server, that is attatched to the pgAdmin database

      $.getJSON("http://127.0.0.1:5000/findstation?lat=" + EndLat + "&lng=" + EndLng, function(data) {
        var stationLat = data.geometry.coordinates[1]
        var stationLng = data.geometry.coordinates[0]

        // //The EndLocation should be changed to the coordinate of the station, when those are available
        EndLocation = L.latLng(stationLat, stationLng) //This line defines the location of the destination - currently it is only defined by going in the direction with the least wind. Later it is going to be replaced with the station the closest to said location

        fullRoute = [StartLocation,
          EndLocation
        ]
        calculateTestRoute(fullRoute);

      });
    });

}

function calculateTestRoute(array) {
  $("div.leaflet-routing-container").remove(); //Removes the previous route describtion before making a new one



  if (route) {
    mymap.removeControl(route); //This removes the old route, if a new one is created
  }

  route = L.Routing.control({
      waypoints: array,
      router: new L.Routing.openrouteservice('5b3ce3597851110001cf6248cc3ff0efc5c54f8591b049453e9138cf') //This line is telling the program that it should use ORS to calculate the route. The string is our personal api_key
    })
    .on('routesfound', function(e) {
      routeCoordinates = e.routes[0].coordinates //Saves the coordinates for Later
      routeTime = e.routes[0].summary.totalTime //Saves the total time of the trip
      routeDistance = e.routes[0].summary.totalDistance //Saves the total distance
      $("div.leaflet-routing-container").remove();
      energyCalculations();
    })

  route.addTo(mymap);

}


var fakeAngle = -10 //I set this to minus 10, since I wanted it to increase the degrees, before it started the next function - i dont know i it matters
function energyCalculations(){

  arrayDistance = []; //Resets the arrays - otherwise the route would be twice as long on the second button click
  arrayAngles = [];
  arrayHeight = [];
  testArray = [];
  aeroArray = [];
  rollResArray = [];
  wheelBearingArray = [];
  potentialArray = [];
  arrayHeight = [];

  //This upcoming part of the function is changing the format of the route coordinates, so, they fit with the elevationAPIs demands
    var elevationRequestCoordinates = [];
    for (i = 0; i < routeCoordinates.length; i++) {
      elevationRequestCoordinates.push(routeCoordinates[i].lat)
      elevationRequestCoordinates.push(routeCoordinates[i].lng)
    }

    var elevationAPI = "http://open.mapquestapi.com/elevation/v1/profile?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&latLngCollection=" + elevationRequestCoordinates //routeCoordinates

    $.getJSON(elevationAPI, function(elevationData) {

  // console.log(elevationAPI)
  for (i = 0; i < routeCoordinates.length; i++)
  {
arrayHeight.push(JSON.stringify(elevationData.elevationProfile[i].height))
  }


    var elevationCurve = "http://open.mapquestapi.com/elevation/v1/chart?key=5hRZ9Xq1M67vIy42cAAsxHBepy5hBzBR&shapeFormat=raw&width=425&height=350&latLngCollection=" + elevationRequestCoordinates


    // console.log("arrayHeight: " + arrayHeight)

// console.log("Elevation Curve: " + elevationCurve)


var apiLinkOWM = 'http://api.openweathermap.org/data/2.5/weather?lat=' + StartLocation.lat + '&lon=' + StartLocation.lng + '&appid=ee67f8f53521d94193aa7d8364b7f5d9'
var proxy = 'https://cors-anywhere.herokuapp.com/';

$.getJSON(proxy + apiLinkOWM, function(data) {

var boltwindangle = 270//data.wind.deg
var boltwindspeed = 3//data.wind.speed

// console.log("Windangle"+boltwindangle)


  for (i = 0; i < routeCoordinates.length - 1; i++) { //Goes through each coordinate except the last since this one has no angle and there are no distance from the last coordinate
    // arrayAngles.push(calculateAngle(routeCoordinates[i], routeCoordinates[i + 1])); //Calculating the bearing between a point and the next point on the route - for each point
    //
    // //Calculates the time spend between each coordinates by multiplying the total time with the percentage of the total trip for the distance between each coordinate (distance between point/total distance)
    // arrayDistance.push(routeTime * (getDistanceFromLatLonInKm(routeCoordinates[i].lat, routeCoordinates[i].lng, routeCoordinates[i + 1].lat, routeCoordinates[i + 1].lng) / (routeDistance / 1000)));

    //Warning: arrayDistance is about time and not distance
    var cyclistAnglei = calculateAngle(routeCoordinates[i], routeCoordinates[i + 1]);
    var cyclistDistancei = 1000*getDistanceFromLatLonInKm(routeCoordinates[i].lat, routeCoordinates[i].lng, routeCoordinates[i + 1].lat, routeCoordinates[i + 1].lng);
    var cyclistTimei = routeTime * cyclistDistancei / (routeDistance); //Calculates the time spend between each coordinates by multiplying the total time with the percentage of the total trip for the distance between each coordinate (distance between point/total distance)

    var cyclistGradei = (arrayHeight[i+1]-arrayHeight[i])/(cyclistDistancei)//Grade is calculated as height difference/distance

 if (cyclistDistancei == 0) {cyclistGradei = 0} // Sometimes there are coordinates with 0 distance between eachother - this makes cyclistGradei return NaN, which breaks the rest of the calculations. Therefore we set cyclistGradei to 0 as there are no changes in the height

// console.log("arrayHeight[i]:" + arrayHeight[i] + " arrayHeight[i+1]: " + arrayHeight[i+1])
// console.log("cyclistDistancei: " + cyclistDistancei)
    var roadResistance = 0.0032
    var vwtan = boltwindspeed * Math.cos((cyclistAnglei - boltwindangle)* (Math.PI / 180) );
    var vwnor = boltwindspeed * Math.sin((cyclistAnglei - boltwindangle)* (Math.PI / 180) );
    var cyclistSpeed =  routeDistance / routeTime;
    var Va = cyclistSpeed + vwtan;
    var spokesDrag = 0.0044;
    var airDensity = 1.2234;
    var yawAngle = Math.atan(vwnor / Va) * (180 / Math.PI);
    var cyclistDrag = dragAreaFromYaw(yawAngle);
    var cyclistMass = 90
    var kineticEnergyI = 0.14
    var kineticEnergyR = 0.311

    //Power
    var aerodynamicPower = Math.pow(Va, 2) * cyclistSpeed * 0.5 * airDensity * (cyclistDrag + spokesDrag)
    var rollingResistancePower = cyclistSpeed*Math.cos(Math.atan(cyclistGradei))*roadResistance*cyclistMass*9.81
    var wheelBearingFrictionPower = cyclistSpeed*(91+8.7*cyclistSpeed)*0.001
    var potentialEnergyPower = cyclistSpeed*cyclistMass*9.81*Math.sin(Math.atan(cyclistGradei))
    var kineticEnergyPower = 0.5*(cyclistMass+kineticEnergyI/Math.pow(kineticEnergyR, 2))*0 //Hvis vi siger at cyklisten har en konstant fart, så bliver denne værdi 0

    //Energy

    var aerodynamicEnergyi = aerodynamicPower *cyclistTimei
    var rollingResistanceEnergyi = rollingResistancePower *cyclistTimei
    var wheelBearingFrictionEnergyi = wheelBearingFrictionPower *cyclistTimei
    var potentialEnergyi = potentialEnergyPower *cyclistTimei

    var energyTotali = aerodynamicEnergyi+rollingResistanceEnergyi+wheelBearingFrictionEnergyi+potentialEnergyi

    testArray.push(energyTotali)
    aeroArray.push(aerodynamicEnergyi)
    rollResArray.push(rollingResistanceEnergyi)
    wheelBearingArray.push(wheelBearingFrictionEnergyi)
    potentialArray.push(potentialEnergyi)

  }

  function getSum(total, num) { //Small function of calculate the sum of values in a array
  return total + num;
  }
    //console.log("Total Energy per streach: " + testArray);
    console.log(" ," + fakeAngle + "," + EndLocation + "," + routeDistance + "," +testArray.reduce(getSum) + "," +aeroArray.reduce(getSum) + "," +rollResArray.reduce(getSum) + "," +wheelBearingArray.reduce(getSum) + "," +potentialArray.reduce(getSum));

    // console.log("Angle: " + boltwindangle + " Windspeed: " + boltwindspeed)
    // console.log("Routedistance: " + routeDistance)
    // console.log("Total total Energy: " + testArray.reduce(getSum));
    // console.log("Total total Aero: " + aeroArray.reduce(getSum));
    // console.log("Total total RollRes: " + rollResArray.reduce(getSum));
    // console.log("Total total WheelBearing: " + wheelBearingArray.reduce(getSum));
    // console.log("Total total Potential: " + potentialArray.reduce(getSum));
    // console.log("Alternative Potential: " + alternativePotentialEnergy);


});//This is the end of windRequest
});//This is the end of the heightRequest
if (fakeAngle < 360){
fakeAngle += 10

setTimeout(function(){
    testRoute(fakeAngle);
}, 2000);

}
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

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

function dragAreaFromYaw(yaw) {
  var positiveYaw = Math.abs(yaw) //Changes the value to a positive number. Without this we would have to make the if else code below twice as long - one for when the wind comes from the right side (positive values) and one for values on the left side (negative values)

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
}
  else if (positiveYaw > 0 && positiveYaw < 15) {
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
} else alert("Yaw is too big!!!!")

  return dragArea
}
