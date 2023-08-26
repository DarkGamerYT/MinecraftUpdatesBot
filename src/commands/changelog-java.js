const { SlashCommandBuilder } = require( "discord.js" );
const fs = require( "node:fs" );
const stableArticles = JSON.parse(fs.readFileSync( __dirname + "/../data/java-stable-articles.json" )).filter((a, index) => index < 25);
const snapshotArticles = JSON.parse(fs.readFileSync( __dirname + "/../data/snapshot-articles.json" )).filter((a, index) => index < 25);
module.exports = {
    disabled: true,
	data: (
        new SlashCommandBuilder()
		.setName( "changelog-java" )
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
            .setName( "snapshot" )
            .setDescription( "Snapshot changelogs!" )
            .addStringOption((option) => option
                .setName( "version" )
                .setDescription( "Minecraft Version" )
                .setRequired( true )
                .addChoices( ...snapshotArticles.map((a) => ({ name: a.version, value: a.version })) ),
            ),
        )
    ),

	async execute( interaction ) {
		const version = interaction.options.getString( "version" );
        const isSnapshot = ( interaction.options.getSubcommand() == "snapshot" );

        await interaction.deferReply({ ephemeral: true });
        const { article, thumbnail } = ( isSnapshot ? snapshotArticles : stableArticles ).find((a) => a.version == version);
        await interaction.editReply(
            {
                ephemeral: true,
                content: "(This command is experimental and might get removed in the future!)",
                embeds: [
                    {
                        title: article.title,
                        url: article.url,
                        color: ( isSnapshot ? 16763904 : 4652839 ),
                        description: `>>> **Changelog created on**: <t:${new Date(article.created_at).getTime() / 1000}:f> (<t:${new Date(article.created_at).getTime() / 1000}:R>)`,
                        author: {
                            name: ( isSnapshot ? "Snapshot Changelogs" : "Release Changelogs" ),
                            url: (
                                isSnapshot
                                ? "https://feedback.minecraft.net/hc/en-us/sections/360002267532-Snapshot-Information-and-Changelogs"
                                : "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs"
                            ),
                            icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
                        },
                        thumbnail: {
                            url: (
                                isSnapshot
                                ? "https://cdn.discordapp.com/attachments/1071081145149689857/1131575124630450276/Dirt.png"
                                : "https://cdn.discordapp.com/attachments/1071081145149689857/1131575124240371792/Grass.png"
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
	},
};