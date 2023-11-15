const htmlParser = require( "node-html-parser" );
const fs = require( "node:fs" );
const articleSections = {
    BedrockPreview: 360001185332,
    BedrockRelease: 360001186971,
};

const formatDate = (d = Date.now()) => {
    const date = new Date(d);
    const [ month, day, year ] = date.toLocaleDateString().split("/");
    const time = date.toLocaleTimeString();
    return (`${year}-${month}-${day} ${time}`);
};

const Logger = {
    log: (...data) => console.log(
        "\x1B[0m[" + formatDate() + "] \x1B[33m\x1B[1m[INFO] \x1B[0m-",
        ...data,
    ),
    warn: (...data) => console.log(
        "\x1B[0m[" + formatDate() + "] \x1B[33m\x1B[1m[WARNING] \x1B[0m-",
        ...data,
    ),
    success: (...data) => console.log(
        "\x1B[0m[" + formatDate() + "] \x1B[32m\x1B[1m[SUCCESS] \x1B[0m-",
        ...data,
    ),
    release: (releaseDate, ...data) => console.log(
        "\x1B[0m[" + formatDate(releaseDate) + "] \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m-",
        ...data,
    ),
    error: (...data) => console.log(
        "\x1B[0m[" + formatDate() + "] \x1B[31m\x1B[1m[ERROR] \x1B[0m-",
        ...data,
    ),
};

const Utils = {
    getSavedData: async (
        data,
        articleSection
    ) => {
        if (!fs.existsSync( __dirname + "/data" )) {
            fs.mkdirSync( __dirname + "/data" );
        };
        
        const article = (
            articleSection == articleSections.BedrockPreview
            ? "preview-articles"
            : "stable-articles"
        );

        if (!fs.existsSync(`${__dirname}/data/${article}.json`)) {
            fs.writeFile(
                `${__dirname}/data/${article}.json`, 
                JSON.stringify( data, null, 4 ), 
                () => {},
            );
            
            return data;
        } else {
            return JSON.parse(
                fs.readFileSync(`${__dirname}/data/${article}.json`),
            );
        };
    },
    getVersion: ( v ) => (
        v.replace( "Minecraft Beta & Preview - ", "" )
        .replace( "Minecraft - ", "" )
        .replace( " (Bedrock)", "" )
    ),
    extractImage: ( body ) => {
        const parsed = htmlParser.parse( body );
        const imageSrc = parsed.getElementsByTagName( "img" )[0]?.getAttribute( "src" );
        const image = (
            imageSrc?.startsWith( "https://feedback.minecraft.net/hc/article_attachments/" )
            ? imageSrc : null
        );

        return image;
    },
    formatArticle: ( a ) => ({
        version: Utils.getVersion(a.name),
        thumbnail: Utils.extractImage(a.body),
        article: {
            id: a.id,
            url: a.html_url,
            title: a.title,
            created_at: a.created_at,
            updated_at: a.updated_at,
            edited_at: a.edited_at,
        },
    }),
    createEmbed: (
        article,
        image,
        articleSection,
    ) => {
        return {
            title: article.name,
            url: article.html_url,
            color: (
                articleSection == articleSections.BedrockPreview
                ? 16763904
                : 4652839
            ),
            description: ">>> " + (
                articleSection == articleSections.BedrockPreview
                ? "It's that day of the week!\nA new Minecraft: Bedrock Edition Preview is out now!"
                : "A new stable release of Minecraft: Bedrock Edition is out now!"
            ),
            author: {
                name: (
                    articleSection == articleSections.BedrockPreview
                    ? "Beta and Preview Changelogs"
                    : "Release Changelogs"
                ),
                url: (
                    articleSection == articleSections.BedrockPreview
                    ? "https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs"
                    : "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs"
                ),
                icon_url: "https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png",
            },
            thumbnail: {
                url: (
                    articleSection == articleSections.BedrockPreview
                    ? "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png"
                    : "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png"
                ),
            },
            image: { url: image },
            footer: { text: "Posted on" },
            timestamp: article.updated_at,
        };
    },
    ping: ( channel ) => {
        const pings = JSON.parse(fs.readFileSync( __dirname + "/files/pings.json" ));
        channel.send({ content: pings.map((p) => `<@${p}>`).join( " " ) })
        .then(
            (msg) => {
                Logger.success( "Successfully pinged everyone!" );

                msg.delete()
                .then(() => Logger.success( "Successfully deleted the ping message!" ))
                .catch(() => Logger.error( "Failed to delete the ping message :<" ));
            },
        ).catch(() => Logger.error( "Failed to send the ping message :<" ));
    },
    storeCheck: (
        post,
        version,
        articleSection,
    ) => {
        const isPreview = articleSection == articleSections.BedrockPreview;
        fetch(
            "https://store.rg-adguard.net/api/GetFiles",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: (
                    "type=PackageFamilyName&url=Microsoft."
                    + (isPreview ? "MinecraftWindowsBeta" : "MinecraftUWP" )
                    + "_8wekyb3d8bbwe&ring=RP&lang=en-US"
                ),
            },
        ).then(
            async (data) => {
                if (!data) {
                    setTimeout(() => {
                        Utils.storeCheck( post, version, articleSection )
                    }, 15000);
                    
                    return;
                };

                const text = await data.text();
                if (text.includes( "The server returned an empty list." )) {
                    setTimeout(() => {
                        Utils.storeCheck( post, version, articleSection )
                    }, 15000);
                    
                    return;
                };
                
                const parsed = htmlParser.parse( text );
                const body = (
                    parsed.getElementsByTagName("a")
                    .filter((e) => (
                        e.innerText.includes( isPreview ? "MinecraftWindowsBeta" : "MinecraftUWP" )
                        && e.innerText.includes( ".appx" )
                    ))
                )[0];
                if (
                    getStoreVersion(body.innerText, isPreview)
                    .startsWith(version)
                ) {
                    post.send({
                        content: (
                            "> **"
                            + ( isPreview ? "Minecraft Preview" : "Minecraft" ) + " v" + version
                            + "** is out now on the Microsoft Store!"
                        ),
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: "Open Microsoft Store",
                                        url: (
                                            isPreview
                                            ? "https://www.microsoft.com/store/productId/9P5X4QVLC2XR"
                                            : "https://www.microsoft.com/store/productId/9NBLGGH2JHXJ"
                                        ),
                                        emoji: {
                                            id: "1090311572024463380",
                                            name: "feedback",
                                        },
                                    },
                                ],
                            },
                        ],
                    }).then(
                        (message) => {
                            message.pin();
                            Utils.ping(post);
                            Logger.success(
                                ( isPreview ? "Minecraft Preview" : "Minecraft" )
                                + " v" + version + " is out now on the Microsoft Store!"
                            );
                            
                            Utils.bdsCheck( post, version, articleSection );
                        },
                    ).catch(
                        () => Logger.error(
                            ( isPreview ? "Minecraft Preview" : "Minecraft" )
                            + " v" + version + " is out now on the Microsoft Store but failed to send the message :<"
                        ),
                    );
                } else setTimeout(() => Utils.storeCheck( post, version, articleSection ), 15000);
            },
        ).catch(() => setTimeout(() => Utils.storeCheck( post, version, articleSection ), 15000));
    },
    bdsCheck: (
        post,
        version,
        articleSection,
    ) => {
        const isPreview = articleSection == articleSections.BedrockPreview;
        fetch(
            "https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json",
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            },
        ).then((res) => res.json())
        .then(
            async (data) => {
                const bdsVersion = isPreview ? data.linux.preview : data.linux.stable;
                if (bdsVersion.startsWith(version)) {
                    post.send({
                        content: (
                            "> Bedrock Dedicated Server for **"
                            + ( isPreview ? "Minecraft Preview" : "Minecraft" ) + " v" + version
                            + "** is out now!"
                        ),
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: "Download Bedrock Dedicated Server",
                                        url: "https://www.minecraft.net/en-us/download/server/bedrock",
                                        emoji: {
                                            id: "1090311574423609416",
                                            name: "changelog",
                                        },
                                    },
                                ],
                            },
                        ],
                    }).then(
                        (message) => {
                            message.pin();
                            Logger.success(
                                "BDS for "
                                + ( isPreview ? "Minecraft Preview" : "Minecraft" )
                                + " v" + version + " is out now!"
                            );
                        },
                    ).catch(
                        () => Logger.error(
                            "BDS for "
                            + ( isPreview ? "Minecraft Preview" : "Minecraft" )
                            + " v" + version + " is out now but failed to send the message :<"
                        ),
                    );
                } else setTimeout(() => Utils.storeCheck( post, version, articleSection ), 15000);
            },
        ).catch(() => setTimeout(() => Utils.storeCheck( post, version, articleSection ), 15000));
    },
    
    Logger,
};

const getStoreVersion = (
    text,
    isPreview = false,
) => {
    const regex = new RegExp(
        /(\d+)\.(\d+)\.(\d{2})(\d{2})/,
        "gm",
    );

    const [ , major, minor, build, beta ] = regex.exec(text);
    return (
        isPreview
        ? (`${major}.${minor}.${build}.${beta}`)
        : (`${major}.${minor}.${build}`)
    );
};

module.exports = Utils;