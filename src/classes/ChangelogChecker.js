const fs = require( "node:fs" );
const htmlParser = require( "node-html-parser" );
const Config = require( "../files/config.json" );
const Utils = require( "../utils.js" );
const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
};

module.exports = class {
    constructor( client ) {
        setInterval(
            () => {
                fetch(
                    "https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json",
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    },
                ).then((res) => res.json())
                .then(
                    async (data) => {
                        try {
                            const latestBedrockPreview = data.articles.find((a) => a.section_id == articleSections.BedrockPreview);
                            const bedrockPreviews = await Utils.getSavedData(
                                data.articles.filter(
                                    (a) => a.section_id == articleSections.BedrockPreview
                                ).map( Utils.formatArticle ),
                                articleSections.BedrockPreview,
                                false,
                            );

                            const latestBedrockStable = data.articles.find(
                                (a) => (
                                    a.section_id == articleSections.BedrockRelease
                                    && !a.title.includes( "Java Edition" )
                                )
                            );
                            const bedrockReleases = await Utils.getSavedData(
                                data.articles.filter(
                                    (a) => a.section_id == articleSections.BedrockPreview
                                ).map( Utils.formatArticle ),
                                articleSections.BedrockRelease,
                                false,
                            );
                            
                            if (
								latestBedrockPreview
								&& !bedrockPreviews.find((a) => a.article.id == latestBedrockPreview?.id)
							) {
                                const version = Utils.getVersion( latestBedrockPreview.name );
                                const thumbnail = Utils.extractImage( latestBedrockPreview.body );
                                
                                Utils.Logger.release(latestBedrockPreview.updated_at, latestBedrockPreview.name);
                                createPost(
                                    client, latestBedrockPreview, version, 
                                    thumbnail, Config.tags.Preview,
                                    articleSections.BedrockPreview
                                );
                                
                                bedrockPreviews.push(Utils.formatArticle( latestBedrockPreview ));
                                await new Promise((res) => setTimeout( () => res(), 1500 ));
                            };
                            
                            if (
								latestBedrockStable
								&& !bedrockReleases.find((a) => a.article.id == latestBedrockStable?.id)
							) {
                                const version = Utils.getVersion( latestBedrockStable.name );
                                const thumbnail = Utils.extractImage( latestBedrockStable.body );
                                const isHotfix = latestBedrockStable.body.includes( "A new update has been released to address some issues that were introduced" );

                                Utils.Logger.release(latestBedrockStable.updated_at, latestBedrockStable.name);
                                createPost(
                                    client, latestBedrockStable, version,
                                    thumbnail, Config.tags.Stable,
                                    articleSections.BedrockRelease, isHotfix
                                );

                                bedrockReleases.push(Utils.formatArticle( latestBedrockStable ));
                                await new Promise((res) => setTimeout( () => res(), 1500 ));
                            };

                            fs.writeFileSync( __dirname + "/../data/stable-articles.json", JSON.stringify( bedrockReleases.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                            fs.writeFileSync( __dirname + "/../data/preview-articles.json", JSON.stringify( bedrockPreviews.sort((a, b) => new Date(b.article.updated_at).getTime() - new Date(a.article.updated_at).getTime()), null, 4 ) );
                        } catch(e) { console.log(e); };
                    },
                ).catch(() => {});
            }, Config.repeateInterval,
        );
    };
};

const createPost = (
    client, article, version,
    thumbnail, tag, articleSection,
    isHotfix = false,
) => {
    const embed = Utils.createEmbed( article, thumbnail, articleSection );
    const forumChannel = client.channels.cache.get(Config.channel);
    forumChannel.threads.create(
        {
            name: (
                version + " - "
                + (
                    articleSection == articleSections.BedrockPreview
                    ? "Preview"
                    : ( isHotfix ? "Hotfix" : "Stable" )
                )
            ),
            appliedTags: [ tag ],
            message: {
                embeds: [ embed ],
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
        },
    ).then(
        (post) => {
            post.messages.cache.get( post.lastMessageId ).react(
                articleSection == articleSections.BedrockPreview
                ? "🍌"
                : ( isHotfix ? "🌶" : "🍊" ),
            );

            post.messages.cache.get( post.lastMessageId ).pin()
            .then(() => Utils.Logger.success("Successfully pinned the message for", article.name))
            .catch(
                () => {
                    Utils.Logger.error("Failed to pin the message for", article.name);
                    post.send({ content: "> Failed to pin the message :<" });
                },
            );
        
            Utils.ping( post );
            Utils.storeCheck( post, version, articleSection );
        },
    ).catch(
        (e) => {
            console.log(e);
			Utils.Logger.log("Failed to create the forum post for", article.name + ", retrying...");
            setTimeout(
                () => createPost(
                    client, article, version,
                    thumbnail, tag, articleSection
                ), 5000,
            );
        },
    );
};