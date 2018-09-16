const Component = require('../svenjs/packages/svenjs/dist/svenjs-component');
const t = require('../svenjs/packages/svenjs/dist/svenjs-create-element');
const searchBox = require('./searchbox');

class App extends Component {
	render() {
		return searchBox
	}
}
module.exports = t(App);
