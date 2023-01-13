const axios = require("axios");
const request = require("request");
const fs = require("fs");
const Config = require("./config.json");
require("dotenv").config();

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
    if(error) return setTimeout(() => checkForRelease(), 5000);
    try {
        const data = JSON.parse(body);
        await fileExists(data);
        const savedData = await JSON.parse(fs.readFileSync("./json/mcupdate-articles.json"));
        if(savedData.articles.find(a => a.section_id == articleSections.BedrockPreview).id
        != data.articles.find(a => a.section_id == articleSections.BedrockPreview).id) {

            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockPreview);
            await fs.writeFileSync("./json/mcupdate-articles.json", JSON.stringify(data, null, 4));

            const version = currentArticle.name.replace("Minecraft Beta & Preview - ", "");
            try {
                axios.post("https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads", {
                        name: version + " - Preview",
                        message: {
                            content: "# A new Beta/Preview is rolling out!\n\n- **Version**: " + version + "\n- **Changelog**: " + currentArticle.html_url,
                        },
                        applied_tags: [
                            Config.tags.Preview,
                        ],
                    },
                    {
                        headers: {
                            Authorization: "Bot " + process.env.token,
                        },
                    },
                ).then((response) => {
                    axios.put("https://discord.com/api/v10/channels/" + response.data.id + "/pins/" + response.data.message.id, {},
                    {
                        headers: {
                            Authorization: "Bot " + process.env.token,
                        },
                    });
                }).catch(() => console.log("Failed to create the Post for Preview v" + version + "!"));
            } catch(e) {}

            console.log("\x1B[32m\x1B[1mSUCCESS | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " - " + currentArticle.name);
            setTimeout(() => checkForRelease(), 5000);
        }
        else if(savedData.articles.find(a => a.section_id == articleSections.BedrockRelease).id
            != data.articles.find(a => a.section_id == articleSections.BedrockRelease).id) {

            const currentArticle = data.articles.find(a => a.section_id == articleSections.BedrockRelease);
            if(!currentArticle.name.includes("Bedrock")) return setTimeout(() => checkForRelease(), 5000);

            await fs.writeFileSync("./json/mcupdate-articles.json", JSON.stringify(data, null, 4));

            const version = currentArticle.name.replace("Minecraft - ", "").replace(" (Bedrock)", "");
            try {
                axios.post("https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads", {
                        name: version + " - Release",
                        message: {
                            content: "# A new Stable release is rolling out!\n\n- **Version**: " + version + "\n- **Changelog** " + currentArticle.html_url,
                        },
                        applied_tags: [
                            Config.tags.Stable,
                        ],
                    },
                    {
                        headers: {
                            Authorization: "Bot " + process.env.token,
                        },
                    },
                ).then((response) => {
                    axios.put("https://discord.com/api/v10/channels/" + response.data.id + "/pins/" + response.data.message.id, {},
                    {
                        headers: {
                            Authorization: "Bot " + process.env.token,
                        },
                    });
                }).catch(() => console.log("Failed to create the Post for Stable v" + version + "!"));
            } catch(e) {}

            console.log("\x1B[32m\x1B[1mSUCCESS | \x1B[0m" + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " | " + currentArticle.name);
            setTimeout(() => checkForRelease(), 5000);
        } else setTimeout(() => checkForRelease(), 5000);
    } catch(e) { setTimeout(() => checkForRelease(), 5000); };
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