//pass location.href
module.exports = function replaceQueryParams(param, value, location) {
	const locationHref = decodeURIComponent(location.href);

	if (locationHref.indexOf('?') === -1) {
		return `${locationHref}?${param}=${value}`
	} else {
		if (locationHref.indexOf(param) === -1) {
			return `${locationHref}&${param}=${value}`
		} else {
			switch (param) {
				case "page":
					return locationHref.replace(/page=(\d*)/, `${param}=${value}`);
				case "q":
					if (locationHref.match(/q=\w.*?($|&)/)[1] === "&") {
						return locationHref.replace(/q=\w.*?($|&)/, `${param}=${value}&`);
					}
					return locationHref.replace(/q=\w.*?($|&)/, `${param}=${value}`);
			}
		}
	}
};
