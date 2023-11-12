const { Client, GatewayIntentBits } = require( "discord.js" );
const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });
require( "dotenv" ).config();

const Utils = require( "./src/utils.js" );
const { version } = require( "./package.json" );
Utils.Logger.log( "Starting bot" );
Utils.Logger.log( "Version:", version );

new (require( "./src/classes/CommandsRegisterer.js" ))(client);
new (require( "./src/classes/EventsRegisterer.js" ))(client);

client.login( process.env.token );