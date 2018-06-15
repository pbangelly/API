require('dotenv').config()
const Painting = require('./models/Painting');
const hapi = require('hapi');
const mongoose = require('mongoose');
const {graphqlHapi, graphiqlHapi} = require ('apollo-server-hapi');
const schema = require('./graphql/schema');

/* slacker req */
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
/* end */

const server = hapi.server({
  port:4000,
  host:'localhost'
});

console.log(schema)

mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`);

mongoose.connection.once('open', ()=> {
  console.log('connected to database')
});

process.on('uncaughtException', () => {
  console.log(arguments)
})

const init = async () => {
  await server.register([
		Inert,
		Vision,
		{
			plugin: HapiSwagger,
			options: {
				info: {
					title: 'Paintings API Documentation',
					version: Pack.version
				}
			}
		}
	]);
  await server.register({
    plugin: graphqlHapi,
    options: {
      path: '/graphql',
      graphqlOptions: {
        schema,
      },
      route: {
        cors: true
      },
    },
  });
  await server.register({
    plugin: graphiqlHapi,
    options: {
      path: '/graphiql',
      graphiqlOptions: {
        endpointURL: '/graphql'
      }
    },
    route: {
      cors: true
    },
  });

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: function(request, reply){
        return `<h1>My modern API</h1>`;
      }
    },
    {
      method: 'GET',
      path: '/api/v1/paintings',
      config: {
        description: 'Get all the paintings',
        tags: ['api','v1','painting']
      },
      handler:(req, reply) => {
        return Painting.find();
      }
    },
    {
      method:'POST',
      path:'/api/v1/paintings',
      config: {
        description: 'Get a specific type painting by ID',
        tags:['api', 'v1', 'painting']
      },
      handler:(req, reply) => {
        const {name, url, technique} = req.payload;
        const painting = new Painting({
          name,
          url,
          technique
        });
        return painting.save()
      }
    }
  ]);
  await server.start();
  console.log(`server running at: ${server.info.uri}`)
};


init();