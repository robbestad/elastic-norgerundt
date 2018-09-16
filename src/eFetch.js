module.exports = function (input, endpoint='/search') {
	if (input.length < 2) {
		return Promise.resolve({hits: []});
	}
	const request = new Request(endpoint, {
		method: 'POST',
		body: JSON.stringify({
			input
		}),
		headers: new Headers({
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		})
	});
	return fetch(request)
		.then(res => res.json())
};
