const getQueryParam = require('../src/utils/getQueryParam');
const getNewLocation = require('../src/utils/updateWindowLocation').getNewLocation;

var assert = require('assert');
describe('updateWindowLocation', function () {
	describe('q', function () {

		it('should return "oslo" when location has special chars', function () {
			const location = {href: 'http://localhost:1995/?q=oslo:%20Avisbudenes%20dag&page=1'};
			const currentQuery = getQueryParam('q', location);
			assert.equal('?q=oslo: Avisbudenes dag&page=1', getNewLocation(currentQuery, 1, location));
		});
	});
});
