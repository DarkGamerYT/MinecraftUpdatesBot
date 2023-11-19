const { REST, Routes } = require( "discord.js" );
const fs = require( "node:fs" );
const path = require( "node:path" );
require( "dotenv" ).config();

const Utils = require( "./src/utils.js" );
const Config = require( "./src/files/config.json" );

const commands = [];
const foldersPath = path.join( __dirname, "/src/commands" );
const commandFolders = fs.readdirSync( foldersPath );
for (const folder of commandFolders) {
	const commandsPath = path.join( foldersPath, folder );
	const command = require( commandsPath );
	if (
		"data" in command
		&& "execute" in command
	) {
		if(!command.disabled)
			commands.push(command.data.toJSON());
	} else Utils.Logger.warn(
		"The command at " + folder + " is missing a required \"data\" or \"execute\" property."
	);
};

const rest = new REST().setToken( process.env.token );
(async () => {
	try {
		Utils.Logger.log( "Started refreshing " + commands.length + " application (/) commands." );
		const data = await rest.put(
			Routes.applicationCommands( Config.clientId ),
			//Routes.applicationGuildCommands( Config.clientId, Config.guildId ),
			{ body: commands },
		);

		Utils.Logger.success( "Successfully reloaded " + commands.length + " application (/) commands." );
	} catch (error) { console.error(error); };
})();