const SvenDOM = require('../svenjs/packages/svenjs/dist/svenjs-dom');
const rootNode = document.querySelector('.site-content');
const app = require('./app');

exports.mount = () => SvenDOM.render(
	app,
	rootNode
);

exports.dispose = () => SvenDOM.unmount(
	app, rootNode
);
