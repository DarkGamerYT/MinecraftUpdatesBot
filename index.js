const { Client, GatewayIntentBits } = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions ] });
require( "dotenv" ).config();

const Utils = require( "./src/utils.js" );
const { version } = require( "./package.json" );
Utils.Logger.log( "Starting bot" );
Utils.Logger.log( "Version:", version );

new (require( "./src/classes/InteractionRegisterer.js" ))(client);
new (require( "./src/classes/EventsHandler.js" ))(client);

if (!fs.existsSync(path.join(__dirname, "src/data"))) fs.mkdirSync(path.join(__dirname, "src/data/"));
if (
    !fs.existsSync(path.join(__dirname, "src/data/preview-articles.json"))
    || !fs.existsSync(path.join(__dirname, "src/data/stable-articles.json"))
) {
    Utils.Logger.log( "Articles json file was not found! creating a new one." );

    (async() => {
        await (require( "./src/changelogs.js" ))();
        if (fs.existsSync(path.join(__dirname, "src/data/bds.json"))) {
            client.login( process.env.token );
        };
    })();
} else client.login( process.env.token );

if (!fs.existsSync(path.join(__dirname, "src/data/bds.json"))) {
    Utils.Logger.log( "BDS json file was not found! creating a new one." );

    (async() => {
        await (require( "./src/bds.js" ))();
        if (
            fs.existsSync(path.join(__dirname, "src/data/preview-articles.json"))
            && fs.existsSync(path.join(__dirname, "src/data/stable-articles.json"))
        ) client.login( process.env.token );
    })();
} else client.login( process.env.token );