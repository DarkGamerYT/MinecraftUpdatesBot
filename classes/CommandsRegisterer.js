const { Collection } = require( "discord.js" );
const path = require( "node:path" );
const fs = require( "node:fs" );
module.exports = class {
    constructor( client ) {
        client.commands = new Collection();

        const commandsPath = path.join( __dirname, "../commands" );
        const commandFiles = fs.readdirSync( commandsPath ).filter((file) => file.endsWith( ".js" ));
        for (const file of commandFiles) {
	        const filePath = path.join( commandsPath, file );
	        const command = require( filePath );
	        if (
                "data" in command
                && "execute" in command
            ) client.commands.set( command.data.name, command );
	        else console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[WARNING] \x1B[0m- The command at " + filePath + " is missing a required \"data\" or \"execute\" property."
            );
        };
    };
};