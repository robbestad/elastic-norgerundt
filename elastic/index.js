'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ host: '0.0.0.0', port: 1995 });

server.start((err) => {

  if (err) {
    throw err;

  }

  server.register(require('inert'), (err) => {

    if (err) {
      throw err;
    }

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        reply.file('./public/index.html');
      }
    });
  });

  console.log(`Server running at: ${server.info.uri}`);
});
