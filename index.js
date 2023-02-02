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
    if(error) {
        console.log(error);
        return setTimeout(() => checkForRelease(), repeateInterval);
    }
    try {
        const data = JSON.parse(body);
        await fileExists(data);

        const savedData = await JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
        if(savedData.articles.find(a => a.section_id == articleSections.BedrockPreview)?.id
        != data.articles.find(a => a.section_id == articleSections.BedrockPreview).id) {
            console.log("Got data!");
            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockPreview);
            await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
            
            const version = currentArticle.name.replace("Minecraft Beta & Preview - ", "");
            const message = "# A new Beta/Preview is rolling out!\n\n- **Version**: " + version + "\n- **Changelog**: " + currentArticle.html_url;

            const parsed = htmlParser.parse(currentArticle.body);
		    const image = parsed.getElementsByTagName("img")[0]?.getAttribute("src");
            console.log(image);

            createForumPost(message, version, image, Config.tags.Preview, true);

            console.log("\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " - " + currentArticle.name);
            setTimeout(() => checkForRelease(), repeateInterval);
        }
        else if(savedData.articles.find(a => a.section_id == articleSections.BedrockRelease)?.id
            != data.articles.find(a => a.section_id == articleSections.BedrockRelease).id) {

            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockRelease);
            if(!currentArticle.name.includes("Bedrock")) return setTimeout(() => checkForRelease(), repeateInterval);

            await fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));

            const version = currentArticle.name.replace("Minecraft - ", "").replace(" (Bedrock)", "");
            const message = "# A new Stable release is rolling out!\n\n- **Version**: " + version + "\n- **Changelog** " + currentArticle.html_url;

            const parsed = htmlParser.parse(currentArticle.body);
		    const image = parsed.getElementsByTagName("img")[0]?.getAttribute("src");

            createForumPost(message, version, image, Config.tags.Stable);

            console.log("\x1B[32m\x1B[1mNEW RELEASE | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " | " + currentArticle.name);
            setTimeout(() => checkForRelease(), repeateInterval);
        } else setTimeout(() => checkForRelease(), repeateInterval);
    } catch(e) { console.log(e); setTimeout(() => checkForRelease(), repeateInterval); };
};

function createForumPost(message, version, image, tag, isPreview = false) {
    const embeds = [];
    if(image) embeds.push({ color: 3092790, image: { url: image }});
    axios.post("https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads", {
        name: version + " - " + (isPreview ? "Preview" : "Release"),
        message: {
            content: message,
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
        setTimeout(() => createForumPost(message, version, image, tag, isPreview), 5000)
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

async function fileExists(data) {
    if(!fs.existsSync("./data/"))
        fs.mkdirSync("./data"), fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
    else if(!fs.existsSync("./data/mcupdate-articles.json"))
        fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
    else try {
        JSON.parse(fs.readFileSync("./data/mcupdate-articles.json"));
    } catch(e) {
        fs.writeFileSync("./data/mcupdate-articles.json", JSON.stringify(data, null, 4));
    };
};

console.log(`\x1B[33m\x1B[1mINFO | \x1B[37mStarting\n\x1B[0m`);
checkForRelease();
