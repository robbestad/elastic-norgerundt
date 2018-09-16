	const Hapi = require('hapi');
const path = require('path');
const Inert = require('inert');
const curl = require('curlrequest');
const bodyParser = require('body-parser');
const Joi = require('joi');
const fetch = require('isomorphic-fetch');
const isProd = process.env.NODE_ENV === 'production';

const server = new Hapi.Server();
const PORT = process.env.PORT || 1996;
const HOST = process.env.HOST || '0.0.0.0';
server.connection({host: HOST, port: isProd ? PORT : 1995});

const index = !isProd ? './index.html' : './dist/index.html';
const plugins = [];

if (!isProd) {
	console.log('*** Adding webpack hot/dev middleware');
	plugins.push({
			register: require('hapi-webpack-dev-middleware'),
			options: {
				config: require(path.join(__dirname, 'config', 'webpack.config.js')),
				options: {
					noInfo: true
				}
			}
		},
		{
			register: require('hapi-webpack-hot-middleware')
		});
}

// static paths
server.register(Inert, () => {
	server.route({
		method: 'GET',
		path: '/assets/{param*}',
		handler: {
			directory: {
				path: !isProd ? './assets' : './dist/assets',
				redirectToSlash: true,
				index: false
			}
		}
	});
});

const getData = (input) => {
	let request;
	request = new Request('http://localhost:9200/norgerundt/_search', {
		method: 'POST',
		body: JSON.stringify({
			size: 30,
			query: {
				query_string: {
					query: input,
					default_operator: "AND"
				}
			}
		}),
		headers: new Headers({
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		})
	});

	return fetch(request)
		.then(res => res.json());
};

const getAc = (input) => {
	let val = input;
	val = val.replace(':', '\\:');
	val = val.replace('.', '\\.');
	val = val.replace(',', '\\,');

	let request;
	request = new Request('http://localhost:9200/norgerundt_autocomplete/_search', {
		method: 'POST',
		body: JSON.stringify({
			size: 5,
			query: {
				query_string: {
					query: `${val}*`,
					default_operator: "AND"
				}
			}
		}),
		headers: new Headers({
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		})
	});

	return fetch(request)
		.then(res => res.json());
};


const searchHandler = function (request, reply) {
	const input = request.payload.input;
	reply(getData(input).then(res => res));
};
const acHandler = function (request, reply) {
	const input = request.payload.input;
	reply(getAc(input).then(res => res));
};

const searchConfig = {
	handler: searchHandler,
	validate: {
		payload: {
			input: Joi.string().min(1).required()
		}
	}
};

const acConfig = {
	handler: acHandler,
	validate: {
		payload: {
			input: Joi.string().min(1).required()
		}
	}
};

if (!module.parent) {
	server.start((err) => {

		if (err) {
			throw err;
		}

		server.register(plugins, (err) => {

			if (err) {
				throw err;
			}


			server.route([
				{
					method: 'GET',
					path: '/',
					handler: function (request, reply) {
						reply.file(index);
					},
				},
				{
					method: 'POST',
					path: '/search',
					config: searchConfig
				},
				{
					method: 'POST',
					path: '/ac',
					config: acConfig
				}
			]);

		});

		console.log(`Server running at: ${server.info.uri}`);
	});
}
