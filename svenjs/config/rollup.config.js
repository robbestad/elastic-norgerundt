
import * as p from 'path';
import * as fs from 'fs';
import { rollup } from 'rollup';
import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import pack from '../package.json';
import commonjs from 'rollup-plugin-commonjs';

const pkg = JSON.parse(fs.readFileSync('./package.json'));
const external = Object.keys(pkg.peerDependencies || {}).concat(Object.keys(pkg.dependencies || {}));

const plugins = [
	buble({
		objectAssign: 'Object.assign'
	}),
	nodeResolve({
		jsnext: true,
		main: true,
		skip: external
	}),
	commonjs({
		include: 'node_modules/**',
		exclude: ['node_modules/symbol-observable/**', '**/*.css']
	}),
	replace({
		'process.env.NODE_ENV': JSON.stringify('production'),
		VERSION: pack.version
	})
];

if (process.env.NODE_ENV === 'production') {
	plugins.push(
		uglify({
			warnings: false,
			compress: {
				screw_ie8: true,
				dead_code: true,
				unused: true,
				drop_debugger: true, //
				booleans: true // various optimizations for boolean context, for example !!a ? b : c → a ? b : c
			},
			mangle: {
				screw_ie8: true
			}
		})
	);
}

// Filesize plugin needs to be last to report correct filesizes when minified
plugins.push(filesize());

const bundles = [
	{
		moduleGlobal: 'Svenjs',
		moduleName: 'svenjs',
		moduleEntry: 'packages/svenjs/src/index.js',
		path: 'packages/svenjs/'
	},
	{
		moduleGlobal: 'InfernoDOM',
		moduleName: 'svenjs-dom',
		moduleEntry: 'packages/svenjs-dom/src/index.js',
		path: 'packages/svenjs-dom/'
	},
	{
		moduleGlobal: 'InfernoServer',
		moduleName: 'svenjs-server',
		moduleEntry: 'packages/svenjs-server/src/index.js',
		path: 'packages/svenjs-server/'
	},
	{
		moduleGlobal: 'InfernoComponent',
		moduleName: 'svenjs-component',
		moduleEntry: 'packages/svenjs-component/src/index.js',
		path: 'packages/svenjs-component/'
	},
	{
		moduleGlobal: 'InfernoTestUtils',
		moduleName: 'svenjs-test-utils',
		moduleEntry: 'packages/svenjs-test-utils/src/index.js',
		path: 'packages/svenjs-test-utils/'
	},
	{
		moduleGlobal: 'InfernoCreateElement',
		moduleName: 'svenjs-create-element',
		moduleEntry: 'packages/svenjs-create-element/src/index.js',
		path: 'packages/svenjs-create-element/'
	},
	{
		moduleGlobal: 'InfernoCompat',
		moduleName: 'svenjs-compat',
		moduleEntry: 'packages/svenjs-compat/src/index.js',
		path: 'packages/svenjs-compat/'
	},
	{
		moduleGlobal: 'InfernoRouter',
		moduleName: 'svenjs-router',
		moduleEntry: 'packages/svenjs-router/src/index.js',
		path: 'packages/svenjs-router/'
	},
	{
		moduleGlobal: 'InfernoCreateClass',
		moduleName: 'svenjs-create-class',
		moduleEntry: 'packages/svenjs-create-class/src/index.js',
		path: 'packages/svenjs-create-class/'
	},
	{
		moduleGlobal: 'InfernoRedux',
		moduleName: 'svenjs-redux',
		moduleEntry: 'packages/svenjs-redux/src/index.js',
		path: 'packages/svenjs-redux/'
	}
];

function createBundle({moduleGlobal, moduleName, moduleEntry }, path) {
	const copyright =
		'/*!\n' +
		' * ' + moduleName + ' v' + pack.version + '\n' +
		' * (c) ' + new Date().getFullYear() + ' ' + pack.author.name + '\n' +
		' * Released under the ' + pack.license + ' License.\n' +
		' */';
	const entry = p.resolve(moduleEntry);
	const dest  = p.resolve(`${ path }${ moduleName }.${ process.env.NODE_ENV === 'production' ? 'min.js' : 'js' }`);

	const bundleConfig = {
		dest,
		format: 'umd',
		moduleName: moduleGlobal,
		globals: {
			moduleGlobal: moduleGlobal
		},
		banner: copyright,
		sourceMap: false
	};

	return rollup({entry, plugins}).then(({write}) => write(bundleConfig)).catch(err => {
		console.log(err)
	});
}

Promise.all(bundles.map(bundle => createBundle(bundle, 'packages/svenjs/dist/')));
