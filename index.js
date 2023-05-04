const { Client, GatewayIntentBits } = require( "discord.js" );
const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });
require( "dotenv" ).config();
new (require( "./classes/CommandsRegisterer.js" ))( client );
new (require( "./classes/EventsRegisterer.js" ))( client );

client.login( process.env.token );