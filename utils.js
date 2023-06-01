const htmlParser = require( "node-html-parser" );
const fs = require( "node:fs" );
const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
	JavaSnapshot: 360002267532,
	JavaRelease: 360001186971,
};

module.exports = {
    getSavedData: async ( data, articleSection, java = false ) => {
        if (!fs.existsSync( "./data" ))
            fs.mkdirSync( "./data" );
            
        if (
            !fs.existsSync(
                "./data/"
                + (
                    java
                        ? (
                            articleSection == articleSections.JavaSnapshot
                                ? "snapshot-articles"
                                : "java-stable-articles"
                        )
                        : (
                            articleSection == articleSections.BedrockPreview
                                ? "preview-articles"
                                : "stable-articles"
                        )
                )
                + ".json"
            )
        ) {
            fs.writeFile(
                "./data/"
                + (
                    java
                        ? (
                            articleSection == articleSections.JavaSnapshot
                                ? "snapshot-articles"
                                : "java-stable-articles"
                        )
                        : (
                            articleSection == articleSections.BedrockPreview
                                ? "preview-articles"
                                : "stable-articles"
                        )
                )
                + ".json", 
                JSON.stringify( data, null, 4 ), 
                () => {},
            );
            
            return data;
        } else {
            return JSON.parse(
                fs.readFileSync(
                    "./data/"
                    + (
                        java
                            ? (
                                articleSection == articleSections.JavaSnapshot
                                    ? "snapshot-articles"
                                    : "java-stable-articles"
                            )
                            : (
                                articleSection == articleSections.BedrockPreview
                                    ? "preview-articles"
                                    : "stable-articles"
                            )
                    )
                    + ".json"
                ),
            );
        };
    },
    formatArticle: ( a ) => {
        const version = a.name
            .replace( "Minecraft Beta & Preview - ", "" )
            .replace( "Minecraft - ", "" )
            .replace( " (Bedrock)", "" )
            .replace( "Minecraft: Java Edition - Snapshot ", "" )
            .replace( "Minecraft: Java Edition - ", "" );
    
        const parsed = htmlParser.parse( a.body );
        const imageSrc = parsed.getElementsByTagName( "img" )[0]?.getAttribute( "src" );
        const image = 
            imageSrc?.startsWith( "https://feedback.minecraft.net/hc/article_attachments/" )
                ? imageSrc 
                : null;
    
        return {
            version,
            thumbnail: image,
            article: {
                id: a.id,
                url: a.html_url,
                title: a.title,
                created_at: a.created_at,
                updated_at: a.updated_at,
                edited_at: a.edited_at,
            },
        };
    },
    getVersion: ( v ) => {
        return v
            .replace( "Minecraft Beta & Preview - ", "" )
            .replace( "Minecraft - ", "" )
            .replace( " (Bedrock)", "" )
            .replace( "Minecraft: Java Edition - Snapshot ", "" )
            .replace( "Minecraft: Java Edition - ", "" );
    },
    extractImage: ( body ) => {
        const parsed = htmlParser.parse( body );
        const imageSrc = parsed.getElementsByTagName( "img" )[0]?.getAttribute( "src" );
        const image = 
            imageSrc?.startsWith( "https://feedback.minecraft.net/hc/article_attachments/" )
                ? imageSrc
                : null;

        return image;
    },
    createEmbed: ( article, image, articleSection, isJava ) => {
        return {
			title: article.name,
			url: article.html_url,
			color: (
				articleSection == articleSections.BedrockPreview
                || articleSection == articleSections.JavaSnapshot
					? 16763904
					: 4652839
			),
			description: ">>> " + (
                isJava
                    ? (
                        articleSection == articleSections.JavaSnapshot
                            ? "It's that day of the week!\nA new Minecraft: Java Edition Snapshot is out now!"
                            : "A new stable release of Minecraft: Java Edition is out now!"
                    )
                    : (
                        articleSection == articleSections.BedrockPreview
                            ? "It's that day of the week!\nA new Minecraft: Bedrock Edition Preview is out now!"
                            : "A new stable release of Minecraft: Bedrock Edition is out now!"
                    )
            ),
			author: {
				name: (
                    isJava
                        ? (
                            articleSection == articleSections.JavaSnapshot
                                ? "Snapshot Changelogs"
                                : "Release Changelogs"
                        )
                        : (
                            articleSection == articleSections.BedrockPreview
                                ? "Beta and Preview Changelogs"
                                : "Release Changelogs"
                        )
                ),
				url: (
                    isJava
                        ? (
                            articleSection == articleSections.JavaSnapshot
                                ? "https://feedback.minecraft.net/hc/en-us/sections/360002267532-Snapshot-Information-and-Changelogs"
                                : "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs"
                        )
                        : (
                            articleSection == articleSections.BedrockPreview
                                ? "https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs"
                                : "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs"
                        )
                ),
				icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
			},
			thumbnail: {
				url: (
					articleSection == articleSections.BedrockPreview
                    || articleSection == articleSections.JavaSnapshot
						? "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png"
						: "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png"
				),
			},
			image: {
				url: image,
			},
			footer: {
				text: "Posted on"
			},
			timestamp: article.updated_at,
		};
    },
    ping: ( channel ) => {
        const pings = JSON.parse(fs.readFileSync( "./pings.json" ));
        channel.send(
            {
                content: (
                    pings.map(
                        (p) => "<@" + p + ">",
                    )
                    .join(", ")
                ),
            },
        )
        .then(
            (msg) => {
                console.log(
                    "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[SUCCESS] \x1B[0m- Successfully pinged Poggy!"
                );

                msg.delete()
                .then(
                    () => console.log(
                        "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[SUCCESS] \x1B[0m- SUccessfully deleted the ping message!"
                    ),
                ).catch(
                    (e) => console.log(
                        "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[31m\x1B[1m[ERROR] \x1B[0m- Failed to delete the ping message :["
                    ),
                );
            },
        ).catch(
            () => console.log(
                "\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[31m\x1B[1m[ERROR] \x1B[0m- Failed to ping Poggy :["
            ),
        );
    },
};