/*!
 * svenjs-test-utils v2.0.0
 * (c) 2016 Sven A Robbestad
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.InfernoTestUtils = factory());
}(this, (function () { 'use strict';

function shallowRender() {

}

function deepRender() {

}

function renderIntoDocument() {

}

var index = {
	shallowRender: shallowRender,
	deepRender: deepRender,
	renderIntoDocument: renderIntoDocument
	// Simulate
};

return index;

})));
