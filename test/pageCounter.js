const counter = require('../src/utils/pageCounter');

var assert = require('assert');
describe('Counter', function() {
	describe('counter()', function() {
		it('should return 0 and 2 when starting page is 1', function() {
			assert.equal(JSON.stringify({ startCount: 0, endCount: 2 }), JSON.stringify(counter(1, 3)));
		});
		it('should return 3 and 5 when starting page is 2', function() {
			assert.equal(JSON.stringify({ startCount: 3, endCount: 5 }), JSON.stringify(counter(2, 3)));
		});
		it('should return 6 and 8 when starting page is 3', function() {
			assert.equal(JSON.stringify({ startCount: 6, endCount: 8 }), JSON.stringify(counter(3, 3)));
		});
		it('should return 9 and 11 when starting page is 4', function() {
			assert.equal(JSON.stringify({ startCount: 9, endCount: 11 }), JSON.stringify(counter(4, 3)));
		});
		it('should return 12 and 14 when starting page is 5', function() {
			assert.equal(JSON.stringify({ startCount: 12, endCount: 14 }), JSON.stringify(counter(5, 3)));
		});
	});
});
