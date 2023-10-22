var rj = { lat: -22.9100247, lng: -43.1981408 };
var sp = { lat: -23.5449796, lng: -46.6486327 };
var bh = { lat: -19.9025359, lng: -44.0464509 };

var map = {};
var marker = {};

var distance = {};
var infowindow = {};
var directionsService = {};
var directionsRenderer = {};

var waypoints = [];

var restaurantChkBx = document.getElementById("restaurantChkBx").checked;
var parksChkBx = document.getElementById("parksChkBx").checked;
var museumsChkBx = document.getElementById("museumsChkBx").checked;
var theatherChkBx = document.getElementById("theatherChkBx").checked;
var cinemaChkBx = document.getElementById("cinemaChkBx").checked;

const reservar = document.getElementById("reserve");
const partida = document.getElementById("selecao-estado-partida");
const destino = document.getElementById("selecao-estado-destino");

reservar.addEventListener("click", deleteAllMarkers);
partida.addEventListener("change", attOriginMap);
destino.addEventListener("change", attDestinyMap);

function initMap() {
  infowindow = new google.maps.InfoWindow();
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  map = new google.maps.Map(document.getElementById("map"), {
    center: rj,
    zoom: 13,
  });
  directionsRenderer.setMap(map);

  createRoute(partida.value, destino.value);

  setTimeout(() => {
    createMarkersAllTheWayLong();
  }, 2000);
}

function createRoute(origin, destiny) {
  const request = {
    origin: origin,
    destination: destiny,
    travelMode: "DRIVING",
  };

  directionsService.route(request, function (result, status) {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      waypoints = decode(result.routes[0].overview_polyline);

    //   const PolygonCoords = PolygonPoints();
    //   const PolygonBound = new google.maps.Polygon({
    //     paths: PolygonCoords,
    //     strokeColor: "#FF0000",
    //     strokeOpacity: 0.8,
    //     strokeWeight: 2,
    //     fillColor: "#FF0000",
    //     fillOpacity: 0.35,
    //   });

    //   PolygonBound.setMap(map);
    }
  });

  calculateDistance(origin, destiny);
}

function calculateDistance(origin, destiny) {
  distance = google.maps.geometry.spherical.computeDistanceBetween(
    getGeoLocByState(origin),
    getGeoLocByState(destiny)
  );
}

function createMarkersAllTheWayLong() {
  var markerDistance = 50000;
  var drawMarkers = true;
  var newLatLng = getGeoLocByState(partida.value);
  var endLatLng = getGeoLocByState(destino.value);

  var placesChecked = getCheckedPlaces();

  while (drawMarkers) {
    var heading = google.maps.geometry.spherical.computeHeading(
      newLatLng,
      endLatLng
    );

    findPlacesNearby(placesChecked);

    var newLatLng = google.maps.geometry.spherical.computeOffset(
      newLatLng,
      markerDistance,
      heading
    );

    var newDistance = google.maps.geometry.spherical.computeDistanceBetween(
      newLatLng,
      endLatLng
    );

    if (newDistance <= markerDistance) drawMarkers = false;
  }
}

function findPlacesNearby(places) {
  service = new google.maps.places.PlacesService(map);

  for (var j = 0; j < waypoints.length; j++) {
    var request = {
      location: new google.maps.LatLng(waypoints[j][0], waypoints[j][1]),
      radius: "200",
      type: ["restaurant"],
    };

    service.nearbySearch(request, (results, status) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < places.length; i++) {
        createPlace(results[i]);
        }
      } else {
        console.log("Erro ao buscar lugares: " + status);
      }
    });
  }
}

function getCheckedPlaces() {
  var places = [];

  if (restaurantChkBx) {
    places.push("restaurant");
  }
  if (parksChkBx) {
    places.push("park");
  }
  if (museumsChkBx) {
    places.push("museum");
  }
  if (theatherChkBx) {
    places.push("theather");
  }
  if (cinemaChkBx) {
    places.push("cinema");
  }

  return places;
}

function createMarker(position) {
  marker = new google.maps.Marker({
    position: position,
    map: map,
  });
}

function deleteAllMarkers() {
  marker.setMap(null);
}

function centerMap(state) {
  map.panTo(new google.maps.LatLng(state["lat"], state["lng"]));
}

function createPlace(place) {
  console.log("criando lugares: " + place.name);

  if (!place.geometry || !place.geometry.location) return;

  marker = new google.maps.Marker({
    map,
    title: place.name,
    position: place.geometry.location,
    fields: ["name", "geometry"],
  });

  google.maps.event.addListener(marker, "click", () => {
    infowindow.setContent(place.name || "");
    infowindow.open(map);
  });
}

function getGeoLocByState(state) {
  if (state == "sp") {
    return sp;
  } else if (state == "rj") {
    return rj;
  } else if (state == "bh") {
    return bh;
  }
}

function attOriginMap(event) {
  var origin = event.target.value;
  var destiny = destino.value;

  createRoute(origin, destiny);
}

function attDestinyMap(event) {
  var origin = partida.value;
  var destiny = event.target.value;

  createRoute(origin, destiny);
}

function PolygonArray(latitude) {
  const R = 6378137;
  const pi = 3.14;
  //distance in meters
  const upper_offset = 10000;
  const lower_offset = -10000;

  Lat_up = upper_offset / R;
  Lat_down = lower_offset / R;
  //OffsetPosition, decimal degrees
  lat_upper = latitude + (Lat_up * 180) / pi;
  lat_lower = latitude + (Lat_down * 180) / pi;

  return [lat_upper, lat_lower];
}

function PolygonPoints() {
  let polypoints = waypoints;
  let PolyLength = polypoints.length;
  let UpperBound = [];
  let LowerBound = [];

  for (let j = 0; j <= PolyLength - 1; j++) {
    let NewPoints = PolygonArray(polypoints[j][0]);
    UpperBound.push({ lat: NewPoints[0], lng: polypoints[j][1] });
    LowerBound.push({ lat: NewPoints[1], lng: polypoints[j][1] });
  }

  let reversebound = LowerBound.reverse();
  let FullPoly = UpperBound.concat(reversebound);

  return FullPoly;
}

// decode polyline from google maps

var PRECISION = 1e5;

function decode(value) {
  var points = [];
  var lat = 0;
  var lon = 0;

  var values = decode.integers(value, function (x, y) {
    lat += x;
    lon += y;
    points.push([lat / PRECISION, lon / PRECISION]);
  });

  return points;
}

decode.sign = function (value) {
  return value & 1 ? ~(value >>> 1) : value >>> 1;
};

decode.integers = function (value, callback) {
  var values = 0;
  var x = 0;
  var y = 0;

  var byte = 0;
  var current = 0;
  var bits = 0;

  for (var i = 0; i < value.length; i++) {
    byte = value.charCodeAt(i) - 63;
    current = current | ((byte & 0x1f) << bits);
    bits = bits + 5;

    if (byte < 0x20) {
      if (++values & 1) {
        x = decode.sign(current);
      } else {
        y = decode.sign(current);
        callback(x, y);
      }
      current = 0;
      bits = 0;
    }
  }

  return values;
};
