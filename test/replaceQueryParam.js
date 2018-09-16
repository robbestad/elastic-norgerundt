const replaceQueryParam = require('../src/utils/replaceQueryParam');
var assert = require('assert');
describe('replaceQueryParam', function () {
	describe('q', function () {
		it('should return "page=2" when location has a single query', function () {
			const location = {href: '/?page=1'};
			assert.equal('/?page=2', replaceQueryParam('page', '2', location));
		});
		it('should return "page=5" when location has multiple queries', function () {
			const location = {href: '/?page=1&q=test'};
			assert.equal('/?page=5&q=test', replaceQueryParam('page', '5', location));
		});
		it('should return "page=5&q=oslo" when location has two queries', function () {
			const location = {href: '/?page=5&q=test'};
			assert.equal('/?page=5&q=oslo', replaceQueryParam('q', 'oslo', location));
		});
		it('should return query with norwegian characters', function () {
			const location = {href: 'http://localhost:1995/?page=5&q=oslo&test=query'};
			assert.equal('http://localhost:1995/?page=5&q=søster&test=query', replaceQueryParam('q', 'søster', location));
		});
	});
});
