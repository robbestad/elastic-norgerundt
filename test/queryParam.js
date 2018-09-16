const getQueryParam = require('../src/utils/getQueryParam');

var assert = require('assert');
describe('getQueryParam', function() {
	describe('q', function() {
		it('should return "asker" when location has a single query', function() {
			const location = {href: '/?q=asker'};
			assert.equal('asker', getQueryParam('q', location));
		});
		it('should return "asker" when location has more than one query', function() {
			const location = {href: '/?q=asker&hits=10'};
			assert.equal('asker', getQueryParam('q', location));
		});
		it('should return "oslo" when location has special chars', function() {
			const location = {href: 'http://localhost:1995/?q=oslo:%20Avisbudenes%20dag&page=1'};

			assert.equal('oslo: Avisbudenes dag', getQueryParam('q', location));
		});
		it('should return "asker" when location is in between other query strings', function() {
			const location = {href: '/?q=asker&hits=10'};
			assert.equal('asker', getQueryParam('q', location));
		});
	});
	describe('page', function() {
		it('should return "3" when location has a single query', function() {
			const location = {href: '/?page=3'};
			assert.equal('3', getQueryParam('page', location));
		});
		it('should return "2" when location has more than one query', function() {
			const location = {href: '/?q=asker&page=2&hits=10'};
			assert.equal('2', getQueryParam('page', location));
		});
		it('should return "1" when location is in between other query strings', function() {
			const location = {href: '/?q=asker&hits=10&page=1'};
			assert.equal('1', getQueryParam('page', location));
		});
	});

});
