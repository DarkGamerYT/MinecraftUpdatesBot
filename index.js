const axios = require("axios");
const request = require("request");
const fs = require("fs");
const htmlParser = require("node-html-parser");
const Config = require("./config.json");
require("dotenv").config();

const repeateInterval = 10000;

const articleSections = {
    BedrockPreview: 360001185332,
    BedrockRelease: 360001186971,
};

function checkForRelease() {
    request({
        url: "https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json",
        method: "GET",
    }, callback);
};

async function callback(error, res, body) {
    if(error) return setTimeout(() => checkForRelease(), repeateInterval);
    try {
        const data = JSON.parse(body);
        const savedData = await readFile(data);

        if(savedData.articles.find(a => a.section_id == articleSections.BedrockPreview)?.id
        != data.articles.find(a => a.section_id == articleSections.BedrockPreview).id) {

            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockPreview);
            await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
            if(savedData.articles.length < 1) return setTimeout(() => checkForRelease(), repeateInterval);

            const version = currentArticle.name.replace("Minecraft Beta & Preview - ", "");

            const parsed = htmlParser.parse(currentArticle.body);
		    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");
            const image = imageSrc?.startsWith("https://feedback.minecraft.net/hc/article_attachments/") ? imageSrc : null;

            createForumPost(currentArticle, version, image, Config.tags.Preview, true);

            console.log("\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " - " + currentArticle.name);
            setTimeout(() => checkForRelease(), repeateInterval);
        }
        else if(savedData.articles.find(a => a.section_id == articleSections.BedrockRelease)?.id
            != data.articles.find(a => a.section_id == articleSections.BedrockRelease).id) {

            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockRelease);
            if(!currentArticle.name.includes("Bedrock")) return setTimeout(() => checkForRelease(), repeateInterval);

            await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
            if(savedData.articles.length < 1) return setTimeout(() => checkForRelease(), repeateInterval);
            
            const version = currentArticle.name.replace("Minecraft - ", "").replace(" (Bedrock)", "");

            const parsed = htmlParser.parse(currentArticle.body);
		    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");
            const image = imageSrc?.startsWith("https://feedback.minecraft.net/hc/article_attachments/") ? imageSrc : null;

            createForumPost(currentArticle, version, image, Config.tags.Stable);

            console.log("\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " | " + currentArticle.name);
            setTimeout(() => checkForRelease(), repeateInterval);
        } else setTimeout(() => checkForRelease(), repeateInterval);
    } catch(e) { console.log(e); setTimeout(() => checkForRelease(), repeateInterval); };
};

function createForumPost(article, version, image, tag, isPreview = false) {
    const embeds = [];
    embeds.push({
        title: article.name,
        url: article.html_url,
        color: (isPreview ? 16763904 : 4652839),
        description: (isPreview ? "It's that day of the week!\nA new Minecraft Bedrock Preview is out now!" : "A new stable release of Minecraft Bedrock is out now!"),
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
    });
    axios.post("https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads", {
        name: version + " - " + (isPreview ? "Preview" : "Release"),
        message: {
            embeds,
        },
        applied_tags: [
            tag,
        ],
    },
    {
        headers: {
            Authorization: "Bot " + process.env.token,
        },
    },
    )
    .then((response) => pinMessage(response))
    .catch((e) => {
        console.log(e);
        setTimeout(() => createForumPost(article, version, image, tag, isPreview), 5000)
    });
};

function pinMessage(response) {
    axios.put("https://discord.com/api/v10/channels/" + response.data.id + "/pins/" + response.data.message.id, {},
    {
        headers: {
            Authorization: "Bot " + process.env.token,
        },
    })
    .catch(() => setTimeout(() => pinMessage(response), 5000));
};

async function readFile(data) {
    if(!fs.existsSync("./data/")) {
        fs.mkdirSync("./data");
        await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
        return JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
    } else if(!fs.existsSync("./data/mcupdate-articles.json")) {
        await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
        return JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
    } else try {
        return JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
    } catch(e) {
        await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
        return JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
    };
};

console.log(`\x1B[33m\x1B[1mINFO | \x1B[37mStarting\n\x1B[0m`);
checkForRelease();
