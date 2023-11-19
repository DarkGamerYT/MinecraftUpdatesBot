const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
module.exports = {
    disabled: false,
    data: (
        new SlashCommandBuilder()
        .setName( "bds" )
        .setDescription( "Returns info about a certain BDS version" )
        .addSubcommand((subcommand) => subcommand
            .setName( "stable" )
            .setDescription( "Stable BDS!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "BDS Version" )
                .setRequired( true )
                .setAutocomplete(true)
            ),
        )
        .addSubcommand((subcommand) => subcommand
            .setName( "preview" )
            .setDescription( "Preview BDS!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "BDS Version" )
                .setRequired( true )
                .setAutocomplete(true)
            ),
        )
    ),
    /**
    * @param { import("discord.js").Client } client
    * @param { import("discord.js").Interaction } interaction
    */
    autocomplete: async ( client, interaction ) => {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const isPreview = ( interaction.options.getSubcommand() == "preview" );
        const articles = JSON.parse(fs.readFileSync(__dirname + "/../data/bds.json"));
        
        const options = articles
        .filter((a) => a.version.toLowerCase().includes(focusedValue) && a.preview == isPreview)
        .sort().filter((_, index) => index < 25);

        await interaction.respond(
            options
            .map((a) => ({ name: a.version, value: a.version }))
        ).catch(() => {});
    },
    /**
    * @param { import("discord.js").Client } client
    * @param { import("discord.js").Interaction } interaction
    */
    async execute( client, interaction ) {
        try {
            const version = interaction.options.getString( "version" );
            const isPreview = ( interaction.options.getSubcommand() == "preview" );
            console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[DEBUG] \x1B[0m- " + interaction.user.tag + " (" + interaction.user.id + ") requested bds v" + version
            );

            await interaction.deferReply({ ephemeral: false });
            const articles = JSON.parse(fs.readFileSync(__dirname + "/../data/bds.json"));

            const build = articles.find((a) => a.version == version);
            if (!build) {
                interaction.editReply({ content: "> Failed to find Bedrock Dedicated Server version: **" + version + "**." });
                return;
            };

            interaction.editReply({
                embeds: [
                    {
                        title: "BDS - " + (isPreview ? "Preview v" : "Stable v") + version,
                        url: "https://www.minecraft.net/en-us/download/server/bedrock",
                        thumbnail: {
                            url: (
                                isPreview
                                ? "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png"
                                : "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png"
                            ),
                        },
                        color: (isPreview ? 16763904 : 4652839),
                        description: `### Bedrock Dedicated Server for ${isPreview ? "Minecraft Preview" : "Minecraft"}\n- If you want to run a multiplayer server for Minecraft, start by downloading the Bedrock Deicated for either Windows or Ubuntu.`,
                        fields: [
                            {
                                name: "Build ID",
                                value: build.build_id ?? "Unknown",
                                inline: true,
                            },
                            {
                                name: "Commit Hash",
                                value: build.commit_hash ?? "Unknown",
                                inline: true,
                            },
                            {
                                name: "Released on",
                                value: `> <t:${new Date(build.date).getTime() / 1000}:f> (<t:${new Date(build.date).getTime() / 1000}:R>)`,
                                inline: false,
                            },
                        ],
                    },
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 5,
                                label: "Download Windows Build",
                                url: "https://minecraft.azureedge.net/" + (isPreview ? "bin-win-preview" : "bin-win") + "/bedrock-server-" + version + ".zip",
                                emoji: {
                                    id: "1090311574423609416",
                                    name: "changelog",
                                },
                            },
                            {
                                type: 2,
                                style: 5,
                                label: "Download Linux Build",
                                url: "https://minecraft.azureedge.net/" + (isPreview ? "bin-linux-preview" : "bin-linux") + "/bedrock-server-" + version + ".zip",
                                emoji: {
                                    id: "1090311574423609416",
                                    name: "changelog",
                                },
                            },
                        ],
                    },
                ],
            });
        } catch(e) {};
    },
};