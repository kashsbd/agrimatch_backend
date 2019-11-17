const llFromDistance = function(latitude, longitude, distance, bearing) {
	// taken from: https://stackoverflow.com/a/46410871/13549
	// distance in KM, bearing in degrees

	const R = 6378.1; // Radius of the Earth
	const brng = (bearing * Math.PI) / 180; // Convert bearing to radian
	let lat = (latitude * Math.PI) / 180; // Current coords to radians
	let lon = (longitude * Math.PI) / 180;

	// Do the math magic
	lat = Math.asin(
		Math.sin(lat) * Math.cos(distance / R) + Math.cos(lat) * Math.sin(distance / R) * Math.cos(brng),
	);

	lon += Math.atan2(
		Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat),
		Math.cos(distance / R) - Math.sin(lat) * Math.sin(lat),
	);

	// Coords back to degrees and return
	return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
};

const pointsOnMapCircle = function(latitude, longitude, distance, numPoints) {
	const points = [];
	for (let i = 0; i <= numPoints - 1; i++) {
		const bearing = Math.round((360 / numPoints) * i);
		const newPoints = llFromDistance(latitude, longitude, distance, bearing);
		points.push(newPoints);
	}
	return points;
};

exports = {
	llFromDistance,
	pointsOnMapCircle,
};
