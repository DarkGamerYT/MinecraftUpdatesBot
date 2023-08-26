const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
const stableArticles = JSON.parse(fs.readFileSync( __dirname + "/../data/stable-articles.json" )).filter((a, index) => index < 25);
const previewArticles = JSON.parse(fs.readFileSync( __dirname + "/../data/preview-articles.json" )).filter((a, index) => index < 25);
module.exports = {
    disabled: true,
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
                .addChoices( ...stableArticles.map((a) => ({ name: a.version, value: a.version })) ),
            ),
        )
        .addSubcommand((subcommand) => subcommand
            .setName( "preview" )
            .setDescription( "Preview changelogs!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "Minecraft Version" )
                .setRequired( true )
                .addChoices( ...previewArticles.map((a) => ({ name: a.version, value: a.version })) ),
            ),
        )
    ),

	async execute( interaction ) {
        try {
            const version = interaction.options.getString( "version" );
            const isPreview = ( interaction.options.getSubcommand() == "preview" );
            console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[DEBUG] \x1B[0m- " + interaction.user.tag + " (" + interaction.user.id + ") requested the changelog for the version " + version
            );

            await interaction.deferReply({ ephemeral: true });
            const { article, thumbnail } = ( isPreview ? previewArticles : stableArticles ).find((a) => a.version == version);
            await interaction.editReply(
                {
                    ephemeral: true,
                    content: "(This command is experimental and might get removed in the future!)",
                    embeds: [
                        {
                            title: article.title,
                            url: article.url,
                            color: ( isPreview ? 16763904 : 4652839 ),
                            description: `>>> **Changelog created on**: <t:${new Date(article.created_at).getTime() / 1000}:f> (<t:${new Date(article.created_at).getTime() / 1000}:R>)`,
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
                                url: thumbnail,
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
                                    url: article.url,
                                    emoji: {
                                        id: "1090311574423609416",
                                        name: "changelog",
                                    },
                                },
                            ],
                        },
                    ],
                },
            );
        } catch(e) {};
	},
};