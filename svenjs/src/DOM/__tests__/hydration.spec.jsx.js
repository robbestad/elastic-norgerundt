import { renderToStaticMarkup } from './../../server/renderToString';
import Component from './../../component/es2015';
import { createBlueprint } from './../../core/shapes';
import { render } from './../../DOM/rendering';
import {
	isArray,
	isStringOrNumber,
	isNullOrUndefined
} from './../../core/utils';

const Svenjs = {
	createBlueprint
};

function createContainerWithHTML(html) {
	const container = document.createElement('div');

	container.innerHTML = html;
	return container;
}

function validateNodeTree(node) {
	if (!node) {
		return true;
	}
	if (isStringOrNumber(node)) {
		return true;
	}
	if (!node.dom) {
		return false;
	}
	const children = node.children;

	if (!isNullOrUndefined(children)) {
		if (isArray(children)) {
			for (let i = 0; i < children.length; i++) {
				const val = validateNodeTree(children[i]);

				if (!val) {
					return false;
				}
			}
		} else {
			const val = validateNodeTree(children);

			if (!val) {
				return false;
			}
		}
	}
	return true;
}

function Comp1() {
	return <span>Worked!</span>;
}

function Comp2() {
	return <em>Worked 2!</em>;
}

class Comp3 extends Component {
	render() {
		return <em>Works{ ' ' }<span>again</span>!</em>;
	}
}

describe('SSR Hydration - (JSX)', () => {
	[
		{
			node: <div>Hello world</div>,
			expect1: '<div data-sjsroot="">Hello world</div>',
			expect2: '<div data-sjsroot="">Hello world</div>'
		},
		{
			node: <div>Hello world, { 'Foo!' }</div>,
			expect1: '<div data-sjsroot="">Hello world, <!---->Foo!</div>',
			expect2: '<div data-sjsroot="">Hello world, Foo!</div>'
		},
		{
			node: <div>Hello world, { [ 'Foo!', 'Bar!' ] }</div>,
			expect1: '<div data-sjsroot="">Hello world, <!---->Foo!<!---->Bar!<!--!--></div>',
			expect2: '<div data-sjsroot="">Hello world, Foo!Bar!</div>'
		},
		{
			node: <div>Hello world!{ null }</div>,
			expect1: '<div data-sjsroot="">Hello world!<!--!--></div>',
			expect2: '<div data-sjsroot="">Hello world!</div>'
		},
		{
			node: <div>Hello world, { '1' }2{ '3' }</div>,
			expect1: '<div data-sjsroot="">Hello world, <!---->1<!---->2<!---->3</div>',
			expect2: '<div data-sjsroot="">Hello world, 123</div>'
		},
		{
			node: <div id="1"><div id="2"><div id="3"></div></div></div>,
			expect1: '<div id="1" data-sjsroot=""><div id="2"><div id="3"></div></div></div>',
			expect2: '<div id="1" data-sjsroot=""><div id="2"><div id="3"></div></div></div>'
		},
		{
			node: <div><Comp1 /></div>,
			expect1: '<div data-sjsroot=""><span>Worked!</span></div>',
			expect2: '<div data-sjsroot=""><span>Worked!</span></div>'
		},
		{
			node: <div className='test'><Comp1 /></div>,
			expect1: '<div class="test" data-sjsroot=""><span>Worked!</span></div>',
			expect2: '<div class="test" data-sjsroot=""><span>Worked!</span></div>'
		},
		{
			node: <div><Comp1 /><Comp1 /><Comp1 /></div>,
			expect1: '<div data-sjsroot=""><span>Worked!</span><span>Worked!</span><span>Worked!</span></div>',
			expect2: '<div data-sjsroot=""><span>Worked!</span><span>Worked!</span><span>Worked!</span></div>'
		},
		{
			node: <div><Comp3 /></div>,
			expect1: '<div data-sjsroot=""><em>Works<!----> <span>again</span>!</em></div>',
			expect2: '<div data-sjsroot=""><em>Works <span>again</span>!</em></div>'
		}
	].forEach(({ node, expect1, expect2 }, i) => {
		it(`Validate various structures #${ (i + 1) }`, () => {
			const html = renderToStaticMarkup(node);
			const container = createContainerWithHTML(html);

			expect(container.innerHTML).to.equal(expect1);
			render(node, container);
			expect(validateNodeTree(node)).to.equal(true);
			expect(container.innerHTML).to.equal(expect2);
			render(node, container);
			expect(container.innerHTML).to.equal(expect2);
		});
	});
	[
		{
			node: <div>Hello world</div>,
			expect1: '<div data-sjsroot="">Hello world</div>',
			node2: <div>Hello world 2</div>,
			expect2: '<div data-sjsroot="">Hello world 2</div>',
			node3: <div>Hello world</div>
		},
		{
			node: <div>Hello world, { 'Foo!' }</div>,
			expect1: '<div data-sjsroot="">Hello world, Foo!</div>',
			node2: <div>{ 'Start' } Hello world, { 'Foo!' }</div>,
			expect2: '<div data-sjsroot="">Start Hello world, Foo!</div>',
			node3: <div>Hello world, { 'Foo!' }</div>
		},
		{
			node: <div>Hello world, { '1' }2{ '3' }</div>,
			expect1: '<div data-sjsroot="">Hello world, 123</div>',
			node2: <div>Hello world, { '3' }2{ '1' }</div>,
			expect2: '<div data-sjsroot="">Hello world, 321</div>',
			node3: <div>Hello world, { '1' }2{ '3' }</div>
		},
		{
			node: <div id="1"><div id="2"><div id="3"></div></div></div>,
			expect1: '<div id="1" data-sjsroot=""><div id="2"><div id="3"></div></div></div>',
			node2: <div id="3"><div id="2"><div id="1"></div></div></div>,
			expect2: '<div id="3" data-sjsroot=""><div id="2"><div id="1"></div></div></div>',
			node3: <div id="1"><div id="2"><div id="3"></div></div></div>
		},
		{
			node: <div><Comp1 /></div>,
			expect1: '<div data-sjsroot=""><span>Worked!</span></div>',
			node2: <div></div>,
			expect2: '<div data-sjsroot=""></div>',
			node3: <div><Comp1 /></div>
		},
		{
			node: <div className='test'><Comp1 /></div>,
			expect1: '<div class="test" data-sjsroot=""><span>Worked!</span></div>',
			node2: <div className='test'><Comp2 /></div>,
			expect2: '<div class="test" data-sjsroot=""><em>Worked 2!</em></div>',
			node3: <div className='test'><Comp1 /></div>
		},
		{
			node: <div><Comp1 /><Comp1 /><Comp1 /></div>,
			expect1: '<div data-sjsroot=""><span>Worked!</span><span>Worked!</span><span>Worked!</span></div>',
			node2: <div><Comp2 /><Comp2 /><Comp2 /></div>,
			expect2: '<div data-sjsroot=""><em>Worked 2!</em><em>Worked 2!</em><em>Worked 2!</em></div>',
			node3: <div><Comp1 /><Comp1 /><Comp1 /></div>
		},
		{
			node: <div><Comp3 /></div>,
			expect1: '<div data-sjsroot=""><em>Works <span>again</span>!</em></div>',
			node2: <div><Comp1 /><Comp3 /></div>,
			expect2: '<div data-sjsroot=""><span>Worked!</span><em>Works <span>again</span>!</em></div>',
			node3: <div><Comp3 /></div>
		}
	].forEach(({ node, expect1, node2, node3, expect2 }, i) => {
		it(`Update various structures #${ (i + 1) }`, () => {
			const html = renderToStaticMarkup(node);
			const container = createContainerWithHTML(html);

			render(node, container);
			expect(validateNodeTree(node)).to.equal(true);
			expect(container.innerHTML).to.equal(expect1);
			render(node2, container);
			expect(validateNodeTree(node2)).to.equal(true);
			expect(container.innerHTML).to.equal(expect2);
			render(node3, container);
			expect(validateNodeTree(node3)).to.equal(true);
			expect(container.innerHTML).to.equal(expect1);
		});
	});
});
