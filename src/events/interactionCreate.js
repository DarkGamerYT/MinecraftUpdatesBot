const { Events } = require( "discord.js" );
const { InteractionHandler } = require( "../classes/InteractionHandler.js" );
const interactionHandler = new InteractionHandler();
module.exports = {
	name: Events.InteractionCreate,
	once: false,

    /** @param { import("discord.js").Interaction } interaction */
	async execute( client, interaction ) {
		if (interaction.isCommand()) interactionHandler.handleSlashcommands(client, interaction);
        else if (interaction.isAutocomplete()) interactionHandler.handleAutocomplete(client, interaction);
		else if (interaction.isModalSubmit()) interactionHandler.handleModals(client, interaction);
	},
};