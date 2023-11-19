const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
module.exports = {
    disabled: false,
    data: (
        new SlashCommandBuilder()
        .setName( "changelog" )
        .setDescription( "Returns the changelog of a certain Minecraft version" )
        .addSubcommand((subcommand) => subcommand
            .setName( "stable" )
            .setDescription( "Stable changelogs!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "Minecraft Version" )
                .setRequired( true )
                .setAutocomplete(true)
            ),
        )
        .addSubcommand((subcommand) => subcommand
            .setName( "preview" )
            .setDescription( "Preview changelogs!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "Minecraft Version" )
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
        const articles = JSON.parse(
            fs.readFileSync(
                __dirname + `/../data/${ isPreview ? "preview-articles" : "stable-articles" }.json`
            )
        );
        
        const options = articles
        .filter((a) => a.version.toLowerCase().includes(focusedValue))
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
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[DEBUG] \x1B[0m- " + interaction.user.tag + " (" + interaction.user.id + ") requested the changelog for v" + version
            );

            await interaction.deferReply({ ephemeral: false });
            const articles = JSON.parse(
                fs.readFileSync(
                    __dirname + `/../data/${ isPreview ? "preview-articles" : "stable-articles" }.json`
                )
            );

            const article = articles.find((a) => a.version == version);
            if (!article) {
                interaction.editReply({ content: "> Failed to find the changelog for version: **" + version + "**." });
                return;
            };

            interaction.editReply({
                ephemeral: false,
                embeds: [
                    {
                        title: article.article.title,
                        url: article.article.url,
                        color: ( isPreview ? 16763904 : 4652839 ),
                        description: `>>> **Changelog created on**: <t:${new Date(article.article.created_at).getTime() / 1000}:f> (<t:${new Date(article.article.created_at).getTime() / 1000}:R>)`,
                        author: {
                            name: ( isPreview ? "Beta and Preview Changelogs" : "Release Changelogs" ),
                            url: (
                                isPreview
                                ? "https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs"
                                : "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs"
                            ),
                            icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
                        },
                        thumbnail: {
                            url: (
                                isPreview
                                ? "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png"
                                : "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png"
                            ),
                        },
                        image: {
                            url: article.thumbnail,
                        },
                    },
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 5,
                                label: "Changelog",
                                url: article.article.url,
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