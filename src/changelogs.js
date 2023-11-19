const fs = require( "fs" );
const Utils = require( "./utils.js" );
const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
};

let stableArticles = [];
let previewArticles = [];
const saveChangelogs = async() => {
	await fetch(
		"https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100",
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	).then((res) => res.json())
	.then(
		async (data) => {
			for (let i = 1; i <= data.page_count; i++) {
				await fetch(
					"https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100&page=" + i,
					{
						method: "GET",
						headers: { "Content-Type": "application/json" },
					},
				).then((res) => res.json())
				.then(
					async (data) => {
						const stable = data.articles.filter(
							(a) => 
								a.section_id == articleSections.BedrockRelease
								&& !a.title.includes( "Java Edition" )
						).map( Utils.formatArticle );
						const preview = data.articles.filter(
							(a) => a.section_id == articleSections.BedrockPreview
						).map( Utils.formatArticle );

						stableArticles = [ ...stableArticles, ...stable ];
						previewArticles = [ ...previewArticles, ...preview ];
					},
				);
			};
			
			fs.writeFileSync( __dirname + "/data/stable-articles.json", JSON.stringify( stableArticles, null, 4 ) );
			fs.writeFileSync( __dirname + "/data/preview-articles.json", JSON.stringify( previewArticles, null, 4 ) );
		},
	);
};

saveChangelogs();
module.exports = saveChangelogs;