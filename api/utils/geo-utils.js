const getNewLngLat = (oldLng, oldLat) => {
	const earth = 6378.137; //radius of the earth in kilometer
	const pi = Math.PI;
	const cos = Math.cos;

	const meter = Math.floor(Math.random() * (200 - 150 + 1) + 150);

	const lng_m = 1 / (((2 * pi) / 360) * earth) / 1000; //1 meter in degree for longitude

	const lat_m = 1 / (((2 * pi) / 360) * earth) / 1000; //1 meter in degree for latitude

	const new_longitude = oldLng + (meter * lng_m) / cos(oldLat * (pi / 180));

	const new_latitude = oldLat + meter * lat_m;

	return {
		lng: parseFloat(new_longitude),
		lat: parseFloat(new_latitude),
	};
};

module.exports = {
	getNewLngLat,
};
