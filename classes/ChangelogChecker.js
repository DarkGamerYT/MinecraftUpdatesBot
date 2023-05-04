const fs = require( "node:fs" );
const request = require( "request" );
const Config = require( "../config.json" );
const Utils = require( "../utils.js" );
const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
    JavaSnapshot: 360002267532,
	JavaRelease: 360001186971,
};

module.exports = class {
    constructor( client ) {
        setInterval(
            () => {
                request(
                    {
                        url: "https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json",
                        method: "GET",
                    },
                    async ( error, res, body ) => {
                        if (error) return;
                        try {
                            const data = JSON.parse( body );

                            const latestBedrockPreview = data.articles.find((a) => a.section_id == articleSections.BedrockPreview);
                            const bedrockPreviews = await Utils.getSavedData(
                                data.articles.filter(
                                    (a) => a.section_id == articleSections.BedrockPreview
                                ).map( Utils.formatArticle ),
                                articleSections.BedrockPreview,
                                false,
                            );

                            const latestBedrockStable = data.articles.find(
                                (a) => 
                                    a.section_id == articleSections.BedrockRelease
                                    && !a.title.includes( "Java Edition" )
                            );
                            const bedrockReleases = await Utils.getSavedData(
                                data.articles.filter((a) => a.section_id == articleSections.BedrockPreview).map( Utils.formatArticle ),
                                articleSections.BedrockRelease,
                                false,
                            );

                            const latestJavaStable = data.articles.find(
                                (a) => 
                                    a.section_id == articleSections.JavaRelease
                                    && a.title.includes( "Java Edition" )
                            );
                            const javaReleases = await Utils.getSavedData(
                                data.articles.filter(
                                    (a) => a.section_id == articleSections.JavaRelease
                                    && a.title.includes( "Java Edition" )
                                ).map( Utils.formatArticle ),
                                articleSections.JavaRelease,
                                true,
                            );

                            const latestJavaSnapshot = data.articles.find((a) => a.section_id == articleSections.JavaSnapshot);
                            const javaSnapshots = await Utils.getSavedData(
                                data.articles.filter((a) => a.section_id == articleSections.JavaSnapshot).map( Utils.formatArticle ),
                                articleSections.JavaSnapshot,
                                true,
                            );
                            
                            if (!bedrockPreviews.find((a) => a.article.id == latestBedrockPreview?.id)) {
                                const version = Utils.getVersion( latestBedrockPreview.name );
                                const thumbnail = Utils.extractImage( latestBedrockPreview.body );
                                
                                createPost( client, latestBedrockPreview, version, thumbnail, Config.tags.Preview, articleSections.BedrockPreview, false );
                                console.log(
                                    "\n\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ", latestBedrockPreview.name
                                );

                                bedrockPreviews.push(Utils.formatArticle( latestBedrockPreview ));
                            } else if (!bedrockReleases.find((a) => a.article.id == latestBedrockStable?.id)) {
                                const version = Utils.getVersion( latestBedrockStable.name );
                                const thumbnail = Utils.extractImage( latestBedrockStable.body );
                                        
                                createPost( client, latestBedrockStable, version, thumbnail, Config.tags.Stable, articleSections.BedrockRelease, false );
                                console.log(
                                    "\n\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ", latestBedrockStable.name
                                );

                                bedrockReleases.push(Utils.formatArticle( latestBedrockStable ));
                            } else if (!javaSnapshots.find((a) => a.article.id == latestJavaSnapshot?.id)) {
                                const version = Utils.getVersion( latestJavaSnapshot.name );
                                const thumbnail = Utils.extractImage( latestJavaSnapshot.body );
                                
                                createPost( client, latestJavaSnapshot, version, thumbnail, Config.tags.Preview, articleSections.JavaSnapshot, true );
                                console.log(
                                    "\n\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ", latestJavaSnapshot.name
                                );
                                
                                javaSnapshots.push(Utils.formatArticle( latestJavaSnapshot ));
                            } else if (!javaReleases.find((a) => a.article.id == latestJavaStable?.id)) {
                                const version = Utils.getVersion( latestJavaStable.name );
                                const thumbnail = Utils.extractImage( latestJavaStable.body );
                                        
                                createPost( client, latestJavaStable, version, thumbnail, Config.tags.Stable, articleSections.JavaRelease, true );
                                console.log(
                                    "\n\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ", latestJavaStable.name
                                );
                                
                                javaReleases.push(Utils.formatArticle( latestJavaStable ));
                            };

                            fs.writeFileSync( "./data/stable-articles.json", JSON.stringify( bedrockReleases.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                            fs.writeFileSync( "./data/preview-articles.json", JSON.stringify( bedrockPreviews.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                            fs.writeFileSync( "./data/java-stable-articles.json", JSON.stringify( javaReleases.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                            fs.writeFileSync( "./data/snapshot-articles.json", JSON.stringify( javaSnapshots.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                        } catch(e) {
                            console.log(e);
                        };
                    },
                );
            },
            Config.repeateInterval,
        );
    };
};

const createPost = async (
    client,
    article,
    version,
    thumbnail,
    tag,
    articleSection,
    isJava = false
) => {
    if (
        (
            Config.bedrockDisabled
            && !isJava
        )
        || (
            Config.javaDisabled
            && isJava
        )
    ) return;

    const embed = Utils.createEmbed( article, thumbnail, articleSection, isJava );
    const forumChannel = client.channels.cache.get( !isJava ? Config.forums.bedrock : Config.forums.java );
    const post = await forumChannel.threads.create(
        {
            name: (
                version
                + " - "
                + (
                    isJava
                        ? (
                            articleSection == articleSections.JavaSnapshot
                                ? "Snapshot"
                                : "Release (Java)"
                        )
                        : (
                            articleSection == articleSections.BedrockPreview
                                ? "Preview"
                                : "Stable"
                        )
                )
            ),
            message: {
                embeds: [
                    embed,
                ],
                components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								style: 5,
								label: "Changelog",
								url: article.html_url,
								emoji: {
									id: "1090311574423609416",
									name: "changelog",
								},
							},
							{
								type: 2,
								style: 5,
								label: "Feedback",
								url: "https://feedback.minecraft.net/",
								emoji: {
									id: "1090311572024463380",
									name: "feedback",
								},
							},
						],
					},
				],
            },
            appliedTags: [ tag ],
        },
    );
    
    await post.messages.cache.get( post.lastMessageId ).pin();
};