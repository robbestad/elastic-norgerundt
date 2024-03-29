import Component from '../component/es2015';
import { isArray, isNull } from '../core/utils';
import { exec, convertToHashbang, pathRankSort } from './utils';
import { createVNode } from '../core/shapes';

export default class Router extends Component {
	constructor(props, context) {
		super(props, context);
		if (!props.history) {
			throw new Error('Svenjs Error: "svenjs-router" Router components require a "history" prop passed.');
		}
		this._didRoute = false;
		this.state = {
			url: props.url || props.history.getCurrentUrl()
		};
	}

	getChildContext() {
		return {
			history: this.props.history,
			hashbang: this.props.hashbang
		};
	}

	componentWillMount() {
		this.props.history.addRouter(this);
	}

	componentWillUnmount() {
		this.props.history.removeRouter(this);
	}

	handleRoutes(routes, url, hashbang, wrapperComponent, lastPath) {
		routes.sort(pathRankSort);

		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];
			const { path } = route.attrs;
			const fullPath = lastPath + path;
			const params = exec(hashbang ? convertToHashbang(url) : url, fullPath);
			const children = toArray(route.children);

			if (children) {
				const subRoute = this.handleRoutes(children, url, hashbang, wrapperComponent, fullPath);

				if (!isNull(subRoute)) {
					return subRoute;
				}
			}
			if (params) {
				if (wrapperComponent) {
					return createVNode().setTag(wrapperComponent).setChildren(route).setAttrs({
						params
					});
				}
				return route.setAttrs(Object.assign({}, { params }, route.attrs));
			}
		}
		if (!lastPath && wrapperComponent) {
			this._didRoute = true;
			return createVNode().setTag(wrapperComponent);
		}
		return null;
	}

	routeTo(url) {
		this._didRoute = false;
		this.setState({ url });
		return this._didRoute;
	}

	render() {
		const children = toArray(this.props.children);
		const url = this.props.url || this.state.url;
		const wrapperComponent = this.props.component;
		const hashbang = this.props.hashbang;

		return this.handleRoutes(children, url, hashbang, wrapperComponent, '');
	}
}

function toArray(children) {
	return isArray(children) ? children : (children ? [children] : children);
}
