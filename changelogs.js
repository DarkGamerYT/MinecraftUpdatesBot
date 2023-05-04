const request = require( "request" );
const fs = require( "fs" );
const htmlParser = require( "node-html-parser" );
const Utils = require( "./utils.js" );

const articleSections = {
	BedrockPreview: 360001185332,
	BedrockRelease: 360001186971,
	JavaSnapshot: 360002267532,
	JavaRelease: 360001186971,
};

const saveChangelogs = () => {
	request(
		{
			url: "https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100",
			method: "GET",
		},
		async (error, res, body) => {
			if (error) return;
            const data = JSON.parse(body);
			const stableArticles = data.articles.filter(
				(a) => 
					a.section_id == articleSections.BedrockRelease
					&& !a.title.includes( "Java Edition" )
			).map( Utils.formatArticle );

			fs.writeFileSync(
				"./data/stable-articles.json",
				JSON.stringify(
					stableArticles,
					null,
					4,
				),
			);

			const previewArticles = data.articles.filter(
				(a) => a.section_id == articleSections.BedrockPreview
			).map( Utils.formatArticle );

			fs.writeFileSync(
				"./data/preview-articles.json",
				JSON.stringify(
					previewArticles,
					null,
					4,
				),
			);

			const javaStableArticles = data.articles.filter(
				(a) =>
					a.section_id == articleSections.JavaRelease
					&& a.title.includes( "Java Edition" )
			).map( Utils.formatArticle );

			fs.writeFileSync(
				"./data/java-stable-articles.json",
				JSON.stringify(
					javaStableArticles,
					null,
					4,
				),
			);

			const snapshotArticles = data.articles.filter(
				(a) => a.section_id == articleSections.JavaSnapshot
			).map( Utils.formatArticle );

			fs.writeFileSync(
				"./data/snapshot-articles.json",
				JSON.stringify(
					snapshotArticles,
					null,
					4,
				),
			);
		},
	);
};

saveChangelogs();
console.log(
	"\x1B[0m" + new Date().toLocaleTimeString() + " \x1B[33m\x1B[1m[INFO] \x1B[0m- Saving changelogs..."
);