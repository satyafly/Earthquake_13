// Earthquake data link
var earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

// Tectonic plates link
var tectonicplatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Perform a GET request to the Earthquake query URL
d3.json(earthquakeUrl, function(data) {
    // Once we get a response, send the data.features object to the createFeatures function
    createFeatures(data.features);
});

function createFeatures(earthquakeData) {       

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJson(earthquakeData, {
    onEachFeature: function (feature, layer){
      layer.bindPopup("<h3>" + feature.properties.place + "<br> Magnitude: " + feature.properties.mag +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
    },
    pointToLayer: function (feature, latlng) {
      return new L.circle(latlng,
        {radius: getRadius(feature.properties.mag),
          fillColor: getColor(feature.properties.mag),
          fillOpacity: .7,
          stroke: true,
          color: "black",
          weight: .5
      })
    }
  });

  // Sending earthquakes layer to the createMap function
  createMap(earthquakes)
}

function createMap(earthquakes) {

  // Define map layers
  var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/ronamadthis/cjerokiofc9fy2sqn2aikyps9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm9uYW1hZHRoaXMiLCJhIjoiY2plajZjM2VyMTFrNTMzbW94aTNrMXZnMiJ9.SDC3TUvl7vNJrLvVCB6zVw");

  var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/ruchichandra/cjc2vqswz0efp2rpfjnhunj68/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVjaGljaGFuZHJhIiwiYSI6ImNqYzJ2dXlvcDA2a2gycW4zb2RkOXpmZjgifQ.EABSXTlj3gpJcvk8zJL2DQ");

  var lightMap = L.tileLayer("https://api.mapbox.com/styles/v1/ruchichandra/cjc2wvic01j3l2rpbfsypf8qk/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVjaGljaGFuZHJhIiwiYSI6ImNqYzJ2dXlvcDA2a2gycW4zb2RkOXpmZjgifQ.EABSXTlj3gpJcvk8zJL2DQ");

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite Map": satelliteMap,
    "Outdoors Map": outdoorsMap,
    "Light Map": lightMap
  };

  // Add a tectonic plate layer
  var tectonicPlates = new L.LayerGroup();

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Tectonic Plates": tectonicPlates
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [31.7, -7.09],
    zoom: 2.5,
    layers: [lightMap, earthquakes, tectonicPlates]
  });

   // Add Fault lines data
   d3.json(tectonicplatesUrl, function(plateData) {
     // Adding our geoJSON data, along with style information, to the tectonicplates
     // layer.
     L.geoJson(plateData, {
       color: "brown",
       weight: 2
     })
     .addTo(tectonicPlates);
   });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Create legend
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (myMap) {
    var div = L.DomUtil.create('div', 'info legend'),
              grades = [0, 1, 2, 3, 4, 5],
              labels = [];

  // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
  };

  legend.addTo(myMap);
  // Adding timeline & timeline control
  d3.json(earthquakeUrl,function(data){
        var getInterval = function(quake) {
          // earthquake data only has a time, so we'll use that as a "start"
          // and the "end" will be that + some value based on magnitude
          // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
          // map for 150 minutes or 2.5 hours
          return {
            start: quake.properties.time,
            end:   quake.properties.time + quake.properties.mag * 1800000
          };
        };
        var timelineControl = L.timelineSliderControl({
          formatOutput: function(date) {
            return new Date(date).toString();
          }
        });
        var timeline = L.timeline(data, {
          getInterval: getInterval,
          pointToLayer: function(data, latlng){
            var hue_min = 120;
            var hue_max = 0;
            var hue = data.properties.mag / 10 * (hue_max - hue_min) + hue_min;
            return L.circleMarker(latlng, {
              radius: data.properties.mag * 3,
              color: "hsl("+hue+", 100%, 50%)",
              fillColor: "hsl("+hue+", 100%, 50%)"
            }).bindPopup('<a href="'+data.properties.url+'">click for more info</a>');
          }
        });
        timelineControl.addTo(myMap);
        timelineControl.addTimelines(timeline);
        timeline.addTo(myMap);
  });
};

function getColor(d) {
  return d > 5 ? 'red' :
  d > 4  ? 'orange' :
  d > 3  ? 'gold' :
  d > 2  ? 'yellow' :
  d > 1  ? 'yellowgreen' :
            'green';
}

function getRadius(value){
  return value*80000 
}