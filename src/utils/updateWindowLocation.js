const replaceQueryParam = require('./replaceQueryParam');

const getNewLocation = (query, page, location) => {
	let hrefLocation = replaceQueryParam('q', query, location);
	hrefLocation = replaceQueryParam('page', page, {href: hrefLocation});
	const splitHttp = hrefLocation.split('/?');

	console.log('split',splitHttp)
	let l = hrefLocation;
	if (splitHttp.length > 0) {
		l = `?${splitHttp[1]}`;
	}
	return l;
};

const updateWindowLocation = (query, page, location) => {
	const l = getNewLocation(query, page, location);

	if (history.pushState) {
		history.pushState(null, null, l);
	}
	else {
		window.location.href = l;
	}
	window.scrollTo(0, 0);
};

module.exports = {
	getNewLocation,
	updateWindowLocation
};
