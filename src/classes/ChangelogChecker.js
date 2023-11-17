const fs = require( "node:fs" );
const htmlParser = require( "node-html-parser" );
const Config = require( "../files/config.json" );
const Utils = require( "../utils.js" );
const articleSections = {
    BedrockPreview: 360001185332,
    BedrockRelease: 360001186971,
};

module.exports = class {
    /** @param { import("discord.js").Client } client */
    constructor( client ) {
        setInterval(() => {
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
                        );
                        
                        if (
                            latestBedrockPreview
                            && !bedrockPreviews.find((a) => a.article.id == latestBedrockPreview?.id)
                        ) {
                            const name = Utils.getVersion( latestBedrockPreview.name );
                            const version = Utils.getMCVersion( latestBedrockPreview.name );
                            const thumbnail = Utils.extractImage( latestBedrockPreview.body );
                            
                            Utils.Logger.release(latestBedrockPreview.updated_at, latestBedrockPreview.name);
                            createPost(
                                client, latestBedrockPreview, name,
                                version, thumbnail, Config.tags.Preview,
                                articleSections.BedrockPreview
                            );
                                
                            bedrockPreviews.push(Utils.formatArticle( latestBedrockPreview ));
                            await new Promise((res) => setTimeout( () => res(), 1500 ));
                        };

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
                        );
                            
                        if (
                            latestBedrockStable
                            && !bedrockReleases.find((a) => a.article.id == latestBedrockStable?.id)
                        ) {
                            const name = Utils.getVersion( latestBedrockPreview.name );
                            const version = Utils.getMCVersion( latestBedrockPreview.name );
                            const thumbnail = Utils.extractImage( latestBedrockStable.body );
                            const isHotfix = (
                                latestBedrockStable.body.includes( "A new update has been released to address some issues that were introduced" )
                                || latestBedrockStable.body.includes( "A new update has been released for" )
                                || (latestBedrockStable.body.includes( "A new update has been released for" ) && latestBedrockStable.body.includes( "only to address a top crash" ))
                            );

                            Utils.Logger.release(latestBedrockStable.updated_at, latestBedrockStable.name);
                            createPost(
                                client, latestBedrockStable, name,
                                version, thumbnail, Config.tags.Stable,
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
        }, Config.repeateInterval);
    };
};

/**
 * @param { import("discord.js").Client } client
 * @param {{ version: string, thumbnail: string, article: { id: number, url: string, title: string, created_at: string, updated_at: string, edited_at: string } }} article
 * @param { string } name
 * @param { string } version
 * @param { string } thumbnail
 * @param { string } tag
 * @param { number } articleSection
 * @param { boolean } isHotfix
 */
const createPost = (
    client, article, name,
    version, thumbnail, tag,
    articleSection, isHotfix = false,
) => {
    const embed = Utils.createEmbed( article, thumbnail, articleSection );
    const forumChannel = client.channels.cache.get(Config.channel);
    forumChannel.threads.create(
        {
            name: (
                name + " - "
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
            .then(() => Utils.Logger.success( "Successfully pinned the message for", article.name ))
            .catch(
                () => {
                    Utils.Logger.error( "Failed to pin the message for", article.name );
                    post.send({ content: "> Failed to pin the message :<" });
                },
            );
        
            Utils.ping( post );
            Utils.storeCheck( post, version, articleSection );
        },
    ).catch(
        (e) => {
            console.log(e);
            Utils.Logger.log( "Failed to create the forum post for", article.name + ", retrying..." );
            setTimeout(
                () => createPost(
                    client, article, name,
                    version, thumbnail, tag,
                    articleSection, isHotfix
                ), 5000,
            );
        },
    );
};