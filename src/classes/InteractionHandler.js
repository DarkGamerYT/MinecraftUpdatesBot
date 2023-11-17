class InteractionHandler {
    /**
     * @param { import("discord.js").Client } client
     * @param { import("discord.js").Interaction } interaction
     */
    handleSlashcommands = async (client, interaction) => {
        const command = interaction.client.commands.get( interaction.commandName );
        if (!command) return;

        try {
            await command.execute( client, interaction );
        } catch (error) {
            console.error( error );
            if (
                interaction.replied
                || interaction.deferred
            ) await interaction.followUp({
                    content: "There was an error while executing this command!",
                    ephemeral: true,
            }); else await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        };
    };

    /**
     * @param { import("discord.js").Client } client
     * @param { import("discord.js").Interaction } interaction
     */
    handleAutocomplete = async (client, interaction) => {
        const command = interaction.client.commands.get( interaction.commandName );
        if (!command) return;

        try {
            await command.autocomplete( client, interaction );
        } catch (error) {
            console.error( error );
        };
    };
};

module.exports = { InteractionHandler };