var map;
var poly2;
var step = 5; // 5; // metres
var tick = 10; // milliseconds
var eol;
var k = 0;
var stepnum = 0;
var lastVertex = 1;
var endLocation = {}
var startLocation = {}

var directionsService = new google.maps.DirectionsService();
var bounds = new google.maps.LatLngBounds();

var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";

var icon = {
	path: car,
	scale: .7,
	strokeColor: 'white',
	strokeWeight: .10,
	fillOpacity: 1,
	fillColor: '#404040',
	offset: '0%',
	anchor: new google.maps.Point(10,25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
}; // icon of car

var locations = [{ // Location lat and lng array
	lat: 28.432287,
	lng: 77.046930
}, {
	lat: 28.437011,
	lng: 77.045957
}, {
	lat: 28.442948,
	lng: 77.038161
}, {
	lat: 28.448240,
	lng: 77.038023
}, {
	lat: 28.453622,
	lng: 77.043232
}, {
	lat: 28.463078,
	lng: 77.052115
}, {
	lat: 28.489606,
	lng: 77.080004
}, {
	lat: 28.498286,
	lng: 77.088410
}, {
	lat: 28.503162,
	lng: 77.088471
}, {
	lat: 28.506467,
	lng: 77.083922
}, {
	lat: 28.509734,
	lng: 77.079330
}]

var polyline = new google.maps.Polyline({
	path: [],
	strokeColor: '#FF0000',
	strokeWeight: 3
});

function initialize() {
	var directionsDisplay = new google.maps.DirectionsRenderer();

	var map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(28.4710105, 77.063130),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		zoom: 30
	});
	directionsDisplay.setMap(map);

	var marker, i;
	var request = {
		travelMode: google.maps.TravelMode.DRIVING
	};
	for (i = 0; i < locations.length; i++) {
		marker = new google.maps.Marker({
			position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
			map: map,
			icon : {
				path: google.maps.SymbolPath.CIRCLE,
				scale: 4
			},
		}); // Marker for location point from location array

		if(i != (locations.length - 1)){ // check if it's last point or not
			var request = {
				origin: new google.maps.LatLng(locations[i].lat, locations[i].lng),
				destination: new google.maps.LatLng(locations[i+1].lat, locations[i+1].lng),
				travelMode: google.maps.TravelMode.DRIVING
			};
			directionsService.route(request, function (response, status) { // Request to get route between two locations
				if (status == google.maps.DirectionsStatus.OK) {

					var path = new google.maps.MVCArray();
					//Set the Path Stroke Color

					var poly = new google.maps.Polyline({
						map: map,
						strokeColor: '#2e8b87'
					});
					poly.setPath(path); // Set path with color
					for (var k = 0, len = response.routes[0].overview_path.length; k < len; k++) {
						polyline.getPath().push(response.routes[0].overview_path[k]);
						path.push(response.routes[0].overview_path[k]);
						bounds.extend(response.routes[0].overview_path[k]);
						map.fitBounds(bounds);
					}
					startAnimation(); // start animating vehicle
				} else{
					console.log("Directions Service failed:" + status);
				}
			});
		}
	}

	function startAnimation() {
		eol = polyline.Distance(); // distance to travel
		// map.setCenter(polyline.getPath().getAt(0)); // 
		
		poly2 = new google.maps.Polyline({
			path: [new google.maps.LatLng(locations[0].lat, locations[0].lng)],
			strokeColor: "#0000FF",
			strokeWeight: 10
		});

		setTimeout(function(){animate(5)}, 2000); // Allow time for the initial map display
	}

	var iPan = 0;
	function animate(d) { // animate function to move car
		if (d > eol) { // check if distance is almost complete or not
			map.panTo(endLocation.latlng);
			marker.setPosition(endLocation.latlng);
			return;
		}
		var p = polyline.GetPointAtDistance(d);
		if((iPan % 1000) == 0){ // if multiple of 1000 
			map.panTo(p);
		}
		iPan++;
		var lastPosn = marker.getPosition(); // Get postion of marker
		marker.setPosition(p); // set position of marker
		var heading = google.maps.geometry.spherical.computeHeading(lastPosn, p); // get head angle of marker vehicle

		icon.rotation = heading; // Set Icon rotation
		marker.setIcon(icon); // Set updated icon
		updatePoly(d);

		timerHandle = setTimeout(function(){animate(d + step)}, 1); // call animate again
	}

	function updatePoly(d) {
		// Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
		if (poly2.getPath().getLength() > 20) {
			poly2 = new google.maps.Polyline([polyline.getPath().getAt(lastVertex - 1)]);
			// map.addOverlay(poly2)
		}

		if (polyline.GetIndexAtDistance(d) < lastVertex + 2) {
			if (poly2.getPath().getLength() > 1) {
				poly2.getPath().removeAt(poly2.getPath().getLength() - 1);
			}
			poly2.getPath().insertAt(poly2.getPath().getLength(), polyline.GetPointAtDistance(d));
		} else {
			poly2.getPath().insertAt(poly2.getPath().getLength(), endLocation.latlng);
		}
	}
}

// === first support methods that don't (yet) exist in v3
google.maps.LatLng.prototype.distanceFrom = function (newLatLng) {
	var EarthRadiusMeters = 6378137.0; // meters
	var lat1 = this.lat();
	var lon1 = this.lng();
	var lat2 = newLatLng.lat();
	var lon2 = newLatLng.lng();
	var dLat = (lat2 - lat1) * Math.PI / 180;
	var dLon = (lon2 - lon1) * Math.PI / 180;
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = EarthRadiusMeters * c;
	return d;
}

google.maps.LatLng.prototype.latRadians = function () {
	return this.lat() * Math.PI / 180;
}

google.maps.LatLng.prototype.lngRadians = function () {
	return this.lng() * Math.PI / 180;
}

// === A method which returns the length of a path in metres ===
google.maps.Polygon.prototype.Distance = function () {
	var dist = 0;
	for (var i = 1; i < this.getPath().getLength(); i++) {
		dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
	}
	return dist;
}

// === A method which returns a GLatLng of a point a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetPointAtDistance = function (metres) {
	// some awkward special cases
	if (metres == 0) return this.getPath().getAt(0);
	if (metres < 0) return null;
	if (this.getPath().getLength() < 2) return null;
	var dist = 0;
	var olddist = 0;
	for (var i = 1;
	(i < this.getPath().getLength() && dist < metres); i++) {
		olddist = dist;
		dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
	}
	if (dist < metres) {
		return null;
	}
	var p1 = this.getPath().getAt(i - 2);
	var p2 = this.getPath().getAt(i - 1);
	var m = (metres - olddist) / (dist - olddist);
	return new google.maps.LatLng(p1.lat() + (p2.lat() - p1.lat()) * m, p1.lng() + (p2.lng() - p1.lng()) * m);
}

// === A method which returns an array of GLatLngs of points a given interval along the path ===
google.maps.Polygon.prototype.GetPointsAtDistance = function (metres) {
	var next = metres;
	var points = [];
	// some awkward special cases
	if (metres <= 0) return points;
	var dist = 0;
	var olddist = 0;
	for (var i = 1;
	(i < this.getPath().getLength()); i++) {
		olddist = dist;
		dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
		while (dist > next) {
			var p1 = this.getPath().getAt(i - 1);
			var p2 = this.getPath().getAt(i);
			var m = (next - olddist) / (dist - olddist);
			points.push(new google.maps.LatLng(p1.lat() + (p2.lat() - p1.lat()) * m, p1.lng() + (p2.lng() - p1.lng()) * m));
			next += metres;
		}
	}
	return points;
}

// === A method which returns the Vertex number at a given distance along the path ===
// === Returns null if the path is shorter than the specified distance ===
google.maps.Polygon.prototype.GetIndexAtDistance = function (metres) {
	// some awkward special cases
	if (metres == 0) return this.getPath().getAt(0);
	if (metres < 0) return null;
	var dist = 0;
	var olddist = 0;
	for (var i = 1;
	(i < this.getPath().getLength() && dist < metres); i++) {
		olddist = dist;
		dist += this.getPath().getAt(i).distanceFrom(this.getPath().getAt(i - 1));
	}
	if (dist < metres) {
		return null;
	}
	return i;
}
// === Copy all the above functions to GPolyline ===
google.maps.Polyline.prototype.Distance = google.maps.Polygon.prototype.Distance;
google.maps.Polyline.prototype.GetPointAtDistance = google.maps.Polygon.prototype.GetPointAtDistance;
google.maps.Polyline.prototype.GetPointsAtDistance = google.maps.Polygon.prototype.GetPointsAtDistance;
google.maps.Polyline.prototype.GetIndexAtDistance = google.maps.Polygon.prototype.GetIndexAtDistance;

google.maps.event.addDomListener(window, "load", initialize);