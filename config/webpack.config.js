'use strict';

var webpack = require('webpack');
var path = require('path');
var nodeRoot = path.resolve(__dirname, "node_modules");

var plugins = [
	new webpack.DefinePlugin({
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
	})
];

var config = {
	module: {
		loaders: []
	},
	entry: [],
	options: {
		noInfo: true,
		quiet: true
	},
	output: {
		library: 'Svenjs',
		libraryTarget: 'umd'
	},
	plugins: plugins,
	resolve: {
		root: [path.resolve(__dirname, '..', 'src')]
	},
	extensions: ['.js']
};

/*** DEV **/
if (process.env.NODE_ENV !== 'production') {
	console.log('** Configuring app using webpack dev config');

	config.entry.push(
		'webpack-hot-middleware/client',
		path.join(__dirname, '..', '/src/index')
	);
	config.devTool = 'source-map';

	plugins.push(
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin(),
		new webpack.ProvidePlugin({
			'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('development')
		})
	);
	config.devtool = 'eval';
	config.output = {
		publicPath: '/',
		path: path.join(__dirname, '..'),
		filename: path.join(__dirname, '..', 'app.js')
	};

	config.module.loaders.push(
		{test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/}
	);

}

/*** PRODUCTION **/
if (process.env.NODE_ENV === 'production') {
	config.entry.push(
		path.join(__dirname, '..', '/src/index')
	);

	plugins.push(
		new webpack.optimize.UglifyJsPlugin({
			compressor: {
				screw_ie8: true,  // don't care about full compliance with Internet Explorer 6-8 quirks
				sequences: true,  // join consecutive statemets with the “comma operator”
				properties: true,  // optimize property access: a["foo"] → a.foo
				dead_code: true,  // discard unreachable code
				drop_debugger: true,  // discard “debugger” statements
				unsafe: false, // some unsafe optimizations (see below)
				conditionals: true,  // optimize if-s and conditional expressions
				comparisons: true,  // optimize comparisons
				evaluate: true,  // evaluate constant expressions
				booleans: true,  // optimize boolean expressions
				loops: true,  // optimize loops
				unused: true,  // drop unused variables/functions
				hoist_funs: true,  // hoist function declarations
				hoist_vars: false, // hoist variable declarations
				if_return: true,  // optimize if-s followed by return/continue
				join_vars: true,  // join var declarations
				cascade: true,  // try to cascade `right` into `left` in sequences
				side_effects: true,  // drop side-effect-free statements
				warnings: false,  // warn about potentially dangerous optimizations/code
				drop_console: true,  // discard console statements
			}
		})
	);

	config.output = {
		path: path.join(__dirname, '..'),
		filename: 'app.js'
	};

	config.module.loaders.push(
		{
			tests: /\.js?$/,
			loader: 'babel',
			exclude: /(node_modules)/,
			query: {
				presets: [
					'es2015',
					'stage-0'
				],
				cacheDirectory: true
			}
		},
		{
			test: /\.scss$/,
			loader: 'style!css!sass'
		}
	)
}

module.exports = config;
