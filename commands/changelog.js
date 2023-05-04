const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
const stableArticles = JSON.parse(fs.readFileSync( "./data/stable-articles.json" )).filter((a, index) => index < 25);
const previewArticles = JSON.parse(fs.readFileSync( "./data/preview-articles.json" )).filter((a, index) => index < 25);
module.exports = {
	data: new SlashCommandBuilder()
		.setName( "changelog" )
		.setDescription( "Returns the changelog of a certain Minecraft version" )
        .addSubcommand(
            (subcommand) =>
                subcommand
                .setName( "stable" )
                .setDescription( "Stable changelogs!" )
                .addStringOption(
                    (option) =>
                        option
                        .setName( "version" )
                        .setDescription( "Minecraft Version" )
                        .setRequired(true)
                        .addChoices(
                            ...stableArticles.map(
                                (a) => (
                                    {
                                        name: a.version,
                                        value: a.version,
                                    }
                                ),
                            ),
                        )
                )
        )
        .addSubcommand(
            (subcommand) =>
                subcommand
                .setName( "preview" )
                .setDescription( "Preview changelogs!" )
                .addStringOption(
                    (option) =>
                        option
                        .setName( "version" )
                        .setDescription( "Minecraft Version" )
                        .setRequired(true)
                        .addChoices(
                            ...previewArticles.map(
                                (a) => (
                                    {
                                        name: a.version,
                                        value: a.version,
                                    }
                                ),
                            ),
                        )
                )
        ),

	async execute( interaction ) {
		const version = interaction.options.getString( "version" );
        switch(interaction.options.getSubcommand()) {
            case "stable":
                const stable = stableArticles.find(
                    (a) => a.version == version,
                );

                await interaction.reply(
                    {
                        embeds: [
                            {
                                title: stable.article.title,
                                url: stable.article.url,
                                color: 4652839,
                                description: `>>> **Released on**: <t:${new Date(stable.article.updated_at).getTime() / 1000}:f> (<t:${new Date(stable.article.updated_at).getTime() / 1000}:R>)`,
                                author: {
                                    name: "Release Changelogs",
                                    url: "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs",
                                    icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
                                },
                                thumbnail: {
                                    url: "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png",
                                },
                                image: {
                                    url: stable.thumbnail,
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
                                        url: stable.article.url,
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
            break;
            case "preview":
                const preview = previewArticles.find(
                    (a) => a.version == version,
                );

                await interaction.reply(
                    {
                        embeds: [
                            {
                                title: preview.article.title,
                                url: preview.article.url,
                                color: 16763904,
                                description: `>>> **Released on**: <t:${new Date(preview.article.updated_at).getTime() / 1000}:f> (<t:${new Date(preview.article.updated_at).getTime() / 1000}:R>)`,
                                author: {
                                    name: "Beta and Preview Changelogs",
                                    url: "https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs",
                                    icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
                                },
                                thumbnail: {
                                    url: "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png",
                                },
                                image: {
                                    url: preview.thumbnail,
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
                                        url: preview.article.url,
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
            break;
        };
	},
};