const fs = require( "fs" );
const Utils = require( "./utils.js" );
const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
};

const saveChangelogs = () => {
	fetch(
		"https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100",
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	).then((res) => res.json())
	.then(
		async (data) => {
			const stableArticles = data.articles.filter(
				(a) => 
					a.section_id == articleSections.BedrockRelease
					&& !a.title.includes( "Java Edition" )
			).map( Utils.formatArticle );
			fs.writeFileSync( __dirname + "/data/stable-articles.json", JSON.stringify( stableArticles, null, 4 ) );

			const previewArticles = data.articles.filter(
				(a) => a.section_id == articleSections.BedrockPreview
			).map( Utils.formatArticle );
			fs.writeFileSync( __dirname + "/data/preview-articles.json", JSON.stringify( previewArticles, null, 4 ) );
		},
	);
};

saveChangelogs();
console.log(
	"\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Saving changelogs..."
);