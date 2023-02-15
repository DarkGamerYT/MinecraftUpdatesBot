const axios = require("axios");
const request = require("request");
const fs = require("fs");
const htmlParser = require("node-html-parser");
const Config = require("./config.json");
require("dotenv").config();

const repeateInterval = 15000;
const articleSections = {
    BedrockPreview: 360001185332,
    BedrockRelease: 360001186971,
};

function checkForRelease() {
    request(
        {
            url: "https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json",
            method: "GET",
        },
        async (error, res, body) => {
            if(error)
                return setTimeout(
                    () => checkForRelease(),
                    repeateInterval
                );
                
            try {
                const data = JSON.parse(body);
                const savedData = await getSavedData(data);
                await fs.writeFileSync(
                    "./data/mcupdate-articles.json",
                    JSON.stringify(data, null, 4)
                );
            
                if(savedData.articles.length < 1)
                    return setTimeout(
                        () => checkForRelease(),
                        repeateInterval
                    );
            
                const latestStable = data.articles.find(
                    (a) => 
                        a.section_id == articleSections.BedrockRelease
                        && !a.title.includes("Java Edition")
                );
                const lastSavedStable = savedData.articles.find(
                    (a) => 
                        a.section_id == articleSections.BedrockRelease
                        && !a.title.includes("Java Edition")
                );
            
                const latestPreview = data.articles.find(
                    (a) => a.section_id == articleSections.BedrockPreview
                );
                const lastSavedPreview = savedData.articles.find(
                    (a) => a.section_id == articleSections.BedrockPreview
                );
            
                if(lastSavedPreview?.id != latestPreview?.id) {
                    const version = latestPreview.name
                        .replace( "Minecraft Beta & Preview - ", "");

                    const parsed = htmlParser.parse(latestPreview.body);
                    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");
                    const image = 
                        imageSrc?.startsWith(
                            "https://feedback.minecraft.net/hc/article_attachments/"
                        ) 
                            ? imageSrc 
                            : null;

                    createForumPost(
                        latestPreview,
                        version,
                        image,
                        Config.tags.Preview,
                        true
                    );

                    console.log(
                        "\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" +
                        new Date().toLocaleTimeString() +
                        " - " +
                        latestPreview.name
                    );
                    setTimeout(
                        () => checkForRelease(),
                        repeateInterval
                    );
                } else if(lastSavedStable?.id != latestStable?.id) {
                    const version = latestStable.name
                        .replace("Minecraft - ", "")
                        .replace(" (Bedrock)", "");

                    const parsed = htmlParser.parse(latestStable.body);
                    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");
                    const image = 
                        imageSrc?.startsWith(
                            "https://feedback.minecraft.net/hc/article_attachments/"
                        )
                            ? imageSrc
                            : null;

                    createForumPost(
                        latestStable,
                        version,
                        image,
                        Config.tags.Stable
                    );

                    console.log(
                        "\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" +
                        new Date().toLocaleTimeString() +
                        " - " +
                        latestStable.name
                    );
                    setTimeout(
                        () => checkForRelease(),
                        repeateInterval
                    );
                } else setTimeout(
                    () => checkForRelease(),
                    repeateInterval
                );
            } catch(e) {}
        }
    );
};

async function getSavedData(data) {
    if(!fs.existsSync("./data"))
        fs.mkdirSync("./data");
        
    if(!fs.existsSync("./data/mcupdate-articles.json")) {
        fs.writeFile(
            "./data/mcupdate-articles.json", 
            JSON.stringify(data, null, 4), 
            () => {
                return data;
            }
        );
    } else {
        return
            JSON.parse(
                fs.readFileSync("./data/mcupdate-articles.json")
            );
    };
};

const headers = {
    headers: {
        Authorization: "Bot " + process.env.token,
    },
};

function createForumPost(article, version, image, tag, isPreview = false) {
    const embeds = [];
    embeds.push(
        {
            title: article.name,
            url: article.html_url,
            color: (
                isPreview 
                    ? 16763904
                    : 4652839
            ),
            description: (
                isPreview
                    ? "It's that day of the week!\nA new Minecraft Bedrock Preview is out now!"
                    : "A new stable release of Minecraft Bedrock is out now!"
            ),
            author: {
                name: "Minecraft Feedback",
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
                        ? "https://cdn.discordapp.com/attachments/1071081145149689857/1071088108898091139/mcpreview.png"
                        : "https://cdn.discordapp.com/attachments/1071081145149689857/1071088108642258984/icon.png"
                ),
            },
            image: {
                url: image,
            },
            timestamp: article.updated_at,
        }
    );
    
    axios.post(
        "https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads",
        {
            name: version + " - " + (isPreview ? "Preview" : "Release"),
            message: {
                embeds,
            },
            applied_tags: [
                tag,
            ],
        },
        headers,
    )
    .then(
        (response) => pinMessage(response)
    )
    .catch(
        (e) => setTimeout(
            () => createForumPost(article, version, image, tag, isPreview),
            5000
        )
    );
};

function pinMessage(response) {
    axios.put(
        "https://discord.com/api/v10/channels/" + response.data.id + "/pins/" + response.data.message.id,
        {},
        headers,
    )
    .catch(
        () => setTimeout(
            () => pinMessage(response),
            5000
        )
    );
};

console.log(`\x1B[33m\x1B[1mINFO | \x1B[37mStarting\n\x1B[0m`);
checkForRelease();
