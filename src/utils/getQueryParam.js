//pass location.href
module.exports = function getQueryParam(param, location) {
	const locationHref = decodeURIComponent(location.href);

	const paddedParam = `${param}=`;
	const q = locationHref.substr(locationHref.indexOf(paddedParam));
	// console.log('q', q);

	const value = q.split(paddedParam);
	let result = value[1];

	if(!result){
		return;
	}
	const hasMore = result.indexOf('&');

	if (hasMore !== -1) {
		const splitQuery = result.split('&');
		result = splitQuery[0];
	}

	return result;
};

