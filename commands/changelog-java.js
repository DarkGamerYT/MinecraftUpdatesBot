const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
const stableArticles = JSON.parse(fs.readFileSync( "./data/java-stable-articles.json" )).filter((a, index) => index < 25);
const snapshotArticles = JSON.parse(fs.readFileSync( "./data/snapshot-articles.json" )).filter((a, index) => index < 25);
module.exports = {
	data: new SlashCommandBuilder()
		.setName( "changelog-java" )
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
                .setName( "snapshot" )
                .setDescription( "Snapshot changelogs!" )
                .addStringOption(
                    (option) =>
                        option
                        .setName( "version" )
                        .setDescription( "Minecraft Version" )
                        .setRequired(true)
                        .addChoices(
                            ...snapshotArticles.map(
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
            case "snapshot":
                const snapshot = snapshotArticles.find(
                    (a) => a.version == version,
                );

                await interaction.reply(
                    {
                        embeds: [
                            {
                                title: snapshot.article.title,
                                url: snapshot.article.url,
                                color: 16763904,
                                description: `>>> **Released on**: <t:${new Date(snapshot.article.updated_at).getTime() / 1000}:f> (<t:${new Date(snapshot.article.updated_at).getTime() / 1000}:R>)`,
                                author: {
                                    name: "Snapshot Changelogs",
                                    url: "https://feedback.minecraft.net/hc/en-us/sections/360002267532-Snapshot-Information-and-Changelogs",
                                    icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
                                },
                                thumbnail: {
                                    url: "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png",
                                },
                                image: {
                                    url: snapshot.thumbnail,
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
                                        url: snapshot.article.url,
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