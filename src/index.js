const SvenDOM = require('../svenjs/packages/svenjs/dist/svenjs-dom');
const rootNode = document.getElementById('myapp');
const app = require('./app');
const {mount, dispose} = require('./render');
mount();

if (module.hot) {
	module.hot.accept(() => {
		mount();
	});
	module.hot.dispose((data) => {
		dispose();
	});
}
