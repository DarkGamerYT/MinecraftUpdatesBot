const axios = require("axios");
const request = require("request");
const fs = require("fs");
const htmlParser = require("node-html-parser");
const Config = require("./config.json");
require("dotenv").config();

const repeateInterval = 60000;
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
            if(
                error
            )
                return setTimeout(
                    () => checkForRelease(),
                    repeateInterval,
                );
                
            try {
                const data = JSON.parse(body);
                const savedData = await getSavedData(
					data.articles.filter(
						(a) => 
							a.section_id == articleSections.BedrockRelease
							&& !a.title.includes("Java Edition")
					).map(
						(a) => (
							{
								id: a.id,
								title: a.title,
								body: a.body,
								html_url: a.html_url,
								section_id: a.section_id,
								created_at: a.created_at,
								updated_at: a.updated_at,
								edited_at: a.edited_at,
							}
						),
					),
				);
				const savedPreviewData = await getSavedData(
					data.articles.filter(
						(a) => a.section_id == articleSections.BedrockPreview
					).map(
						(a) => (
							{
								id: a.id,
								title: a.title,
								body: a.body,
								html_url: a.html_url,
								section_id: a.section_id,
								created_at: a.created_at,
								updated_at: a.updated_at,
								edited_at: a.edited_at,
							}
						),
					),
					true,
				);
            
                if(
					savedData.length < 1
					|| savedPreviewData.length < 1
				)
                    return setTimeout(
                        () => checkForRelease(),
                        repeateInterval,
                    );
            
                const latestStable = data.articles.find(
                    (a) => 
                        a.section_id == articleSections.BedrockRelease
                        && !a.title.includes("Java Edition")
                );
                const lastSavedStable = savedData.find(
                    (a) => 
                        a.section_id == articleSections.BedrockRelease
                        && !a.title.includes("Java Edition")
                );
            
                const latestPreview = data.articles.find(
                    (a) => a.section_id == articleSections.BedrockPreview
                );
                const lastSavedPreview = savedPreviewData.find(
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
                        true,
                    );

                    console.log(
                        "\n\x1B[0m" +
                        new Date().toLocaleTimeString() +
                        " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ",
                        latestPreview.name
                    );
					
					await fs.writeFileSync(
						"./data/preview-articles.json",
						JSON.stringify(
							data.articles.filter(
								(a) => a.section_id == articleSections.BedrockPreview
							).map(
								(a) => (
									{
										id: a.id,
										title: a.title,
										body: a.body,
										html_url: a.html_url,
										section_id: a.section_id,
										created_at: a.created_at,
										updated_at: a.updated_at,
										edited_at: a.edited_at,
									}
								),
							),
							null,
							4,
						),
					);
					
                    setTimeout(
                        () => checkForRelease(),
                        repeateInterval,
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
                        Config.tags.Stable,
                    );

                    console.log(
                        "\n\x1B[0m" +
                        new Date().toLocaleTimeString() +
                        " \x1B[32m\x1B[1m[NEW RELEASE] \x1B[0m- ",
                        latestStable.name
                    );
					
					await fs.writeFileSync(
						"./data/stable-articles.json",
						JSON.stringify(
							data.articles.filter(
								(a) =>
									a.section_id == articleSections.BedrockRelease
									&& !a.title.includes("Java Edition")
							).map(
								(a) => (
									{
										id: a.id,
										title: a.title,
										body: a.body,
										html_url: a.html_url,
										section_id: a.section_id,
										created_at: a.created_at,
										updated_at: a.updated_at,
										edited_at: a.edited_at,
									}
								),
							),
							null,
							4,
						),
					);
                    
					setTimeout(
                        () => checkForRelease(),
                        repeateInterval,
                    );
                } else setTimeout(
                    () => checkForRelease(),
                    repeateInterval,
                );
            } catch(e) {
              console.log(e);
            };
        },
    );
};

async function getSavedData(data, preview = false) {
    if(!fs.existsSync("./data"))
        fs.mkdirSync("./data");
        
    if(!fs.existsSync("./data/" + (preview ? "preview-articles" : "stable-articles") + ".json")) {
        fs.writeFile(
            "./data/" + (preview ? "preview-articles" : "stable-articles") + ".json", 
            JSON.stringify(data, null, 4), 
            () => {
                return data;
            }
        );
    } else {
        return JSON.parse(
            fs.readFileSync("./data/" + (preview ? "preview-articles" : "stable-articles") + ".json")
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
			footer: {
				text: "Posted on"
			},
            timestamp: article.updated_at,
        }
    );
    
    axios.post(
        "https://discord.com/api/v10/channels/" + Config.forumsChannel + "/threads",
        {
            name: 
                version +
                " - " +
                (
                    isPreview
                        ? "Preview"
                        : "Release"
                ),
            message: {
                embeds,
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
            applied_tags: [
                tag,
            ],
        },
        headers,
    )
    .then(
        ({ data: response }) => {
            try {
				pinMessage(response);
				pingPoggy(response);
			} catch(e) {}
        },
    )
    .catch(
        (e) => {
            console.log(e);
            setTimeout(
                () => createForumPost(article, version, image, tag, isPreview),
                5000
            );
        },
    );
};

function pinMessage(response) {
    axios.put(
        "https://discord.com/api/v10/channels/" +
        response.id +
        "/pins/" +
        response.message.id,
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

const pings = [
	"345885507420553217",
	"588670754233516032",
];

function pingPoggy(response) {
	axios.post(
		"https://discord.com/api/v10/channels/"
		+ response.id
		+ "/messages",
		{
			content: (
				"**Pings**:\n>>> "
				+ pings.map(
					(p) => "<@" + p + ">",
				)
				.join("\n")
			),
		},
		headers,
	).then(
		({ data: r }) => {
			console.log(
				"\x1B[0m" +
				new Date().toLocaleTimeString() +
				" \x1B[32m\x1B[1m[SUCCESS] \x1B[0m- " +
				"Successfully pinged Poggy!"
			);
			
			axios.delete(
				"https://discord.com/api/v10/channels/"
				+ response.id
				+ "/messages/"
				+ r.id,
				headers,
			).then(
				(re) => console.log(
					"\x1B[0m" +
					new Date().toLocaleTimeString() +
					" \x1B[32m\x1B[1m[SUCCESS] \x1B[0m- " +
					"SUccessfully deleted the ping message!"
				),
			).catch(
				(e) => console.log(
					"\x1B[0m" +
					new Date().toLocaleTimeString() +
					" \x1B[31m\x1B[1m[ERROR] \x1B[0m- " +
					"Failed to delete the ping message :["
				),
			);
		},
	).catch(
		(e) => console.log(
			"\x1B[0m" +
			new Date().toLocaleTimeString() +
			" \x1B[31m\x1B[1m[ERROR] \x1B[0m- ",
			"Failed to ping Poggy :["
		),
	);
};

console.log(
    "\x1B[0m" +
    new Date().toLocaleTimeString() +
    " \x1B[33m\x1B[1m[INFO] \x1B[0m- ",
    "Starting..."
);

checkForRelease();
